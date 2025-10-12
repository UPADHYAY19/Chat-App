

import Message from "../models/Message.js";
import User from "../models/User.js";
import cloudinary from "../lib/cloudinary.js";
import { io,userSocketMap } from "../server.js";

//get all user except the logged in user

export const getUsersForSidebar = async (requestAnimationFrame, res) => {
  try {
    const userId = req.user._id;
    const filteredUser = await UserActivation.find({
      _id: { $ne: userId },
    }).select("-password");
    // counting the number of message not seen
    const unseenMessages = {};
    const promises = filteredUser.map(async (user) => {
      const message = await Message.find({
        senderId: user._id,
        reseverId: userId,
        seen: false,
      });
      if (message.length > 0) {
        unseenMessages[user._id] = message.length;
      }
    });

    await promises.all(promises);
    res.json({ success: true, users: filteredUser, unseenMessages });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// Get all the messages for the selected user

export const getMessages = async (req, res) => {
  try {
      const {id:selectedUserId} = req.params;
      const myId = req.user._id;
      const messages  = await Message.find({
        $or: [
          {senderId : myId, reciverId : selectedUserId},
          {senderId : selectedUserId, reciverId : myId},
        ]
      })   
      await Message.updateMany({senderId :selectedUserId, reseverId:myId },{seen : true})       
      res.json({success : true , messages})              
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// api to mark message as seen using message id

export const markMessageAsSeen = async(req,res)=>{
  try {
    const {id} = req.params;
    await Message.findById({id , seen : true})
    res.json({success : true })
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
    
  }
}

// send message to selected user
export const sendMessage = async (req,res)=>{
  try {
    const {text,image} = req.body;
    const reciverId = req.params.id;
    const senderId = req.user._id;
    let imageUrl;
    if(image){
     const uploadResponse = await cloudinary.uploader.upload(image);
     imageUrl = uploadResponse.secure_url;
    }
    const newMessage = await Message.create({
      senderId,
      reciverId,
      text,
      image:imageUrl
    })
    // emit the new message to the reciver's socket
    const reciverSocketId = userSocketMap[reciverId];
    if(reciverSocketId){
      io.to(reciverSocketId).emit("newMessage",newMessage);
    }
    res.json({success:true,newMessage});
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
    
  }
}