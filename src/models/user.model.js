import mongoose, {Schema} from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt"

const userSchema = new Schema(
    {
        username:{
            type: String,
            required:true,
            unique:true,
            lowercase:true,
            trim:true,
            index:true,  //used for searching
        },
        email:{
            type: String,
            required:true,
            unique:true,
            lowercase:true,
            trim:true,
        },
        fullName:{
            type: String,
            required:true,
            trim:true,
            index:true
        },
        avatar:{
            type: String,  // cloudinary url(files,image upload krke url dedeta hai)
            required:true,
        },
        coverImage:{
            type: String,
        },
        watchHistory:[  // array hai kyuki multiple values add krenge
            {
                type:Schema.Types.ObjectId,
                ref:"video"
            }
        ],
        password:{
            type:String,
            required:[true,'Password is required']
        },
        refreshToken:{  //it's a long String
            type:String
        }
    },
    {
        timestamps:true
    }
)

userSchema.pre("save", async function(next){//Mongoose middleware (hook)-{pre} run beofre docs save in mongodb
    if(!this.isModified("password")) return next();  //agar modified nhi hua toh nilo

    this.password = await bcrypt.hash(this.password, 10)  //agar modified ho gya toh change kro
    next()
})

userSchema.methods.isPasswordCorrect=async function(password){
    return await bcrypt.compare(password, this.password)  //return krta hai true and false, (await)- coz of computation
}

userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullName: this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOEKN_EXPIRY
        }
    )
}

const User = mongoose.model("User", userSchema);
export default User;
 //ye User database se direct contact kr skta hai kuki ye mongoose ke through banahai  User hee hamare behalf pe mongoDB ko call krega

