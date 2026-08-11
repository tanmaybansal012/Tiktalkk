import { Schema, Types, model } from "mongoose";

const groupSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    groupIcon: {
        type: String,
        default: "",
    },
    members: [{
        type: Types.ObjectId,
        ref: "User",
    }],
    admins: [{
        type: Types.ObjectId,
        ref: "User",
    }],
    createdBy: {
        type: Types.ObjectId,
        ref: "User",
        required: true,
    },
},
    {
        timestamps: true,
    },
)

const Group = model("Group", groupSchema);
export default Group;
