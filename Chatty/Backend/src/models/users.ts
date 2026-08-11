import mongoose, { Types } from "mongoose";

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
    },
    fullName: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        minLength: 6,
        required: true,
    },
    profilePic: {
        type: String,
        default: ""
    },
    friends: [{
        type: Types.ObjectId,
        ref: "User",
    }],
    friendRequests: {
        sent: [{
            type: Types.ObjectId,
            ref: "User",
        }],
        received: [{
            type: Types.ObjectId,
            ref: "User",
        }],
    },
    lastSeen: {
        type: Date,
        default: Date.now,
    },
    },
    {
        timestamps: true,
    }
)

const User = mongoose.model("User", userSchema);

export default User;