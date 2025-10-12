import mongoose  from "mongoose";

const messageSchema = new mongoose.Schema({
    senderId:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true},
    reseverId:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true},
    text:{type:String,},
    image:{type:String},
    seen:{type:Boolean,default:false}
    
},{timestamp:true})

const Message = mongoose.model("Message",messageSchema);

export default Message;
