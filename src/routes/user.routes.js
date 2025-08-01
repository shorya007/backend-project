//jo v method hum banate hain usko run karane mein route kam aata hai jab URL koi hit hoga tab run hona chaiye url ke sare ke sare jo routes hain uski ke liye banae hai url ke sb routes routes folder mein hee rkhte hain

//yaha user ke routes rkh rhe hain jaise registerUser , login etc

import { Router } from "express";
import { loginUser, logoutUser, registerUser } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"  //is upload ka use kaha krna hai middleware inject krne ke liye
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.route("/register").post(
    upload.fields([  //Jab user registration ke time images bhejta hai (jaise avatar ya coverImage), toh un files ko process karne ke liye yeh middleware zaroori hota hai. Yeh multer ka middleware hai jo multipart/form-data (file upload) request ko handle karta hai. upload.fields(...) ek middleware function hai
        {
            name:"avatar",
            maxCount:1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),  //ye krne ke baad hum images vej payenge
    //Agar tum upload.fields() ko registerUser ke baad likhte, toh file upload hone se pehle hi registerUser function chal jaata — jisme tumhare req.files ya req.body incomplete ya undefined hote.

    registerUser 
);  

router.route("/login").post(loginUser)

//secured routes
router.route("/logout").post(verifyJWT, logoutUser)  //verifyJWT, logoutUser ke run hone se phle chlega

export default router;
