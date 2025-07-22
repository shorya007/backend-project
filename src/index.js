import dotenv from "dotenv";
dotenv.config(); // 👈 this should be the first thing

import connectDB from "./db/index.js";

connectDB();
