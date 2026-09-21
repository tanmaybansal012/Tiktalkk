import { Server } from "socket.io";
import http from "http";
import express from "express";
import User from "../models/users";
import Group from "../models/group";
import { isAllowedOrigin } from "../config/allowedOrigins";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: (origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) => {
      callback(null, isAllowedOrigin(origin));
    },
    credentials: true,
    methods: ["GET", "POST"],
  },
});

const userSocketMap: Record<string, string> = {};

export function getReceiverSocketId(userId: string) {
  return userSocketMap[userId];
}

const broadcastOnlineFriends = async () => {
  const connectedUserIds = Object.keys(userSocketMap);
  const connectedUsers = new Set(connectedUserIds);

  await Promise.all(connectedUserIds.map(async (userId) => {
    const user = await User.findById(userId).select("friends").lean();
    const onlineFriendIds = (user?.friends || [])
      .map((friendId) => friendId.toString())
      .filter((friendId) => connectedUsers.has(friendId));
    const socketId = userSocketMap[userId];

    if (socketId) {
      io.to(socketId).emit("getOnlineUsers", onlineFriendIds);
    }
  }));
};

io.on("connection", async (socket) => {
  console.log("User connected:", socket.id);

  const userId = socket.handshake.query.userId as string;

  if (userId) {
    userSocketMap[userId] = socket.id; // ✅ REAL mapping

    // Auto-join all group rooms the user belongs to
    try {
      const groups = await Group.find({ members: userId }).select("_id");
      for (const group of groups) {
        socket.join(group._id.toString());
      }
    } catch (err) {
      console.error("Failed to join group rooms:", err);
    }
  }

  await broadcastOnlineFriends();

  // Allow a socket to join a new group room dynamically
  socket.on("joinGroup", (groupId: string) => {
    socket.join(groupId);
  });

  socket.on("disconnect", async () => {
    console.log("User disconnected:", socket.id);

    if (userId) {
      if (userSocketMap[userId] === socket.id) {
        delete userSocketMap[userId];
      }

      // Persist lastSeen timestamp
      try {
        await User.findByIdAndUpdate(userId, { lastSeen: new Date() });
      } catch (err) {
        console.error("Failed to update lastSeen:", err);
      }
    }

    await broadcastOnlineFriends();
  });
});

export { io, server, app };
