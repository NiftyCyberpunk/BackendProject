import mongoose, { isValidObjectId } from "mongoose";
import { Tweets } from "../models/tweets.models.js";
import { User } from "../models/user.models.js";
import ApiError from "../utils/ErrorAPI.js";
import ApiResponse from "../utils/ResponseAPI.js";
import asyncHandler from "../utils/asyncHandler.js";
import { cloudinaryDelete, cloudinaryUpload } from "../utils/cloudinary.js";

const createTweet = asyncHandler(async(req, res) => {
    const {content} = req.body;

    if(!content){
        throw new ApiError(400, "Content is required...");
    }

    const userId = req.user._id;

    const tweetImgLocalPath = req.file?.path;

    const tweetImg = tweetImgLocalPath ? await cloudinaryUpload(tweetImgLocalPath) : undefined;

    if(tweetImgLocalPath){
        if(!tweetImg){
            throw new ApiError(500, "Failed to upload image...");
        }
    }

    const tweet = await Tweets.create({
        owner: userId,
        content,
        tweetImg: tweetImg?.url || "",
        tweetImgPublicId: tweetImg?.public_id || "",
    })

    if(!tweet){
        throw new ApiError(500, "Something went wrong while creating tweet...");
    }

    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                tweet,
                "Tweet created successfully..."
            )
        );
});

const getUserTweets = asyncHandler(async(req, res) => {
    const { userId } = req.params;

    if(!isValidObjectId(userId)){
        throw new ApiError(400, "Invalid user Id...");
    }


    const userTweets = await Tweets.find({
        owner: userId
    })

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                userTweets,
                "User tweets fetched successfully..."
            )
        );
});

const updateTweet = asyncHandler(async(req, res) => {
    const {tweetId} = req.params;

    const updateData = {};
    if(!isValidObjectId(tweetId)){
        throw new ApiError(400, "Invalid tweet Id...");
    }
    
    const tweet = await Tweets.findById(tweetId);

    if(!tweet){
        throw new ApiError(404, "Tweet not found...");
    }

    if(tweet.owner.toString() !== req.user._id.toString()){
        throw new ApiError(403, "You are not authorized to update this tweet...");
    } 

    const { content } = req.body;
    const tweetImgLocalPath = req.file?.path;

    if(content?.trim()){
        updateData.content = content;
    }

    const tweetImgPublicId = tweet.tweetImgPublicId;
    let isUpdated = false;

    if(tweetImgLocalPath){
        const tweetImg = await cloudinaryUpload(tweetImgLocalPath);

        if(!tweetImg){
            throw new ApiError(500, "Image upload failed...");
        }

        updateData.tweetImg = tweetImg.url;
        updateData.tweetImgPublicId = tweetImg.public_id;

        isUpdated = true;
    }

    if(Object.keys(updateData).length == 0){
        throw new ApiError(400, "No fields to update...");
    }

    const updatedTweet = await Tweets.findByIdAndUpdate(
        tweetId,
        {
            $set: updateData
        },
        {
            new: true,
        }
    );

    if(isUpdated){
        try {
            await cloudinaryDelete(tweetImgPublicId);
        } catch (error) {
            console.error("Cloudinary deletion error: ",error);
        }
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                updatedTweet,
                "Tweet updated successfully..."
            )
        );
});

const deleteTweet = asyncHandler(async(req, res) => {
    const {tweetId} = req.params;

    if(!isValidObjectId(tweetId)){
        throw new ApiError(400, "Invalid tweet Id...");
    }

    const tweet = await Tweets.findById(tweetId);

    if(!tweet){
        throw new ApiError(404, "Tweet not found...");
    }

    if(tweet.owner.toString() !== req.user._id.toString()){
        throw new ApiError(403, "You are not authorized to delete this tweet...");
    }


    const tweetImgPublicId = tweet.tweetImgPublicId;

    await tweet.deleteOne();

    if (tweetImgPublicId) {
        try {
            await cloudinaryDelete(tweetImgPublicId);
        } catch (error) {
            console.error("Cloudinary deletion error: ",error);
        }
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "Tweet deleted successfully..."
            )
        );
});

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}