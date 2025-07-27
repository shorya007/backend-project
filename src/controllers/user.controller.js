import { asyncHandler } from "../utils/asyncHandler.js";


const registerUser = asyncHandler( async (req , res)=>{ //registerUser is wrapped inside asyncHandler, which means: If any error occurs inside the async function, it will be automatically caught and passed to the Express error handler.
    res.status(200).json({
        message: "ok received successfully"
    })
})

export { registerUser }; // named export
