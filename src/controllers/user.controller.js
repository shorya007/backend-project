//Jab frontend se koi request aati hai (jaise user login kare, register kare, profile update kare), to user.controller.js woh request receive karta hai.
//Yeh file input data ko check karti hai (jaise email, password valid hai ya nahi), aur agar sab theek hai to aage service ya model ko call karti hai.

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

export { registerUser }; // named export
