import { Request, Response } from "express";
import Group from "../models/group";
import message from "../models/message";
import User from "../models/users";
import cloudinary from "../lib/cloudinary";
import { io, getReceiverSocketId } from "../lib/socket";
import mongoose from "mongoose";

export const createGroup = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user._id;
        const { name, members } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ message: "Group name is required" });
        }

        if (!members || !Array.isArray(members) || members.length === 0) {
            return res.status(400).json({ message: "At least one member is required" });
        }

        // Verify all members are friends of the creator
        const creator = await User.findById(userId);
        if (!creator) return res.status(404).json({ message: "User not found" });

        const friendIds = (creator.friends || []).map((id) => id.toString());
        const invalidMembers = members.filter((id: string) => !friendIds.includes(id));
        if (invalidMembers.length > 0) {
            return res.status(400).json({ message: "All members must be your friends" });
        }

        // Creator is automatically a member + admin
        const allMembers = [userId, ...members];
        const uniqueMembers = [...new Set(allMembers.map((m: string) => m.toString()))];

        const group = new Group({
            name: name.trim(),
            members: uniqueMembers,
            admins: [userId],
            createdBy: userId,
        });

        await group.save();

        const populatedGroup = await Group.findById(group._id)
            .populate("members", "fullName email profilePic lastSeen")
            .populate("admins", "fullName email profilePic")
            .populate("createdBy", "fullName email profilePic");

        // Notify all members via socket to join the group room
        for (const memberId of uniqueMembers) {
            const socketId = getReceiverSocketId(memberId.toString());
            if (socketId) {
                io.to(socketId).emit("groupCreated", populatedGroup);
                // Tell the socket to join the group room
                const memberSocket = io.sockets.sockets.get(socketId);
                if (memberSocket) {
                    memberSocket.join(group._id.toString());
                }
            }
        }

        res.status(201).json(populatedGroup);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getGroups = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user._id;

        const groups = await Group.find({ members: userId })
            .populate("members", "fullName email profilePic lastSeen")
            .populate("admins", "fullName email profilePic")
            .populate("createdBy", "fullName email profilePic")
            .sort({ updatedAt: -1 });

        res.status(200).json(groups);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getGroupMessages = async (req: Request, res: Response) => {
    try {
        const { groupId } = req.params;
        const userId = (req as any).user._id;

        // Verify user is a member
        const group = await Group.findById(groupId);
        if (!group) return res.status(404).json({ message: "Group not found" });

        const isMember = group.members.some(
            (id) => id.toString() === userId.toString()
        );
        if (!isMember) {
            return res.status(403).json({ message: "You are not a member of this group" });
        }

        const messages = await message.find({ groupId })
            .populate("senderId", "fullName profilePic")
            .sort({ createdAt: 1 });

        res.status(200).json(messages);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const sendGroupMessage = async (req: Request, res: Response) => {
    try {
        const { groupId } = req.params;
        const { text, image } = req.body;
        const senderId = (req as any).user._id;

        // Verify user is a member
        const group = await Group.findById(groupId);
        if (!group) return res.status(404).json({ message: "Group not found" });

        const isMember = group.members.some(
            (id) => id.toString() === senderId.toString()
        );
        if (!isMember) {
            return res.status(403).json({ message: "You are not a member of this group" });
        }

        let imageURL;
        if (image) {
            const uploadResponse = await cloudinary.uploader.upload(image);
            imageURL = uploadResponse.secure_url;
        }

        const newMessage = new message({
            text,
            image: imageURL,
            senderId,
            groupId,
        });

        await newMessage.save();

        const populatedMessage = await message.findById(newMessage._id)
            .populate("senderId", "fullName profilePic");

        // Broadcast to the group room
        io.to(groupId).emit("newGroupMessage", populatedMessage);

        res.status(200).json(populatedMessage);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const addMember = async (req: Request, res: Response) => {
    try {
        const { groupId } = req.params;
        const { userId: newMemberId } = req.body;

        if (!newMemberId) {
            return res.status(400).json({ message: "User ID is required" });
        }

        const group = (req as any).group;

        // Check if already a member
        if (group.members.some((id: mongoose.Types.ObjectId) => id.toString() === newMemberId)) {
            return res.status(400).json({ message: "User is already a member" });
        }

        const targetUser = await User.findById(newMemberId);
        if (!targetUser) return res.status(404).json({ message: "User not found" });

        await Group.findByIdAndUpdate(groupId, {
            $addToSet: { members: newMemberId },
        });

        const updatedGroup = await Group.findById(groupId)
            .populate("members", "fullName email profilePic lastSeen")
            .populate("admins", "fullName email profilePic")
            .populate("createdBy", "fullName email profilePic");

        // Notify the new member to join the room
        const socketId = getReceiverSocketId(newMemberId);
        if (socketId) {
            io.to(socketId).emit("addedToGroup", updatedGroup);
            const memberSocket = io.sockets.sockets.get(socketId);
            if (memberSocket) {
                memberSocket.join(groupId);
            }
        }

        // Notify existing members
        io.to(groupId).emit("groupUpdated", updatedGroup);

        res.status(200).json(updatedGroup);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const removeMember = async (req: Request, res: Response) => {
    try {
        const { groupId, userId: targetUserId } = req.params;
        const group = (req as any).group;

        // Cannot remove the creator
        if (group.createdBy.toString() === targetUserId) {
            return res.status(400).json({ message: "Cannot remove the group creator" });
        }

        await Group.findByIdAndUpdate(groupId, {
            $pull: {
                members: new mongoose.Types.ObjectId(targetUserId),
                admins: new mongoose.Types.ObjectId(targetUserId),
            },
        });

        const updatedGroup = await Group.findById(groupId)
            .populate("members", "fullName email profilePic lastSeen")
            .populate("admins", "fullName email profilePic")
            .populate("createdBy", "fullName email profilePic");

        // Notify the removed user
        const socketId = getReceiverSocketId(targetUserId);
        if (socketId) {
            io.to(socketId).emit("removedFromGroup", { groupId });
            const memberSocket = io.sockets.sockets.get(socketId);
            if (memberSocket) {
                memberSocket.leave(groupId);
            }
        }

        // Notify remaining members
        io.to(groupId).emit("groupUpdated", updatedGroup);

        res.status(200).json(updatedGroup);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const promoteToAdmin = async (req: Request, res: Response) => {
    try {
        const { groupId, userId: targetUserId } = req.params;
        const group = (req as any).group;

        // Verify target is a member
        const isMember = group.members.some(
            (id: mongoose.Types.ObjectId) => id.toString() === targetUserId
        );
        if (!isMember) {
            return res.status(400).json({ message: "User is not a member of this group" });
        }

        // Check if already an admin
        const isAlreadyAdmin = group.admins.some(
            (id: mongoose.Types.ObjectId) => id.toString() === targetUserId
        );
        if (isAlreadyAdmin) {
            return res.status(400).json({ message: "User is already an admin" });
        }

        await Group.findByIdAndUpdate(groupId, {
            $addToSet: { admins: targetUserId },
        });

        const updatedGroup = await Group.findById(groupId)
            .populate("members", "fullName email profilePic lastSeen")
            .populate("admins", "fullName email profilePic")
            .populate("createdBy", "fullName email profilePic");

        io.to(groupId).emit("groupUpdated", updatedGroup);

        res.status(200).json(updatedGroup);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const updateGroup = async (req: Request, res: Response) => {
    try {
        const { groupId } = req.params;
        const { name, groupIcon } = req.body;

        const updateData: Record<string, string> = {};
        if (name && name.trim()) updateData.name = name.trim();
        if (groupIcon) updateData.groupIcon = groupIcon;

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ message: "Nothing to update" });
        }

        const updatedGroup = await Group.findByIdAndUpdate(
            groupId,
            updateData,
            { new: true }
        )
            .populate("members", "fullName email profilePic lastSeen")
            .populate("admins", "fullName email profilePic")
            .populate("createdBy", "fullName email profilePic");

        io.to(groupId).emit("groupUpdated", updatedGroup);

        res.status(200).json(updatedGroup);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const deleteGroup = async (req: Request, res: Response) => {
    try {
        const { groupId } = req.params;
        const userId = (req as any).user._id;
        const group = (req as any).group;

        // Only the creator can delete the group
        if (group.createdBy.toString() !== userId.toString()) {
            return res.status(403).json({ message: "Only the group creator can delete this group" });
        }

        // Notify all members before deleting
        io.to(groupId).emit("groupDeleted", { groupId });

        // Delete all group messages
        await message.deleteMany({ groupId });

        // Delete the group
        await Group.findByIdAndDelete(groupId);

        res.status(200).json({ message: "Group deleted successfully" });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const updateGroupPhoto = async (req: Request, res: Response) => {
    try {
        const { groupId } = req.params;
        const { groupIcon } = req.body;

        if (!groupIcon) {
            return res.status(400).json({ message: "Group icon is required" });
        }

        const uploadResponse = await cloudinary.uploader.upload(groupIcon);
        
        const updatedGroup = await Group.findByIdAndUpdate(
            groupId,
            { groupIcon: uploadResponse.secure_url },
            { new: true }
        )
            .populate("members", "fullName email profilePic lastSeen")
            .populate("admins", "fullName email profilePic")
            .populate("createdBy", "fullName email profilePic");

        io.to(groupId).emit("groupUpdated", updatedGroup);

        res.status(200).json(updatedGroup);
    } catch (error) {
        console.log("Error in update group photo", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
