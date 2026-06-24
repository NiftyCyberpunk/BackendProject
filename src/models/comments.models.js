import mongoose from "mongoose";

const commentsSchema = new mongoose.Schema(
    {
        content: {
            type: String,
            requried: true
        },
        video: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Video"
        },
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    },
    {
        timestamps: true
    }
);

export const Comments = mongoose.model("Comments", commentsSchema);