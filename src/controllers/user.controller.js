import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ErrorAPI.js";
import { User } from "../models/user.models.js"
import { cloudinaryDelete, cloudinaryUpload } from "../utils/cloudinary.js"
import ApiResponse from "../utils/ResponseAPI.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateTokens = async(userId) => {
    try {
        const user = await User.findOne(userId);
        //console.log("User root", user)
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
        // console.log("Access root",accessToken);
        // console.log("Refresh root",refreshToken);

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false});
        return {accessToken, refreshToken};

    } catch (error) {
        throw new ApiError(500, "Something went wrong...");
    }
}


const registerUser = asyncHandler(async(req, res) => {
    const {username, email, password, fullname} = req.body;
    /*
        if(fullname === ""){
            throw new ApiError(400, "fullname is required...")
        }
    */

    if([username, email, password, fullname].some((field) => field?.trim() === "")){
        throw new ApiError(400, "All fields are required...")
    }

    const existedUser = await User.findOne({
        $or: [{username}, {email}]
    })
    //console.log("Existed User", existedUser);
    
    if(existedUser){
        throw new ApiError(409, "User with credentials already exist...")
    }
    // console.log(existedUser);
    
    const avatarPathLocal = req.files?.avatar[0]?.path;
    const coverImgPathLocal = req.files?.coverImage?.[0]?.path;
    //console.log(avatarPathLocal);
    
    if(!avatarPathLocal){
        throw new ApiError(400, "Avatar is required...");
    }

    const avatar = await cloudinaryUpload(avatarPathLocal);
    const coverImage = (coverImgPathLocal) ? await cloudinaryUpload(coverImgPathLocal):undefined;

    if(!avatar){
        throw new ApiError(500, "Failed to upload avatar...");
    }
    
    const user = await User.create({
        username: username.toLowerCase(),
        email,
        password,
        fullname,
        avatar: avatar.url,
        avatarPublicId: avatar.public_id,
        coverImage: coverImage?.url || "",
        coverImagePublicId: coverImage?.public_id || ""
    });

    const createdUser = await User.findById(user._id).select("-password -refreshToken")
    console.log(`✅ User Registered: ${createdUser.username} (${createdUser.email})`);
       
    
    if(!createdUser){
        throw new ApiError(500, "Something went wrong while registering user...")
    }

    return res.status(201).json(
        new ApiResponse(201, createdUser, "User registered successfully...")
    )
    
})

const loginUser = asyncHandler(async(req, res) => {
    const {username, email, password} = req.body;

    if(!(username || email)){
        throw new ApiError(400, "Username or email is required...");
    }

    const findUser = await User.findOne({
        $or: [{username}, {email}]
    })

    if(!findUser){
        throw new ApiError(400, "User is not registered...")
    }

    const isCorrect = await findUser.isPasswordCorrect(password);

    if(!isCorrect){
        throw new ApiError(401, "Password is incorrect...");
    }

    const {accessToken, refreshToken} = await generateTokens(findUser._id);
    // console.log("Access",accessToken);
    // console.log("Refresh",refreshToken);

    findUser.refreshToken = refreshToken;

    const loggedUser = await User.findById(findUser._id).select("-password -refreshToken");

    //cookies
    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedUser, accessToken, refreshToken
                },
                "User logged in successfully..."
            )
        )
})

const logout = asyncHandler(async(req, res) => {
    const userId = req.user._id

    await User.findByIdAndUpdate(
        userId,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            returnDocument: "after"
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.
        status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(
            new ApiResponse(200, {}, "User logged out successfully...")
        )
})

const resetAccessToken = asyncHandler(async(req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if(!incomingRefreshToken){
        throw new ApiError(401, "Unauthorized request...");
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
    
        if(!decodedToken){
            throw new ApiError(401, "Unauthorized request...");
        }
    
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken");
    
        if(!user){
            throw new ApiError(401, "Invalid Token...")
        }
    
        if(incomingRefreshToken !== user.refreshToken){
            throw new ApiError(401, "Token is expired or used...")
        }
    
        const options = {
            httpOnly: true,
            secure: true,
        }
    
        const {newAccessToken, newRefreshToken} = await generateTokens(user._id)
    
        return res
            .status(200)
            .cookie("accessToken", newAccessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    {accessToken: newAccessToken, refreshToken: newRefreshToken},
                    "Tokens refreshed successfully"
                )
            )
    } catch (error) {
        throw new ApiError(401, error ? error?.message : "Invalid tokens");
    }
})

