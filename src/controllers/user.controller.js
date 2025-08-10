//Jab frontend se koi request aati hai (jaise user login kare, register kare, profile update kare), to user.controller.js woh request receive karta hai.
//Yeh file input data ko check karti hai (jaise email, password valid hai ya nahi), aur agar sab theek hai to aage service ya model ko call karti hai.

import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import User from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import { response } from "express";
import mongoose from "mongoose";

const registerUser = asyncHandler( async (req , res)=>{ //registerUser is wrapped inside asyncHandler, which means: If any error occurs inside the async function, it will be automatically caught and passed to the Express error handler.
    
    //STEPS OF REGISTERING:-
    //1.)get user details from frontend
    //2.)validation - not empty
    //3.)check if user already exists {via username,email}
    //4.)check for images, check for avatar
    //5.)upload them to cloudinary, avatar
    //6.)create a user object - create entry in db
    //7.)remove pasword and refresh token field from response 
    //8.)check for user creation 
    //9.)return response

    const {fullName, email, username, password} = req.body  //yaha pe req.body se extract kiye hai sare data points
    console.log("email", email);
    // if(fullName === ""){  //agar fullname empty hai toh
    //     throw new ApiError(400,"fullname is required")
    // }

    if (!fullName || !email || !username || !password) {
    throw new ApiError(400, "All fields are required");
    }


    const existedUser=await User.findOne({  //check if user is already existed 
        $or: [{username}, {email}]  //mujhe ye find krke batao aisa ek user jo is email aur username ko match krta hai
    })
    
    if(existedUser) {
        throw new ApiError(409,"user with email or username already exists")
    }

    // console.log(req.files);
    console.log("req.body:", req.body);
    console.log("req.files:", req.files);
    

    const avatarLocalPath = req.files?.avatar[0]?.path //Ye line ek safe way hai to access the uploaded avatar image file’s path
    //(?. :-it is called as optional chaining it ensures ki code crash na kare)

    // const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage > 0){
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if(!avatarLocalPath){  //avatar nhi mila toh error throw kr do
        throw new ApiError(400,"Avatar file is required")
    }
 
    const avatar = await uploadOnCloudinary(avatarLocalPath)  //mil gaya toh cloudinary pe upload krdo
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){  // agar avatar nhi upload hua toh error de do
        throw new ApiError(400,"Avatar file is required")
    }

    const newUser = await User.create({  //agar sab kuch ho gaya hai toh object create kr do User.crate se value push kr diya aur value phuch gyi
        fullName,
        avatar: avatar.url,
        coverImage:coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(newUser._id).select(
        "-password -refreshToken"  //password aur refreshToken hata do jo ki receive value hai
    )

    if(!createdUser) {
        throw new ApiError(500, "Something went wrogn while registering a user")  //agar user nhi create hua toh eoor dedo
    }

    return res.status(201).json(  //create ho gaya hai toh sb kr do
        new ApiResponse(200, createdUser, "user registered successfully")
    )
})

const generateAccessAndRefreshTokens = async(userId)=>{
    try {
        const user = await User.findById(userId)  //isse user ka document aa gaay ahai
        const accessToken = user.generateAccessToken() //isko hum user ko dedete hain
        const refreshToken=user.generateRefreshToken()  //isko hum DB mein v save krke rkhte hain

        user.refreshToken = refreshToken  //object ke andar value add kr rhe hain
        await user.save({validateBeforeSave: false})  //mongoDB ke karan save ka option hai

        return {accessToken,refreshToken}
    
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access token")
    }
    //Refresh token ek long-lived token hota hai jo user ke paas rehta hai.
    //Jab access token expire ho jaata hai, toh refresh token ke through naya access token milta hai without login again
    
}


//Cookies are small pieces of data stored on the user's browser by websites. They are mainly used to remember information about the user between visits    

const loginUser = asyncHandler( async (req,res) => {
    //STEPS :
    //1.) request body se data le aao
    //2.) username or email
    //3.) find the user  {user hai ki nahi humare pass}
    //4.) password check   {agar user hai toh password check karao}
    //5.) access and efresh token generate krke user ko vejo {agar password shi hai toh}
    //6.) ab in tokens ko vejo cookies mein
    //7.) at last send respnse of login successfull

    const {email,username,password} = req.body  

    if(!username && !email){   //ek chaiye user ko aage badhne ke liye
        throw new ApiError(400, "username or password is required")
    }

    const user = await User.findOne({   //findOne:-jaise hee pehla document milega mongoDB mein wo waapas kr deta hai
        $or: [{username}, {email}]  //or mein hum array ke andar object pass kr skte hai or find krega user ko ya toh username ke basis pe mil jaye ya email ke basis pe 
    })  

    if(!user){
        throw new ApiError(404,"user does not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password) //ab agar paswword thik hoga toh thue ya falswe valur aa jaegi

    if(!isPasswordValid){
        throw new ApiError(401,"Invalid user credetials")
    }

    const {accessToken,refreshToken} = await generateAccessAndRefreshTokens(user._id)  //User ke ID (user._id) ke basis par Access Token aur Refresh Token generate karna.

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")  //Database se user ka data laana, lekin password aur refreshToken ko hata ke.

    const options  = {  //cookies jab v vejt ho tb options design krne hote hain cookies ke
        httpOnly: true,  
        secure: true
        //in dono ko true krne ke baad ye bas server se modify hogi

    }
    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(
            200,
            {
                user:loggedInUser,accessToken,refreshToken
            },
            "user logged in successfully"
        )
    )
})


const logoutUser  = asyncHandler(async(req,res) => {
    //STEPS
    //1.) cookies clear krne pparega
    //2.) refresh token reset kr do aur fir jab koi login kre toh usko naya refreshtoken milega
    //PROBLEM:- logout krne time Userid toh nhi le skte nhi toh koi v email daal ke logout ho jaega login krte time user le aaye the lyuli hamare pass email password sb tha
    //solution:- apna middleware(jane se pehle milke jaiyega) design krenge (auth.middleware.js)

    //// STEP 1: Remove refresh token from DB
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset:{
                refreshToken: 1 //this removes the field from the document
            }
        },
        {
            new: true  //isse new updated value milegi
        }
        
    )
    
    // STEP 2: Clear cookies with secure options
    const options  = {  //cookies jab v vejt ho tb options design krne hote hain cookies ke
        httpOnly: true,  
        secure: true
        //in dono ko true krne ke baad ye bas server se modify hogi
    }
    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out"))
})


