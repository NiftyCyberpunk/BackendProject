import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.models.js";
import ApiError from "../utils/ErrorAPI.js";
import ApiResponse from "../utils/ResponseAPI.js";
import asyncHandler from "../utils/asyncHandler.js";
import { User } from "../models/user.models.js";
import { Video } from "../models/video.models.js";


const createPlaylist = asyncHandler(async(req, res) => {
    const { name, description } = req.body

    if(!(name || description)){
        throw new ApiError(400, "Name and description required...");
    }

    const playlist = await Playlist.create({
        owner: req.user._id,
        name,
        description
    });

    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                playlist,
            )
        );
});

const getUserPlaylist = asyncHandler(async(req, res) => {
    const { userId } = req.params;

    if(!isValidObjectId(userId)){
        throw new ApiError(400, "Invalid user Id...");
    }

    const user = await User.findById(userId);

    if(!user){
        throw new ApiError(404, "User not found...");
    }

    const userPlaylist = await Playlist.findOne({
        owner: userId
    });

    if(!userPlaylist){
        throw new ApiError(404, "Playlist not found...");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                userPlaylist,
                "User Playlist fetched successfully..."
            )
        );
})

const getPlayListById = asyncHandler(async(req, res) => {
    const { playlistId } = req.params;

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid playlist Id");
    }

    const playlist = await Playlist.findById(playlistId);

    if(!playlist){
        throw new ApiError(404, "Playlist not found...");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                playlist,
                "Playlist fetched successfully..."
            )
        );
})

const addVideoToPlaylist = asyncHandler(async(req, res) => {
    const { videoId, playlistId } = req.params;

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid video Id...");
    }

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid playlist Id...");
    }

    const playlist = await Playlist.findById(playlistId);

    if(!playlist){
        throw new ApiError(404, "Playlist not found...");
    }

    if(playlist.owner.toString() !== req.user._id.toString()){
        throw new ApiError(403, "You are not authorized to modify this playlist...");
    }

    const video = await Video.findById(videoId);

    if(!video){
        throw new ApiError(404, "Video not found...")
    }

    const addedVideoPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $addToSet: {
                videos: videoId
            }
        },
        {
            new: true 
        }
    );

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                addedVideoPlaylist,
                "Video added to playlist successfully..."
            )
        );

})

const removeVideoFromPlaylist = asyncHandler(async(req, res) => {
    const { videoId, playlistId } = req.params;

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid video Id...");
    }

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid playlist Id...");
    }

    const playlist = await Playlist.findById(playlistId);

    if(!playlist){
        throw new ApiError(404, "Playlist not found...");
    }

    if(playlist.owner.toString() !== req.user._id.toString()){
        throw new ApiError(403, "You are not authorized to modify this playlist...");
    }

    const removedVideoPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $pull: {
                videos: videoId
            }
        },
        {
            new: true
        }
    );

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                removedVideoPlaylist,
                "Video removed form playlist successfully..."
            )
        );

})

const deletePlaylist = asyncHandler(async(req, res) => {
    const { playlistId } = req.params;

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid playlist Id...");
    }

    const playlist = await Playlist.findById(playlistId);

    if(!playlist){
        throw new ApiError(404, "Playlist not found...");
    }

    if(playlist.owner.toString() !== req.user._id.toString()){
        throw new ApiError(403, "You are not authorized to delete this playlist...");
    }

    await playlist.deleteOne();

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "Playlist deleted succesfully..."
            )
        );
})

const updatePlaylist = asyncHandler(async(req, res) => {
    const { playlistId } = req.params;
    const { name, description } = req.body;

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid playlist Id");
    }

    const playlist = await Playlist.findById(playlistId);

    if(!playlist){
        throw new ApiError(404, "Playlist not found...");
    }

    if(playlist.owner.toString() !== req.user._id.toString()){
        throw new ApiError(403, "You are not authorized to delete this playlist...");
    }

    if(name?.trim()){
        playlist.name = name.trim();
    }

    if(description?.trim()){
        playlist.description = description.trim();
    }

    await playlist.save();

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                playlist,
                "Playlist updated successfully..."
            )
        )
})

export {
    createPlaylist,
    getUserPlaylist,
    getPlayListById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}