import mongoose, { isValidObjectId } from "mongoose";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ErrorAPI.js";
import ApiResponse from "../utils/ResponseAPI.js";
import { Video } from "../models/video.models.js"
import { User } from "../models/user.models.js";
import { cloudinaryDelete, cloudinaryUpload } from "../utils/cloudinary.js";


const getAllVideos = asyncHandler(async(req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;

    const filter = {};

    //pagination
    page = Number(page);
    limit = Number(limit);
    const skip = (page - 1) * limit;//how many to skip from start
    const videos = await Video.find().skip(skip).limit(limit)

    const totalVideos = await Video.countDocuments();
    const totalPage = Math.ceil(totalVideos/limit);

    //sorting


    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    videos,
                    page,
                    limit,
                    totalVideos,
                    totalPage
                },
                "Videos fetched successfully..."
            )
        );
});

const publishVideo = asyncHandler(async(req, res) => {
    const { title, description } = req.body;

    const videoLocalPath = req.files?.videoFile[0]?.path;
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path;
    // console.log("Video Local: ", videoLocalPath);
    // console.log("Thumbanail Local: ",thumbnailLocalPath);
    

    if(!videoLocalPath){
        throw new ApiError(400, "Video file is required...");
    }
    if(!thumbnailLocalPath){
        throw new ApiError(400, "Thumbnail file is required...");
    }

    const video = await cloudinaryUpload(videoLocalPath);
    const thumbnail = await cloudinaryUpload(thumbnailLocalPath);
    // console.log("Video : ", video);
    // console.log("Thumbanail : ",thumbnail);

    if(!video){
        throw new ApiError(500, "Video upload failed...");
    }
    if(!thumbnail){
        throw new ApiError(500, "Thumbnail upload failed...");
    }

    const videoUploaded = await Video.create({
        videoFile: video.url,
        videoPublicId: video.public_id,
        thumbnail: thumbnail.url,
        thumbnailPublicId: thumbnail.public_id,
        owner: req.user._id,
        title,
        description,
        duration: video.duration,
    });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                videoUploaded,
                "Video Published successfully..."
            )
        );
});

const getVideoByID = asyncHandler(async(req, res) => {
    const { videoId } = req.params;

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid Video Id...");
    }

    const video = await Video.findById(videoId);

    if(!video){
        throw new ApiError(404, "Video not found...");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                video,
                "Video fetched successfully..."
            )
        );
});

const updateVideo = asyncHandler(async(req, res) => {
    const { videoId } = req.params;

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid Video Id...");
    }

    const video = await Video.findById(videoId);
    if(!video){
        throw new ApiError(404, "Video not found...");
    }

    if(video.owner.toString() !== req.user._id.toString()){
        throw new ApiError(403, "You are not authorized to update this video...");
    }

    const updateData = {};

    const {newTitle, newDescription} = req.body;
    const newThumbnailLocalPath = req.file?.path;
    
    const oldThumbnailPublicId = video.thumbnailPublicId;

    if(newTitle){
        updateData.title = newTitle;
    }

    if(newDescription){
        updateData.description = newDescription
    }
    
    let isThumbnailUpdated = false;
    if(newThumbnailLocalPath){
        const newThumbnail = await cloudinaryUpload(newThumbnailLocalPath);

        if(!newThumbnail){
            throw new ApiError(500, "Thumbnail Upload failed...");
        }

        updateData.thumbnail = newThumbnail.url;
        updateData.thumbnailPublicId = newThumbnail.public_id;
        isThumbnailUpdated = true;
    }

    if (Object.keys(updateData).length === 0) {
        throw new ApiError(400, "No fields to update");
    }

    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: updateData,
        },
        {
            new: true
        }
    );

    if(isThumbnailUpdated){

        try {
            await cloudinaryDelete(oldThumbnailPublicId);
        } catch (error) {
            console.error("Cloudinary deletion error: ", error);
        }
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                updatedVideo,
                "Video updated successfully..."
            )
        );
});

const deleteVideo = asyncHandler(async(req, res) => {
    const { videoId } = req.params;

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid Video Id...");
    }

    const video = await Video.findById(videoId);

    if(!video){
        throw new ApiError(404, "Video not found...");
    }

    if(video.owner.toString() !== req.user._id.toString()){
        throw new ApiError(403, "You are not authorized to delete this video...");
    }

    const videoPublicId = video.videoPublicId;
    const thumbnailPublicId = video.thumbnailPublicId;

    await video.deleteOne();//saves another database query (findByIdAndDelete)

    try {
        await Promise.all([
            cloudinaryDelete(videoPublicId),
            cloudinaryDelete(thumbnailPublicId)
        ])
        /*
            upper is faster than -->
                await cloudinaryDelete(videoPublicId);
                await cloudinaryDelete(thumbnailPublicId);
        */
    } catch (error) {
        console.error("Cloudinary deletion error: ", error);
    }
    
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "Video deleted successfully..."
            )
        );
});

const togglePublishStatus = asyncHandler(async(req, res) => {
    const { videoId } = req.params;

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid Video Id...");
    }

    const video = await Video.findById(videoId);

    if(!video){
        throw new ApiError(404, "Video not found...");
    }

    if(video.owner.toString() !== req.user._id.toString()){
        throw new ApiError(403, "You are not authorized to toggle this video...");
    }

    video.isPublished = !video.isPublished;
    await video.save({ validateBeforeSave: false })

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                video,
                `Video ${(video.isPublished) ? "published" : "unpublished"} successfully...`
            )
        );
});

export {
    getAllVideos,
    publishVideo,
    getVideoByID,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}