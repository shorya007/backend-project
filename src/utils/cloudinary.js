
//File ko Cloudinary pe upload karo → successfully hone par local se delete karo → error aaye toh bhi delete karo.

import {v2 as cloudinary} from "cloudinary"
import fs from "fs" //fs ka matlab hai File System module – isse tum local system ke files ko read, write, delete kar sakte ho. Yahan use ho raha hai temporary file ko delete karne ke liye.

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null
        //upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"  //kon sa resource upload kr reh ho
        })
        // file has been uploaded successfully
        //console.log("file is uploaded on cloudinary ", response.url);
        fs.unlinkSync(localFilePath) //File successful upload ho gayi hai, toh ab local system se us file ko hata diya ja raha hai (temporary file ko delete kar diya). unlinkSync() synchronously file delete karta hai.
        return response;

    } catch (error) {
        fs.unlinkSync(localFilePath) // remove the locally saved temporary file as the upload operation got failed
        return null;
    }
}



export {uploadOnCloudinary}