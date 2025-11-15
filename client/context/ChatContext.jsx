import { createContext, useContext, useState, useEffect } from "react";
import { AuthContext } from "./AuthContext";
import toast from "react-hot-toast";

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [unseenMessages, setUnseenMessages] = useState({});

const { socket, axios } = useContext(AuthContext);

// ⭐ FIX: Ensure axios always sends token
useEffect(() => {
  const token = localStorage.getItem("token");
  if (token) {
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  }
}, []);


  // ✅ Fetch all users
  const getUsers = async () => {
    try {
      const { data } = await axios.get("/api/messages/users");

      if (data.success) {
        setUsers(data.users);
        setUnseenMessages(data.unseenMessages);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // ✅ Fetch messages with a user
  const getMessages = async (userId) => {
    try {
      const { data } = await axios.get(`/api/messages/${userId}`);

      if (data.success) {
        setMessages(data.messages);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // ✅ Send message
  const sendMessage = async (messageData) => {
    try {
      const { data } = await axios.post(
        `/api/messages/send/${selectedUser._id}`,
        messageData
      );

      if (data.success) {
        // Add new message instantly
        setMessages((prev) => [...prev, data.newMessage]);

        // Refresh full message list (fix disappearing issue)
        await getMessages(selectedUser._id);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // ✅ Listen for real-time messages
  const subscribeToMessages = () => {
    if (!socket) return;

    socket.on("newMessage", (newMessage) => {
      // If conversation open with sender, display the message directly
      if (selectedUser && newMessage.senderId === selectedUser._id) {
        newMessage.seen = true;

        setMessages((prev) => [...prev, newMessage]);

        // Mark as seen in DB
        axios.put(`/api/messages/mark/${newMessage._id}`);
      } else {
        // Otherwise count as unseen
        setUnseenMessages((prev) => ({
          ...prev,
          [newMessage.senderId]:
            (prev[newMessage.senderId] || 0) + 1,
        }));
      }
    });
  };

  // Unsubscribe on unmount
  const unsubscribeToMessages = () => {
    if (socket) socket.off("newMessage");
  };

  useEffect(() => {
    subscribeToMessages();
    return () => unsubscribeToMessages();
  }, [socket, selectedUser]);

  const value = {
    users,
    messages,
    selectedUser,
    unseenMessages,
    setSelectedUser,
    setMessages,
    setUnseenMessages,
    getUsers,
    getMessages,
    sendMessage,
  };

  return (
    <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
  );
};
