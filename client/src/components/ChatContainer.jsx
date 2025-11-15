import React, { useEffect, useRef, useContext, useState } from "react";
import assets from "../assets/assets";
import { formateMessageTime } from "../lib/utils";
import { ChatContext } from "../../context/ChatContext";
import { AuthContext } from "../../context/AuthContext";
import toast from "react-hot-toast";

const ChatContainer = () => {
  const { messages, setSelectedUser, selectedUser, sendMessage, getMessages } =
    useContext(ChatContext);

  const { authUser, onlineUsers } = useContext(AuthContext);

  const scrollEnd = useRef();
  const [input, setInput] = useState("");

  // SEND TEXT MESSAGE
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    await sendMessage({ text: input.trim() });
    await getMessages(selectedUser._id);

    setInput("");
  };

  // SEND IMAGE
  const handleSendImage = async (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith("image/")) {
      toast.error("Select a valid image file");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      await sendMessage({ image: reader.result });
      await getMessages(selectedUser._id);
      e.target.value = "";
    };

    reader.readAsDataURL(file);
  };

  // LOAD MESSAGES
  useEffect(() => {
    if (selectedUser) getMessages(selectedUser._id);
  }, [selectedUser]);

  // AUTO SCROLL
  useEffect(() => {
    if (scrollEnd.current) {
      scrollEnd.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return selectedUser ? (
    <div className="h-full overflow-scroll relative backdrop-blur-lg">
      {/* HEADER */}
      <div className="flex items-center gap-3 py-3 mx-4 border-b border-stone-500">
        <img
          src={selectedUser.profilePic || assets.avatar_icon}
          alt=""
          className="w-8 rounded-full"
        />
        <p className="flex-1 text-lg text-white flex items-center gap-2">
          {selectedUser.fullName}

          {/* FIXED ONLINE CHECK */}
          {onlineUsers.includes(selectedUser._id.toString()) && (
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
          )}
        </p>

        <img
          onClick={() => setSelectedUser(null)}
          src={assets.arrow_icon}
          alt=""
          className="md:hidden max-w-7 cursor-pointer"
        />
      </div>

      {/* MESSAGES */}
      <div className="flex flex-col h-[calc(100%-120px)] overflow-y-scroll p-3 pb-6">
        {messages.map((msg, index) => {
          // normalize sender ID
          const senderId =
            typeof msg.senderId === "object"
              ? msg.senderId._id?.toString()
              : msg.senderId?.toString();

          const isSender = senderId === authUser._id?.toString();

          return (
            <div
              key={index}
              className={`flex items-end gap-2 ${
                isSender ? "justify-end" : "flex-row-reverse"
              }`}
            >
              {msg.image ? (
                <img
                  src={msg.image}
                  alt=""
                  className="max-w-[230px] border border-gray-700 rounded-lg mb-8"
                />
              ) : (
                <p
                  className={`p-2 max-w-[200px] md:text-sm rounded-lg mb-8 break-all bg-violet-500/30 text-white ${
                    isSender ? "rounded-br-none" : "rounded-bl-none"
                  }`}
                >
                  {msg.text}
                </p>
              )}

              <div className="text-center text-xs">
                <img
                  src={
                    isSender
                      ? authUser.profilePic || assets.avatar_icon
                      : selectedUser.profilePic || assets.avatar_icon
                  }
                  alt=""
                  className="w-7 rounded-full"
                />
                <p className="text-gray-50">
                  {formateMessageTime(msg.createdAt)}
                </p>
              </div>
            </div>
          );
        })}

        <div ref={scrollEnd}></div>

        {/* MESSAGE INPUT */}
        <div className="absolute bottom-0 left-0 right-0 flex items-center gap-3 p-3">
          <div className="flex-1 flex items-center bg-gray-100/12 px-3 rounded-full">
            <input
              onChange={(e) => setInput(e.target.value)}
              value={input}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage(e)}
              type="text"
              placeholder="Send a message"
              className="flex-1 text-sm p-3 border-none rounded-lg outline-none text-white placeholder-gray-400"
            />

            <input
              type="file"
              id="image"
              accept="image/png, image/jpeg"
              hidden
              onChange={handleSendImage}
            />

            <label htmlFor="image">
              <img
                src={assets.gallery_icon}
                alt=""
                className="w-5 mr-2 cursor-pointer"
              />
            </label>
          </div>

          <img
            onClick={handleSendMessage}
            src={assets.send_button}
            alt=""
            className="w-7 cursor-pointer"
          />
        </div>
      </div>
    </div>
  ) : (
    <div className="flex flex-col items-center justify-center gap-2 text-gray-500 bg-white/10 max-md:hidden">
      <img src={assets.logo_icon} className="max-w-16" alt="" />
      <p className="text-lg font-medium text-white">Chat anytime, anywhere</p>
    </div>
  );
};

export default ChatContainer;
