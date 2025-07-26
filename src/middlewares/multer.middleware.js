import multer from "multer";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {  //Jab file upload hoti hai, yeh function batata hai ki file ko ./public/temp folder mein store karo.
      cb(null, "./public/temp")
    },
    filename: function (req, file, cb) {
      
      cb(null, file.originalname)
    }
  })
  
export const upload = multer({ 
    storage, 
})