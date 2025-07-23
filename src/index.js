import dotenv from "dotenv";
dotenv.config(); // 👈 this should be the first thing

import connectDB from "./db/index.js";
import app from "./app.js"; // 👈 make sure this exists and exports your express app

connectDB() //since db file is a asynchronomous method that's why its return promis
.then(() => {
    app.listen(process.env.PORT || 8000, () =>{
        console.log(` Server is running at port : ${process.env.PORT}`);       
    }) //yaha pe hum server start kr rhe hai(app ka), av tk bas mongodb ka connection hua tha
})
.catch((error) => {
    console.log("MONGO db connection failed!!!", error);
    
})