//creating an endpoint
//Yeh refreshAccessToken ek controller function hai jo JWT-based authentication mein refresh token se naya access token generate karta hai.
// Step 1: Refresh token client se lo
const refreshAccessToken = asyncHandler(async( req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    if(!incomingRefreshToken){  // agar token nahi mila to unauthorized.
    throw new ApiError(401,"unauthorized request")
    }

    //ab inconming token ko verify kraenge jwt se
    //Step 2: Token ko verify karo (JWT)

    try {  
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )  //VERIFY HONE KE BAAD DECODEDTOKEN MILEGA
        //🔹 Step 3: User ko DB se dhundo
        const user = await User.findById(decodedToken?._id)
        if(!user){
            throw new ApiError(401,"invalid refresh token")
    
        }
        //Step 4: Token match karo database ke token se
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401,"refresh token is expired or used")
        }
        
        const options = {
            httpOnly: true,
            secure: true
        }
        //Step 5: Naya token banao
        const {accessToken,newrefreshToken} = await generateAccessAndRefreshTokens(user._id)
         
        // Step 6: Token cookies me bhejo + response return karo
        return res
        .status(200)
        .cookie("accessToken", accessToken,options)
        .cookie("refreshToken", newrefreshToken,options)
        .json(
            new ApiResponse(
                200, 
                {accessToken, newrefreshToken},
                "Access token refreshed"
            )
        )
    //step 7: Agar token verify nahi hua, ya koi bhi galti aayi, to error throw karega.
    } catch (error) {
        throw new ApiError(401,error?.message || "Invalid refresh token")
        
    }


})

//isme hums user se current password change krne ka process
const changeCurrentPassword = asyncHandler(async(req,res) => {
    // Step 1: Extract Passwords from Request
    const {oldPassword, newPassword} = req.body

    //Step 2: Find User {req.user middleware (auth.middleware.js) se aata hai — means user already authenticated hai.
    //Uski ID se user ko database me search kar rahe hain.}
    const user = await User.findById(req.user?._id) //middleware se check kiye (req.user)

    //Step 3: Verify Old Password
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
    if(!isPasswordCorrect) {
        throw new ApiError(400,"invalid old password")
    }
    
    // Step 4: Save New Password
    user.password = newPassword
    await user.save({validateBeforeSave: false})
    return res
    .status(200)
    .json(new ApiResponse(200, {}, "password changfed sucessfully"))

})

//Your getCurrentUser function aims to return the currently logged-in user's data
const getCurrentUser = asyncHandler(async(req,res)=> {
    return res
    .status(200)
    .json(new ApiResponse(200, req.user, "current user fetched successfully"))
})

const updateAccountDetails = asyncHandler(async(req,res) => {
    const {fullName, email} = req.body  // Step 1: Get updated data from user
    //Step 2: Validation
    if(!fullName || !email){
        throw new ApiError(400, "All fields are required")
    }
    
    // Step 3: Update user details in DB
    const user = User.findByIdAndUpdate( //Yeh Mongoose ka method hai jo:id se user ko dhoondta hai,uska data update karta hai,aur (agar new: true diya ho) updated document return karta hai.

       req.user?._id,
        {
            $set:{ //Ye MongoDB ka $set operator hai.Iska matlab hai:"User ka fullName aur email ko naye values se update karo."Agar aisa karte hai: { fullName, email }, to woh puri document ko overwrite kar deta. Isliye $set safe hai.
                fullName,
                email,
                
            }
        },
        {new: true}  //isse updated document return hota hai.

    ).select("-password")
    //Step 5: Send Success Response
    return res
    .status(200)
    .json(new ApiResponse(200, user, "account details updated sucessfully"))
})

