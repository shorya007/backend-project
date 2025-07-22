import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {  //async isiliye kiye kyuki database se baat krnw mein time lagta hai
    try {
        const connectionInstance=await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`) //mongoose hume return object deta hai e.g:connectionInstance wo usko handle kr lega
        console.log(`\n ✅MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`); //// Prints MongoDB connection success message with the connected host name in the console
    } catch (error) {
        console.log("MONGODB connection FAILED", error);
        process.exit(1)  //node.js access deta hai process ka without importing it
    }
}

export default connectDB;


//CHATGPT Answer:- it is also correct
// import mongoose from "mongoose";

// const connectDB = async () => {
//   try {
//     const connectionInstance = await mongoose.connect(process.env.MONGODB_URI);
//     console.log(`\n✅ MongoDB connected! HOST: ${connectionInstance.connection.host}`);
//   } catch (error) {
//     console.log("❌ MongoDB connection error:", error);
//     process.exit(1);
//   }
// };

// export default connectDB;
