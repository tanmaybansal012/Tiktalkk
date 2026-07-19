/// <reference path="../types/express.d.ts" />

import jwt from "jsonwebtoken";
import User from "../models/users";

import { RequestHandler } from "express";

export const protectRoute: RequestHandler = async (req, res, next) => {
    try {
        const token = req.cookies.jwt;
        if (!token) return res.status(401).json({ message: "Unauthorized - No token found" });

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
        if (!decoded) return res.status(401).json({ message: "Unauthorized - No token found" });

        const user = await User.findById(decoded.userId).select("-password");
        if (!user) return res.status(404).json({ message: "User not found" });
        
        (req as any).user = user;
        next();
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Internal server error" });
    }
}