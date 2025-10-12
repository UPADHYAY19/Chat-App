import { createContext ,useContext,useState} from "react";
import { AuthContext } from "./AuthContext";
import toast from "react-hot-toast";
import { useEffect } from "react";

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [unseenMessages, setUnseenMessages] = useState({});

  const { socket, axios } = useContext(AuthContext);
  // fun to get all users for the sidebar

  const getUsers = async ()=>{
    try {
        const {data} = await axios.get("/api/messages/users");
        if(data.success){
            setUsers(data.users)
            setUnseenMessages(data.unseenMessages)
        }
    } catch (error) {
        toast.error(error.messages)
        
    }
    // function to get messages for selected user
    const getMessages = async(userId)=>{
        try {
          const {data} =  await axios.get(`/api/messages/${userId}`);
          if(data.success){
            setMessages(data.messages)
          }
        } catch (error) {
             toast.error(error.messages)
        }
    }
  }

  // fun to send message to the selected user
  const sendMessage = async(messageData)=>{
    try {
       const {data} = await axios.post(`/api/messages/send/${selectedUser._id},messageData`);
       if(data.success){
        setMessages((prevMessages)=>[...prevMessages,data.newMessage])}
        else{
            toast.error(error.message);
        }
    } catch (error) {
            toast.error(error.message);
        
    }
  }

  // fun to subscribe to messages for selected user

  const subscribeToMessages = async () =>{
    if(!socket) return;
    socket.on("newMessage",(newMessage)=>{
       if(selectedUser && newMessage.senderId === selectedUser._id){
        newMessage.seen = true;
        setMessages((prevMessages)=>[...prevMessages,newMessage]);
        axios.put(`/api/messsages/mark/${newMessage._id}`)
       } 
       else{
        setUnseenMessages((prevUnseenMessages)=>({
           ... prevUnseenMessages , [newMessage.senderId] :
           prevUnseenMessages[newMessage.senderId] ? prevUnseenMessages
           [newMessage.senderId] + 1 : 1
        }))
       }
    })
  }

  // fun to unsubscribe from the messages
  const unsubscribeToMessages = ()=>{
    if(socket) socket.off("newMessage");
  }

  useEffect(()=>{
    subscribeToMessages();
    return ()=> unsubscribeToMessages();
  },[socket,selectedUser])

  const value = {
    // Add context state and functions here
    messages,users,selectedUser,getUsers,setMessages,sendMessage,
    setSelectedUser,unseenMessages,setUnseenMessages
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
