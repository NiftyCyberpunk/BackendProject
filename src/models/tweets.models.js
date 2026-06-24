import mongoose from "mongoose";

const tweetsSchema = new mongoose.Schema(
    {
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        content: {
            type: String,
            required: true
        }
    }, 
    {
        timestamps: tru
    }
);

export const Tweets = mongoose.model("Tweets", tweetsSchema);