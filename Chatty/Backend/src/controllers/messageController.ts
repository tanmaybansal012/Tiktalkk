import { Request, Response } from "express"
import User from "../models/users";
import message from "../models/message";
import cloudinary from "../lib/cloudinary";
import { getReceiverSocketId, io } from "../lib/socket";
import mongoose from "mongoose";
import Group from "../models/group";


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

export const editMessage = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { text } = req.body;
        const senderId = (req as any).user._id;

        const msg = await message.findById(id);
        if (!msg) return res.status(404).json({ message: "Message not found" });

        if (msg.senderId.toString() !== senderId.toString()) {
            return res.status(403).json({ message: "Unauthorized to edit this message" });
        }

        msg.text = text;
        await msg.save();

        // Emit to correct room or user
        if (msg.groupId) {
            io.to(msg.groupId.toString()).emit("messageEdited", msg);
        } else if (msg.receiverId) {
            const receiverSocketId = getReceiverSocketId(msg.receiverId.toString());
            const senderSocketId = getReceiverSocketId(senderId.toString());
            if (receiverSocketId) io.to(receiverSocketId).emit("messageEdited", msg);
            if (senderSocketId) io.to(senderSocketId).emit("messageEdited", msg);
        }

        res.status(200).json(msg);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const deleteMessage = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const senderId = (req as any).user._id;

        const msg = await message.findById(id);
        if (!msg) return res.status(404).json({ message: "Message not found" });

        if (msg.senderId.toString() !== senderId.toString()) {
            return res.status(403).json({ message: "Unauthorized to delete this message" });
        }

        await message.findByIdAndDelete(id);

        // Emit to correct room or user
        if (msg.groupId) {
            io.to(msg.groupId.toString()).emit("messageDeleted", { messageId: id, groupId: msg.groupId });
        } else if (msg.receiverId) {
            const receiverSocketId = getReceiverSocketId(msg.receiverId.toString());
            const senderSocketId = getReceiverSocketId(senderId.toString());
            if (receiverSocketId) io.to(receiverSocketId).emit("messageDeleted", { messageId: id, receiverId: msg.receiverId });
            if (senderSocketId) io.to(senderSocketId).emit("messageDeleted", { messageId: id, receiverId: msg.receiverId });
        }

        res.status(200).json({ message: "Message deleted successfully", messageId: id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal server error" });
    }
};