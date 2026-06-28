import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.models.js";
import { Subscriptions } from "../models/subscriptions.models.js";
import ApiError from "../utils/ErrorAPI.js";
import ApiResponse from "../utils/ResponseAPI.js";
import asyncHandler from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async(req, res) => {
    const { channelId } = req.params;

    if(!isValidObjectId(channelId)){
        throw new ApiError(400, "Invalid channel Id...");
    }

    const channel = await User.findById(channelId);

    if(!channel){
        throw new ApiError(404, "Channel not found...");
    }

    if(channelId === req.user._id.toString()){
        throw new ApiError(400, "You cannot subscribe your own channel...");
    }

    const existingSubscriber = await Subscriptions.findOne({
        subscriber: req.user._id,
        channel: channelId
    })

    if(existingSubscriber){
        await existingSubscriber.deleteOne();

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    {},
                    "Channel unsubscribed successfully..."
                )
            );
    }

    const subscribedChannel = await Subscriptions.create({
        subscriber: req.user._id,
        channel: channelId
    })

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                subscribedChannel,
                "Channel subscribed successfully..."
            )
        );
});

const getUserChannelSubscribers = asyncHandler(async(req, res) => {
    const { channelId } = req.params;

    if(!isValidObjectId(channelId)){
        throw new ApiError(400, "Invalid channel Id...");
    }

    const channelSubscriber = await Subscriptions.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "channelSubscribers"
            }
        },
        {
            $unwind: "$channelSubscribers"
        },
        {
            $project: {
                _id: "$channelSubscribers._id",
                username: "$channelSubscribers.username",
                fullname: "$channelSubscribers.fullname",
                email: "$channelSubscribers.email",
                avatar: "$channelSubscribers.avatar"
            }
        }
    ]);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                channelSubscriber,
                "Channel Subscribers fetched successfully..."
            )
        );
});

const getSubscribedChannels = asyncHandler(async(req, res) => {
    const { subscriberId } = req.params;

    if(!isValidObjectId(subscriberId)){
        throw new ApiError(400, "Invalid Channel Id...");
    }

    const subscribedChannels = await Subscriptions.aggregate([
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "subscribedChannels"
            }
        },
        {
            $unwind: "$subscribedChannels"
        },
        {
            $project: {
                username: "$subscribedChannels.username",
                fullname: "$subscribedChannels.fullname",
                email: "$subscribedChannels.email",
                avatar: "$subscribedChannels.avatar"
            }
        }
    ]);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                subscribedChannels,
                "Subscribed Channels fetched successfully..."
            )
        );
});

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels,
}