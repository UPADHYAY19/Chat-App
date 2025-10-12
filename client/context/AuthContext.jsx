import { createContext, useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { io } from "socket.io-client";

const backendUrl = import.meta.env.VITE_BACKEND_URL;

axios.defaults.baseURL = backendUrl;

export const AuthContext = createContext();

export const AuthContextProvider = ({ children }) => {
  const [authUser, setAuthUser] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [socket, setSocket] = useState(null);

  // ✅ Get token from localStorage
  const getToken = () => localStorage.getItem("token");

  // ✅ Set axios header
  const setAuthHeader = (token) => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common["Authorization"];
    }
  };

  // ✅ Check if user is authenticated
  const checkAuth = async () => {
    const token = getToken();
    if (!token) return;

    setAuthHeader(token);

    try {
      const { data } = await axios.get("/api/auth/check");
      if (data.success && data.user) {
        setAuthUser(data.user);
        connectSocket(data.user);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
      logout(); // optional: clear invalid token
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  // ✅ Login / Signup
  const login = async (state, credentials) => {
    try {
      const { data } = await axios.post(`/api/auth/${state}`, credentials);

      if (data.success && data.userData && data.token) {
        const token = data.token;
        localStorage.setItem("token", token);
        setAuthHeader(token);

        setAuthUser(data.userData);
        connectSocket(data.userData);
        toast.success(data.message);
      } else {
        toast.error(data.message || "Something went wrong");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  // ✅ Update user profile
  const updateProfile = async (body) => {
    const token = getToken();
    if (!token) {
      toast.error("You are not logged in");
      return;
    }

    try {
      const { data } = await axios.put("/api/auth/update-profile", body, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success && data.user) {
        setAuthUser(data.user);
        toast.success("Profile updated successfully");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  // ✅ Logout
  const logout = () => {
    localStorage.removeItem("token");
    setAuthUser(null);
    setOnlineUsers([]);
    delete axios.defaults.headers.common["Authorization"];
    if (socket) socket.disconnect();
    toast.success("Logged out successfully");
  };

  // ✅ Connect to socket
  const connectSocket = (userData) => {
    if (!userData?._id) return;

    const newSocket = io(backendUrl, {
      query: { userId: userData._id },
    });

    setSocket(newSocket);

    newSocket.on("getOnlineUser", (userIds) => {
      setOnlineUsers(userIds);
    });
  };

  const value = {
    authUser,
    onlineUsers,
    socket,
    login,
    logout,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
