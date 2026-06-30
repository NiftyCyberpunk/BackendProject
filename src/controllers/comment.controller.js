import mongoose, { isValidObjectId } from "mongoose";
import { Comments } from "../models/comments.models.js";
import { Video } from "../models/video.models.js";
import ApiError from "../utils/ErrorAPI.js";
import ApiResponse from "../utils/ResponseAPI.js";
import asyncHandler from "../utils/asyncHandler.js";

const getVideosComments = asyncHandler(async(req, res) => {
    const { videoId } = req.params;
    const { page: rawpage = 1, limit: rawlimit = 10 } = req.query;

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Inavlid Video Id...");
    }

    const video = await Video.findById(videoId);

    if(!video){
        throw new ApiError(404, "Video not found...");
    }

    const page = Math.max(1, Number(rawpage) || 1);
    const limit = Math.max(1, Number(rawlimit) || 10);

    const skip = (page - 1)* limit;

    const comments = await Comments.find({
        video: videoId
    }).sort({ createdAt: -1 }).skip(skip).limit(limit); //sort --> newest first

    const totalComments = await Comments.countDocuments({
        video: videoId
    })

    const totalPages = Math.max(1, Math.ceil(totalComments / limit));

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    comments,
                    page,
                    limit,
                    totalComments,
                    totalPages
                },
                "Video comments fetched succesfully..."
            )
        );

})

const addCommnet = asyncHandler(async(req, res) => {
    const { videoId } = req.params;
    const { content } = req.body;

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid video id...");
    }

    const video = await Video.findById(videoId);
    
    if(!video){
        throw new ApiError(404, "Video not found...");
    }

    if(!video.isPublished){
        throw new ApiError(403, "You cannot comment on unpublished video...");
    }

    if(!content.trim()){
        throw new ApiError(400, "Comment content is required...");
    }

    const createdComment = await Comments.create({
        content,
        video: videoId,
        owner: req.user._id
    });

    if(!createdComment){
        throw new ApiError(500, "Something went wrong while adding comment...");
    }

    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                createdComment,
                "Comment added successfully..."
            )
        );

})

const updateComment = asyncHandler(async(req, res) => {
    const { content }  = req.body;
    const { commentId } = req.params;

    if(!isValidObjectId(commentId)){
        throw new ApiError(400, "Inavlid Comment Id...");
    }

    const comment = await Comments.findById(commentId);

    if(!comment){
        throw new ApiError(404, "Comment not found...");
    }
    
    if(comment.owner.toString() !== req.user._id.toString()){
        throw new ApiError(403, "You are not authorize to update this comment...");
    }

    if(!content?.trim()){
        throw new ApiError(400, "Nothing to update...");
    }

    comment.content = content?.trim();

    await comment.save();

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                comment,
                "Comment updated successfully..."
            )
        );
})

const deleteComment = asyncHandler(async(req, res) => {
    const { commentId } = req.params;

    if(!isValidObjectId(commentId)){
        throw new ApiError(400, "Invalid comment Id...");
    }

    const comment = await Comments.findById(commentId);

    const commentOwner = comment.owner;

    if(commentOwner.toString() !== req.user._id.toString()){
        throw new ApiError(403, "You are not authorized to delete this comment...");
    }



    if(!comment){
        throw new ApiError(404, "Comment not found...");
    }

    await comment.deleteOne();

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "Comment deleted successfully..."
            )
        );
})

export {
    getVideosComments,
    addCommnet,
    updateComment,
    deleteComment
}