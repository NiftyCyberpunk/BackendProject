import mongoose, { isValidObjectId } from "mongoose";
import { Likes } from "../models/likes.models.js";
import ApiError from "../utils/ErrorAPI.js";
import ApiResponse from "../utils/ResponseAPI.js";
import asyncHandler from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async(req, res) => {
    const { videoId } = req.params;

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid video Id...");
    }

    const existinglikedVideo = await Likes.findById(videoId);

    if(existinglikedVideo){
        await existinglikedVideo.deleteOne();

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    {},
                    "Video unliked successfully..."
                )
            );
    }

    const likedVideo = await Likes.create({
        video: videoId,
        likedBy: req.user._id
    });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                likedVideo,
                "Video liked successfully..."
            )
        );
});

const toggleCommentLike = asyncHandler(async(req, res) => {
    const { commentId } = req.params;

    if(!isValidObjectId(commentId)){
        throw new ApiError(400, "Invalid video Id...");
    }

    const existinglikedComment = await Likes.findById(commentId);

    if(existinglikedComment){
        await existinglikedComment.deleteOne();

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    {},
                    "Comment unliked successfully..."
                )
            );
    }

    const likedComment = await Likes.create({
        commnet: commentId,
        likedBy: req.user._id
    });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                likedComment,
                "Comment liked successfully..."
            )
        );
}); 

const toggleTweetLike = asyncHandler(async(req, res) => {
    const { tweetId } = req.params;

    if(!isValidObjectId(tweetId)){
        throw new ApiError(400, "Invalid video Id...");
    }

    const existinglikedTweet = await Likes.findById(tweetId);

    if(existinglikedTweet){
        await existinglikedTweet.deleteOne();

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    {},
                    "Tweet unliked successfully..."
                )
            );
    }

    const likedTweet = await Likes.create({
        tweet: tweetId,
        likedBy: req.user._id
    });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                likedTweet,
                "Tweet liked successfully..."
            )
        );
});

const getLikedVideos = asyncHandler(async(req, res) => {

    const likedVideos = await Likes.aggregate([
        {
            $match:{
                likedBy: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "videoDetails",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "ownerDetails"
                        }
                    },
                    {
                        $unwind: "$ownerDetails"
                    }
                ]
            }
        },
        {
            $unwind: "$videoDetails"
        },
        /*
            {
                $project: {
                    videoFile: "$videosDetails.videoFile",
                    thumbnail: "$videosDetails.thumbnail",
                    owner: "$videoDetails.owner",
                    title: "$videoDetails.title",
                    description: "$videoDetails.description",
                    duration: "$videoDetails.duration",
                    views: "$videoDetails.views"
                }
            }
        */
       //cleaner approach
       {
            $replaceRoot: {
                newRoot: "$videoDetails"
            }
        },
        {
            $project: {
                videoFile: 1,
                thumbnail: 1,
                title: 1,
                description: 1,
                duration: 1,
                views: 1,
                owner: {
                    _id: "$ownerDetails._id",
                    username: "$ownerDetails.username",
                    fullname: "$ownerDetails.fullname",
                    avatar: "$ownerDetails.avatar"
                }
            }
        }
    ]);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                likedVideos,
                "Liked videos fetched successfully..."
            )
        );
});

export {
    toggleVideoLike,
    toggleCommentLike,
    toggleTweetLike,
    getLikedVideos
}