const changeCurrentPassword = asyncHandler(async(req, res) => {
    const {oldPassword, newPassword} = req.body;

    const userId = req.user?._id;

    const user = await User.findById(userId);
    const isCorrect = await user.isPasswordCorrect(oldPassword);

    if(!isCorrect){
        throw new ApiError(400, "Password is Incorrect...");
    }

    user.password = newPassword;
    await user.save({validateBeforeSave: false});

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "Password changed successfully..."
            )
        )
})

const getCurrentUser = asyncHandler(async(req, res) => {
    const user = req.user;

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                user,
                "Current user fetched successfully..."
            )
        )
})

const updateAccountDetails = asyncHandler(async(req, res) => {
    const updateData = {};

    const {newUsername, newEmail, newFullname} = req.body;

    if(newUsername){
        const existingUser = await User.findOne({
            username: newUsername.toLowerCase(),
            _id: {$ne: req.user._id} //$ne => not equal
        });
        if(existingUser){
            throw new ApiError(400, "Username already exist...");
        }
        updateData.username = newUsername.toLowerCase();
    }

    if(newEmail){
        updateData.email = newEmail;
    }

    if(newFullname){
        updateData.fullname = newFullname;
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: updateData
        },
        {
            returnDocument: "after"
        }
    ).select("-password -refreshToken");

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                user,
                "Account details updated successfully..."
            )
        )
})

const updateAvatar = asyncHandler(async(req, res) => {
    const updateData = {};

    const avatarPathLocal = req.file?.path;

    if(!avatarPathLocal){
        throw new ApiError(400, "Avatar file is required...");
    }

    const newAvatar = (avatarPathLocal) ? await cloudinaryUpload(avatarPathLocal):undefined;

    if(!newAvatar){
        throw new ApiError(500, "Error while uploading avatar...");
    }

    const currentUser = await User.findById(req.user._id);
    if(newAvatar){
        updateData.avatar = newAvatar.url;
        updateData.avatarPublicId = newAvatar.public_id;

    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: updateData
        },
        {
            returnDocument: "after"
        }
    ).select("-password -refreshToken")

    if(newAvatar){
        await cloudinaryDelete(currentUser.avatarPublicId);
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                user,
                "Avatar successfully updated..."
            )
        )
})

const updateCoverImage = asyncHandler(async(req, res) => {
    const updateData = {};

    const coverImgPathLocal = req.file?.path;//not files []

    if(!coverImgPathLocal){
        throw new ApiError(400, "Cover Image file required...");
    }

    const newCoverImage = (coverImgPathLocal) ? await cloudinaryUpload(coverImgPathLocal):undefined;

    if(!newCoverImage){
        throw new ApiError(500, "Error while uploading cover image...")
    }

    const currentUser = await User.findById(req.user._id);
    if(newCoverImage){
        updateData.coverImage = newCoverImage.url;
        updateData.coverImagePublicId = newCoverImage.public_id;
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: updateData
        },
        {
            returnDocument: "after"
        }
    ).select("-password -refreshToken")

    if(newCoverImage && currentUser.coverImagePublicId){
        await cloudinaryDelete(currentUser.coverImagePublicId);
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                user,
                "Cover Image successfully updated..."
            )
        )
})

const getUserChannelProfile = asyncHandler(async(req, res) => {
    const {username} = req.params;

    if(!username?.trim()){
        throw new ApiError(400, "Username is missing...")
    }

    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribed"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                subscribedCount: {
                    $size: "$subscribed"
                },
                isSubscribed: {
                    $cond: {
                        if: {$in: [req?.user?._id, "$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullname: 1,
                username: 1,
                subscribersCount: 1,
                subscribedCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1
            }
        }
    ])
    console.log("Channel", channel);

    if(!channel?.length){
        throw new ApiError(400, "Channel does not exist...")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                channel[0],
                "User channel fetched successfully..."
            )
        )
})

const getWatchHistory = asyncHandler(async(req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullname: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        },
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                user[0].watchHistory,
                "Watch History fetched successfully..."
            )
        )
})

export {
    registerUser,
    loginUser,
    logout,
    resetAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateAvatar,
    updateCoverImage,
    getUserChannelProfile,
    getWatchHistory
}

/*
    To register a user =>
        1) take the user data
        2) validate the data --> not empty
        3) check if the user already exist: username and email
        4) check the images and avatar
        5) upload the avatar and image to cloudinary
        6) create user object - create entry in db
        7) check the response for user creation 
        8) return the response
*/

/*
    To login =>
        1) take the user data
        2) validate the data(username, email) --> not empty
        3) check the user exist or not
        4) check the password
        5) generate access and refresh token and send to user in secure cookies
        6) send response for logged in
*/