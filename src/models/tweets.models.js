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
        },
        tweetImg:{
            type: String
        },
        tweetImgPublicId:{
            type: String
        }
    }, 
    {
        timestamps: true
    }
);



export const Tweets = mongoose.model("Tweets", tweetsSchema);