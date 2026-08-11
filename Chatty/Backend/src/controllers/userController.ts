import { Request, Response } from "express";
import User from "../models/users";
import { getReceiverSocketId, io } from "../lib/socket";
import mongoose from "mongoose";

export const searchUsers = async (req: Request, res: Response) => {
    try {
        const { query } = req.query;
        const userId = (req as any).user._id;

        if (!query || typeof query !== "string") {
            return res.status(400).json({ message: "Search query is required" });
        }

        const currentUser = await User.findById(userId);
        if (!currentUser) return res.status(404).json({ message: "User not found" });

        const excludeIds = [
            new mongoose.Types.ObjectId(userId),
            ...(currentUser.friends || []),
        ];

        const users = await User.find({
            _id: { $nin: excludeIds },
            fullName: { $regex: query, $options: "i" },
        }).select("fullName email profilePic").limit(20);

        res.status(200).json(users);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getFriends = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user._id;

        const user = await User.findById(userId).populate(
            "friends",
            "fullName email profilePic lastSeen"
        );
        if (!user) return res.status(404).json({ message: "User not found" });

        res.status(200).json(user.friends || []);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getFriendRequests = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user._id;

        const user = await User.findById(userId)
            .populate("friendRequests.sent", "fullName email profilePic")
            .populate("friendRequests.received", "fullName email profilePic");

        if (!user) return res.status(404).json({ message: "User not found" });

        res.status(200).json({
            sent: user.friendRequests?.sent || [],
            received: user.friendRequests?.received || [],
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const sendFriendRequest = async (req: Request, res: Response) => {
    try {
        const senderId = (req as any).user._id;
        const { userId: receiverId } = req.params;

        if (senderId.toString() === receiverId) {
            return res.status(400).json({ message: "Cannot send a friend request to yourself" });
        }

        const [sender, receiver] = await Promise.all([
            User.findById(senderId),
            User.findById(receiverId),
        ]);

        if (!sender || !receiver) {
            return res.status(404).json({ message: "User not found" });
        }

        // Check if already friends
        if (sender.friends?.some((id) => id.toString() === receiverId)) {
            return res.status(400).json({ message: "Already friends" });
        }

        // Check if request already sent
        if (sender.friendRequests?.sent?.some((id) => id.toString() === receiverId)) {
            return res.status(400).json({ message: "Friend request already sent" });
        }

        // Check if there's a pending request from the receiver
        if (sender.friendRequests?.received?.some((id) => id.toString() === receiverId)) {
            return res.status(400).json({ message: "This user already sent you a request. Accept it instead." });
        }

        await User.findByIdAndUpdate(senderId, {
            $addToSet: { "friendRequests.sent": receiverId },
        });
        await User.findByIdAndUpdate(receiverId, {
            $addToSet: { "friendRequests.received": senderId },
        });

        // Real-time notification
        const receiverSocketId = getReceiverSocketId(receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("friendRequestReceived", {
                _id: sender._id,
                fullName: sender.fullName,
                email: sender.email,
                profilePic: sender.profilePic,
            });
        }

        res.status(200).json({ message: "Friend request sent" });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const acceptFriendRequest = async (req: Request, res: Response) => {
    try {
        const currentUserId = (req as any).user._id;
        const { userId: requesterId } = req.params;

        const currentUser = await User.findById(currentUserId);
        if (!currentUser) return res.status(404).json({ message: "User not found" });

        // Verify the request exists
        if (!currentUser.friendRequests?.received?.some((id) => id.toString() === requesterId)) {
            return res.status(400).json({ message: "No pending friend request from this user" });
        }

        // Add each other as friends & clean up request arrays
        await User.findByIdAndUpdate(currentUserId, {
            $addToSet: { friends: requesterId },
            $pull: {
                "friendRequests.received": new mongoose.Types.ObjectId(requesterId),
            },
        });
        await User.findByIdAndUpdate(requesterId, {
            $addToSet: { friends: currentUserId },
            $pull: {
                "friendRequests.sent": new mongoose.Types.ObjectId(currentUserId),
            },
        });

        // Notify the original requester
        const requesterSocketId = getReceiverSocketId(requesterId);
        if (requesterSocketId) {
            const accepter = await User.findById(currentUserId).select("fullName email profilePic lastSeen");
            io.to(requesterSocketId).emit("friendRequestAccepted", accepter);
        }

        res.status(200).json({ message: "Friend request accepted" });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const rejectFriendRequest = async (req: Request, res: Response) => {
    try {
        const currentUserId = (req as any).user._id;
        const { userId: requesterId } = req.params;

        await User.findByIdAndUpdate(currentUserId, {
            $pull: {
                "friendRequests.received": new mongoose.Types.ObjectId(requesterId),
            },
        });
        await User.findByIdAndUpdate(requesterId, {
            $pull: {
                "friendRequests.sent": new mongoose.Types.ObjectId(currentUserId),
            },
        });

        res.status(200).json({ message: "Friend request rejected" });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const unfriend = async (req: Request, res: Response) => {
    try {
        const currentUserId = (req as any).user._id;
        const { userId: friendId } = req.params;

        await User.findByIdAndUpdate(currentUserId, {
            $pull: { friends: new mongoose.Types.ObjectId(friendId) },
        });
        await User.findByIdAndUpdate(friendId, {
            $pull: { friends: new mongoose.Types.ObjectId(currentUserId) },
        });

        res.status(200).json({ message: "Unfriended successfully" });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Internal server error" });
    }
};
