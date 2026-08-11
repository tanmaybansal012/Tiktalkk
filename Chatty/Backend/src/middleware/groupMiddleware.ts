import { RequestHandler } from "express";
import Group from "../models/group";

export const isGroupAdmin: RequestHandler = async (req, res, next) => {
    try {
        const userId = (req as any).user._id;
        const { groupId } = req.params;

        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }

        const isAdmin = group.admins.some(
            (adminId) => adminId.toString() === userId.toString()
        );

        if (!isAdmin) {
            return res.status(403).json({ message: "Only group admins can perform this action" });
        }

        (req as any).group = group;
        next();
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Internal server error" });
    }
};
