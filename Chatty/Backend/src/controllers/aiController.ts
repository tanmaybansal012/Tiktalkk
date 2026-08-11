import { Request, Response } from "express";
import message from "../models/message";
import Group from "../models/group";

export const getSmartReplies = async (req: Request, res: Response) => {
    try {
        const { messageText } = req.body;
        if (!messageText) return res.status(400).json({ message: "Message text is required" });

        if (!process.env.GEMINI_API_KEY) {
             return res.status(500).json({ message: "GEMINI_API_KEY is not configured on the server" });
        }

        const { GoogleGenAI } = await import("@google/genai");
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const prompt = `Generate exactly 3 short, conversational, and natural replies to the following message. Return ONLY a valid JSON array of strings, nothing else. Message: "${messageText}"`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });

        let replies = [];
        try {
            const rawText = response.text || "[]";
            const jsonMatch = rawText.match(/\[.*\]/s);
            if (jsonMatch) {
                replies = JSON.parse(jsonMatch[0]);
            } else {
                replies = JSON.parse(rawText);
            }
        } catch (e) {
            console.error("Failed to parse AI response:", e, response.text);
            return res.status(500).json({ message: "Failed to parse AI response" });
        }

        res.status(200).json(replies.slice(0, 3));
    } catch (err: any) {
        console.error("Gemini API Error:", err.status, err.message);
        if (err.status === 429) {
            return res.status(429).json({ message: "AI rate limit exceeded. Please wait a moment and try again." });
        }
        res.status(500).json({ message: "Internal server error" });
    }
};

export const summarizeUserChat = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const currentUserId = (req as any).user._id;

        if (!process.env.GEMINI_API_KEY) {
             return res.status(500).json({ message: "GEMINI_API_KEY is not configured on the server" });
        }

        const messages = await message.find({
            $or: [
                { senderId: currentUserId, receiverId: userId },
                { senderId: userId, receiverId: currentUserId }
            ] as any
        })
            .populate("senderId", "fullName")
            .sort({ createdAt: -1 })
            .limit(30);

        if (!messages.length) return res.status(400).json({ message: "Not enough messages to summarize" });

        messages.reverse();

        const transcript = messages.map((m: any) => `${m.senderId.fullName}: ${m.text || "[Image]"}`).join("\n");

        const { GoogleGenAI } = await import("@google/genai");
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const prompt = `Summarize the following chat conversation in exactly 3 concise sentences. Focus on the main topics discussed. \n\nChat Transcript:\n${transcript}`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });

        res.status(200).json({ summary: response.text });
    } catch (err: any) {
        console.error("Gemini API Error:", err.status, err.message);
        if (err.status === 429) {
            return res.status(429).json({ message: "AI rate limit exceeded. Please wait a moment and try again." });
        }
        res.status(500).json({ message: "Internal server error" });
    }
};

export const summarizeGroupChat = async (req: Request, res: Response) => {
    try {
        const { groupId } = req.params;
        const currentUserId = (req as any).user._id;

        if (!process.env.GEMINI_API_KEY) {
             return res.status(500).json({ message: "GEMINI_API_KEY is not configured on the server" });
        }

        const group = await Group.findById(groupId);
        if (!group) return res.status(404).json({ message: "Group not found" });

        const isMember = group.members.some(id => id.toString() === currentUserId.toString());
        if (!isMember) return res.status(403).json({ message: "Not a member" });

        const messages = await message.find({ groupId })
            .populate("senderId", "fullName")
            .sort({ createdAt: -1 })
            .limit(30);

        if (!messages.length) return res.status(400).json({ message: "Not enough messages to summarize" });

        messages.reverse();

        const transcript = messages.map((m: any) => `${m.senderId.fullName}: ${m.text || "[Image]"}`).join("\n");

        const { GoogleGenAI } = await import("@google/genai");
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const prompt = `Summarize the following group chat conversation in exactly 3 concise sentences. Focus on the main topics discussed. \n\nChat Transcript:\n${transcript}`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });

        res.status(200).json({ summary: response.text });
    } catch (err: any) {
        console.error("Gemini API Error:", err.status, err.message);
        if (err.status === 429) {
            return res.status(429).json({ message: "AI rate limit exceeded. Please wait a moment and try again." });
        }
        res.status(500).json({ message: "Internal server error" });
    }
};
