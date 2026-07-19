import { Request, Response } from "express"
import bcrypt from 'bcryptjs'
import User from "../models/users";
import { generateToken } from "../lib/utils";
import cloudinary from "../lib/cloudinary";

export const signup = async (req: Request, res: Response) => {
    const { fullName, email, password } = req.body;

    try {
        if (!fullName || !email || !password) return res.status(400).json({ message: "All fields are required!" });
        if (password.length < 6) return res.status(400).json({ message: "The password must contain atleast 6 characters!" });
        const user = await User.findOne({ email: email });
        if (user) return res.status(409).json({ message: "Email already exists, try loging in." });
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            fullName,
            password: hashedPassword,
            email,
        });

        if (newUser) {
            generateToken(newUser._id, res);
            await newUser.save();
            res.status(201).json({
                _id: newUser._id,
                fullName: newUser.fullName,
                email: newUser.email,
                profilePic: newUser.profilePic,
            }); //201 - something was created
        } else res.status(400).json({ message: "Invalid user data!" });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Internal server error!" })
    }
};

export const login = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: "The user does not exist!" });

        if (!user.password) return res.status(401).json({ message: "Password field is required" })

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) return res.status(401).json({ message: "Invalid credentials" });
        generateToken(user._id, res);

        res.status(200).json({
            _id: user._id,
            fullName: user.fullName,
            email: user.email,
            profilePic: user.profilePic,
        });

    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Internal server error!" });
    }
};

export const logout = (req: Request, res: Response) => {
    try {
        res.cookie("jwt", "", { maxAge: 0 });
        res.status(200).json({ message: "Logged out successfully" });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const updateProfile = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user._id;

        if (!req.file) return res.status(400).json({ message: "Profile picture is required!" });

        const uploadResponse = await cloudinary.uploader.upload(
            `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`,
            {
                folder: "avatars",
                transformation: [
                    { width: 256, height: 256, crop: "fill" }
                ],
            }
        );

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { profilePic: uploadResponse.secure_url },
            { new: true }
        );
        if (!updatedUser) return res.status(400).json({ message: "Something went wrong" });
        res.status(200).json({
            profilePic: updatedUser.profilePic
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal server error" });
    }

};

export const checkAuth = (req: Request, res: Response) => {
    try {
        res.status(200).json(req.user);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Internal server error" });
    }
};