import mongoose,{Schema} from "mongoose";

const tweetSchema = new Schema(
    {
        content: {
            type: String,
            reqired:true
        },
        owner: {
            type: Schema.Types.ObjectId
        }

    }, {timestamps : true}
)

export const Tweet = mongoose.model("Twiiter", tweetSchema)