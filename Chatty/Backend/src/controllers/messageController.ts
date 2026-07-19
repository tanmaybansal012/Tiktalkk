import { Request, Response } from "express"
import User from "../models/users";
import message from "../models/message";
import cloudinary from "../lib/cloudinary";
import { getReceiverSocketId, io } from "../lib/socket";
import mongoose from "mongoose";


export const getUsersForSidebar = async (req: Request, res: Response) => {
    try {
        const loggedInUserId = (req as any).user._id;
        const filteredUsers = await User.find({
            _id: { $ne: new mongoose.Types.ObjectId(loggedInUserId) }
        }).select("-password");
        res.status(200).json(filteredUsers);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getMessages = async (req: Request, res: Response) => {
    try {

        const { id: userToChatId } = req.params;
        const senderId = (req as any).user._id;
        const messages = await message.find({
            $or: [
                { senderId: senderId, receiverId: userToChatId },
                { senderId: userToChatId, receiverId: senderId }
            ] as any
        })
        res.status(200).json(messages);
    } catch (error) {

    }
};

export const sendMessages = async (req: Request, res: Response) => {
    try {
        const { text, image } = req.body;
        const { id: receiverId } = req.params;
        const senderId = (req as any).user._id;

        let imageURL;
        if (image) {
            const uploadResponse = await cloudinary.uploader.upload(image);
            imageURL = uploadResponse.secure_url;
        }
        if (!receiverId) return res.status(400).json({ message: "Receiver ID is required" });
        const newMessage = new message({
            text,
            image: imageURL,
            senderId,
            receiverId,
        });

        await newMessage.save();

        const receiverSocketId = getReceiverSocketId(receiverId.toString());
        const senderSocketId = getReceiverSocketId(senderId.toString());

        if (receiverSocketId) {
            io.to(receiverSocketId).emit("newMessage", newMessage);
        }

        if (senderSocketId) {
            io.to(senderSocketId).emit("newMessage", newMessage);
        }

        res.status(200).json(newMessage);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Internal server error" });
    }
};