//updateUserAvatar function ek user ka profile picture (avatar) update karta hai — using multer and Cloudinary
const updateUserAvatar = asyncHandler(async(req,res) => {
    // / Step 1: Get Local Path from Multer
    const avatarLocalPath = req.file?.path //multer ne local pe upload kr di hogi

    //Step 2: Check if File is Missing
    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is missing")
    }
    // Step 3: Upload to Cloudinary and it will return the url
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    if (!avatar.url) {  
        throw new ApiError(400, "Error while uploading on avatar")
    }
    // Step 5: Save Avatar URL in DB
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar: avatar.url
            }
        },
        {new: true}
    ).select("-password")
    return res
        .status(200)
        .json(new ApiResponse(200, avatar.url, "Avatar updated successfully"));
})


const updateUserCoverImage = asyncHandler(async(req,res) => {
    // / Step 1: Get Local Path from Multer
    const coverImageLocalPath = req.file?.path //multer ne local pe upload kr di hogi

    //Step 2: Check if File is Missing
    if(!coverImageLocalPath){
        throw new ApiError(400, "Cover Image file is missing")
    }
    // Step 3: Upload to Cloudinary and it will return the url
    const coverImage= await uploadOnCloudinary(coverImageLocalPath)
    if (!coverImage.url) {  
        throw new ApiError(400, "Error while uploading on image")
    }
    // Step 5: Save coverImage URL in DB
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage: coverImage.url
            }
        },
        {new: true}
    ).select("-password")
    return res
        .status(200)
        .json(new ApiResponse(200, coverImage.url, "coverImage updated successfully"));
})

//AGGREGATION PIPELINE FOR SUBSCRIBERS SUBSCRIEBD 
const getUserChannelProfile = asyncHandler(async(req, res)=>{
    const {username} = req.params

    if (!username?.trim) {
        throw new ApiError(400, "username is missing")
    }
    //User.find({username}) //isme db se ek baar user lenge poora fir uski id ke basis pe aggration lagaenge

    //direct AGGREGATION mein match field hota hai wo saare documents mein se ek documents find kar lega
    const channel = await User.aggregate([ //aggregation pipeline likhne ke baad arrays aata hain
        {
            $match:{
                username: username?.toLowerCase() //Yeh stage filter karta hai User collection se jis user ka username match kare provided username se.
            }  //yaha pe hum ek document laae (e.g. chaiaurcode channel) ab chaiaurcode kaq subscriber find karna hai
        },
        {
            $lookup: {  //channel(total chaiaurcode kitna hai) ke count se subscriber mil jaega
                from: "Subscription", //kaha se dekhna chahte ho subscription.model.js se aaya hai,
                localField: "_id",
                foreignField: "channel",
                as: "subscribers" 
            }
        },
        {
            $lookup: {  //maine kis ko subscribe kr rkha hai
                from: "Subscription", 
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"

            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers", //subscribers ek field  hai(lookup) ka isiliye '$' use kiya
                },
                channelsSubscribedToCount: {
                    $size : "$subscribedTo"

                },
                isSubscribed: {
                    $cond:{
                        if: {$in: [req.user?._id, "$subscribers.subscriber"]},//Check karo kya req.user._id subscribers array ke andar kisi object ke subscriber field me hai ya nahi
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {  //Isme hum specify karte hain ki kaunse fields output me chahiye.Sirf selected fields ko allow karta hai — baaki sab ignore ho jaata hai.
                fullName: 1,
                username: 1,
                subscribersCount:1,
                channelsSubscribedToCount:1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1

            }
        }
    ])

    if(!channel?.length){  //agar channel hee nhi hai toh,  Agar channel ya to undefined/null hai ya uski length 0 hai, to condition true banegi
        throw new ApiError(404, "channel does not exist")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, channel[0],"user channel fetched successfully") //Since aggregation ek array return karta hai, hum first object channel[0] ko client ko bhejte hain.
    )

})

//Logged-in user ke watchHistory me stored video IDs ko fetch karo — aur un videos ke owner info bhi include karo.
const getWatchHistory = asyncHandler(async(req,res) => {
    const user = await User.aggregate([
        {
            //STEP:1) current Logged-in user dhoondta hai
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            //STEP:2) Watch history me jo video IDs stored hain, unke details videos collection se laaye ja rahe hain.Is lookup ke andar ek pipeline use ho rahi hai — matlab sub-aggregation.
            $lookup: {
                from:"videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [  //sub-pipeline
                    {
                        //Har video ka owner ek user hota hai.Is lookup se us owner ka fullName, username, avatar laaye ja rahe hain.pipeline ke through sirf ye fields hi fetch ho rahe hain.
                        $lookup: {
                            from: "user",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1,

                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{ //lookup ka result array hota hai.Yeh step ensure karta hai ki owner ek single object ban jaaye, na ki array.
                            owner:{
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
        //user ek array return karta hai aggregation ke through.Hum user[0] se watchHistory access karke client ko bhej dete hain.
        new ApiResponse(
            200,
            user[0].watchHistory,
            "watch history fetched successfully"
        )
    )
})


export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
 }; // named export
