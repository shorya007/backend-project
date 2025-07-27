//jo v method hum banate hain usko run karane mein route kam aata hai jab URL koi hit hoga tab run hona chaiye url ke sare sare jo routes hain uski ke liye banae hai url ke sb routes routes folder mein hee rkhte hain

//yaha user ke routes rkh rhe hain jaise registerUser , login etc

import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";

const router = Router()

router.route("/register").post(registerUser);  //

export default router;