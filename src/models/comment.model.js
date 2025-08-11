import mongoose,{Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";  //it injects as a plugin = Extra features added automatically into something (like a schema) by plugging in code."

const commentSchema = new Schema(
    {
        content: {
            type: String,
            required: true
        },
        video:{
            type: Schema.Types.ObjectId, //schema types dena object id wala
            ref: "Video"
        },
        owner:{
            type: Schema.Types.ObjectId, //schema types dena object id wala
            ref: "User"
        }
    },
    {
        timestamps: true
    }
)



commentSchema.plugin(mongooseAggregatePaginate) 

export const Comment = mongoose.model("comment", commentSchema)