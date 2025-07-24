import mongoose,{Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";  //it injects as a plugin = Extra features added automatically into something (like a schema) by plugging in code."

const videoSchema = new Schema(
    {
        videoFile:{
            type:String, // which come from cloudinary url
            required:true,
        },
        thumbnail:{
            type:String,  // which come from cloudinary url
            required:true
        },
        title:{
            type:String,
            required:true
        },
        descrition:{
            type:String,
            required:true
        },
        duration:{
            type:Number,
            required:true
        },
        views:{
            type:Number,
            default:0
        },
        idPublished:{
            type: Boolean,
            default:true
        },
        owner:{
            type:Schema.Types.ObjectId,
            ref:"User"
        }


    },
    {
        timestamps:true
    }
)

videoSchema.plugin(mongooseAggregatePaginate)  //ab hum yaha aggregation queries likh skte hain

export const Video = mongoose.nodel("Video",videoSchema)