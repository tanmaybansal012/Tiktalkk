import { JwtPayload } from "jsonwebtoken";

declare global {
  namespace Express {
    interface Request {
      user?: {
        _id: string;
        username: string;
      } | JwtPayload;
    }
  }
}

export {};
