import mongoose from "mongoose";

const likesSchema = new mongoose.Schema(
    {
        commnet: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Comments"
        },
        video:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Video"
        },
        likedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }, 
        tweet: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Tweets"
        }
    },
    {
        timestamps: true
    }
);

export const Likes = mongoose.model("Likes", likesSchema);