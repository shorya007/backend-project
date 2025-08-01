// this miidleware will verufy user is present or not
import jwt from "jsonwebtoken"
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import User from "../models/user.model.js";

export const verifyJWT = asyncHandler(async(req, _, next) => {  //Express middleware function
    
    try {
        // Token Nikalna:
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "") //Optional chaining (?.) ka use hai to avoid error if undefined
    
    
        if(!token) {
            throw new ApiError(401,"Unauthorized request")
        }
        const decodedTokenInfo=jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        const user = await User.findById(decodedTokenInfo?._id).select("-password -refreshToken") //JWT se milne wale _id se DB me user find kiya
    
    
        if(!user) { //Agar token to valid tha, lekin uss ID ka user ab DB me nahi hai (deleted etc.), to access deny
            
            throw new ApiError(401, "Invalis Access Token")
        }
    
        req.user = user;
        next()
    } catch (error) {
        throw new ApiError(401, error?.message || "invalid access token")
        
    }
})