import { Schema, Types, model } from "mongoose";

const messageSchema = new Schema({
    senderId: {
        type: Types.ObjectId,
        ref: "User",
        required: true,
    },
    receiverId: {
        type: Types.ObjectId,
        ref: "User",
    },
    groupId: {
        type: Types.ObjectId,
        ref: "Group",
    },
    text: String,
    image: String,
},
    {
        timestamps: true,
    },
)

const message = model("Message", messageSchema);
export default message;