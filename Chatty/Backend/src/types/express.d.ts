import { JwtPayload } from "jsonwebtoken";
import { Types } from "mongoose";

declare global {
  namespace Express {
    interface Request {
      user?: {
        _id: Types.ObjectId;
        fullName: string;
        email: string;
        profilePic: string;
        friends: Types.ObjectId[];
        friendRequests: {
          sent: Types.ObjectId[];
          received: Types.ObjectId[];
        };
        lastSeen: Date;
      } | JwtPayload;
      group?: {
        _id: Types.ObjectId;
        name: string;
        members: Types.ObjectId[];
        admins: Types.ObjectId[];
        createdBy: Types.ObjectId;
      };
    }
  }
}

export {};
