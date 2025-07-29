import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import User from "../models/user.model.js";

import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

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

    const {fullName, email, username, password} = req.body
    console.log("email", email);
    // if(fullName === ""){  //agar fullname empty hai toh
    //     throw new ApiError(400,"fullname is required")
    // }

    if (
        [fullName,email,username,password].some((field)=>
            field?.trim() === ""
        )
    ) {
        throw new ApiError(400,"All field are required")
    }

    const existedUser=await User.findOne({
        $or: [{username}, {email}]  //mujhe ye find krke batao aisa ek user jo is email aur username ko match krta hai
    })
    
    if(existedUser) {
        throw new ApiError(409,"user with email or username already exists")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path //Ye line ek safe way hai to access the uploaded avatar image file’s path
    //(?. :-it is called as optional chaining it ensures ki code crash na kare)

    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(400,"Avatar file is required")
    }

    const newUser = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage:coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(newUser._id).select(
        "-password -refreshToken"
    )

    if(!createdUser) {
        throw new ApiError(500, "Something went wrogn while registering a user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "user registered successfully")
    )
})

export { registerUser }; // named export
