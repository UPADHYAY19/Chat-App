import express from "express";
import "dotenv/config";
import cors from "cors";
import http from "http";
import { connectDB } from "./lib/db.js";
import userRoutes from './router/userRoutes.js';
import messageRoutes from './router/messageRoutes.js';
import { Server} from "socket.io";

// create Express app and http server

const app = express();
const server = http.createServer(app);
// initilize socket.io server

export const io = new Server(server,{
    cors : {origin : "*"}
})
// store online users
export const userSocketMap={}; // {userid : socketId}
// socket connection handler
io.on("connection",(socket)=>{
    const userId = socket.handshake.query.userId;
    console.log("User Connected ", userId);
    if(userId){
        userSocketMap[userId] = socket.id;
    }
    // emit online users to all connected client
    io.emit("getOnlineUser",Object.keys(userSocketMap));

    socket.on("disconnect",()=>{
        console.log("User Disconnected",userId);
        delete userSocketMap[userId];
        io.emit("getOnlineUser",Object.keys(userSocketMap));
        
        
    })
    
})



// middleware setup 
// middleware setup 
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ✅ CORS setup
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Routes setup
app.use("/api/status", (req, res) => res.send("Server is Live"));
app.use("/api/auth", userRoutes);
app.use("/api/messages", messageRoutes);

// Routes setup
app.use("/api/status",(req,res)=>res.send("Server is Live"));
app.use("/api/auth",userRoutes)
app.use("/api/messages",messageRoutes)

//Connect to Mongodb
await connectDB();
const PORT = process.env.PORT || 5000;
server.listen(PORT,()=>console.log("Server is running on PORT:" + PORT)
);