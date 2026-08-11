import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef } from "react";

import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import SmartReplies from "./SmartReplies";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";
import { Edit2, Trash2, Check, X as XIcon } from "lucide-react";
import { useState } from "react";

const ChatContainer = () => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    subscribeToMessages,
    unsubscribeToMessages,
    getSmartReplies,
    clearSmartReplies,
    editMessage,
    deleteMessage,
  } = useChatStore();
  const { authUser } = useAuthStore();
  const messageEndRef = useRef<HTMLDivElement | null>(null);

  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const handleEditInit = (msgId: string, currentText: string) => {
    setEditingMessageId(msgId);
    setEditText(currentText);
  };

  const handleEditSubmit = () => {
    if (editingMessageId && editText.trim()) {
      editMessage(editingMessageId, editText.trim());
    }
    setEditingMessageId(null);
  };

  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.senderId !== authUser?._id && lastMessage.text) {
        getSmartReplies(lastMessage.text);
      } else {
        clearSmartReplies();
      }
    } else {
        clearSmartReplies();
    }
  }, [messages, authUser?._id, getSmartReplies, clearSmartReplies]);

  useEffect(() => {
    if (!selectedUser) return;
    getMessages(selectedUser._id);

  }, [selectedUser, getMessages]);

  useEffect(() => {
    subscribeToMessages();

    return () => unsubscribeToMessages();

  }, [subscribeToMessages, unsubscribeToMessages])

  useEffect(() => {
    if (messageEndRef.current && messages) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <ChatHeader />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => {
          const isOwnMessage = message.senderId === authUser?._id;
          const isEditing = editingMessageId === message._id;

          return (
            <div
              key={message._id}
              className={`chat ${isOwnMessage ? "chat-end" : "chat-start"} group`}
              ref={messageEndRef}
            >
              <div className=" chat-image avatar">
                <div className="size-10 rounded-full border">
                  <img
                    src={
                      isOwnMessage
                        ? authUser.profilePic || "/avatar.png"
                        : selectedUser?.profilePic || "/avatar.png"
                    }
                    alt="profile pic"
                  />
                </div>
              </div>
              <div className="chat-header mb-1">
                <time className="text-xs opacity-50 ml-1">
                  {formatMessageTime(message.createdAt)}
                </time>
              </div>
              <div className="chat-bubble flex flex-col relative">
                {message.image && (
                  <img
                    src={message.image}
                    alt="Attachment"
                    className="sm:max-w-50 rounded-md mb-2"
                  />
                )}
                {isEditing ? (
                  <div className="flex flex-col gap-2 min-w-[200px]">
                    <textarea
                      className="textarea textarea-bordered textarea-sm w-full bg-base-100 text-base-content"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                    />
                    <div className="flex justify-end gap-1">
                      <button onClick={() => setEditingMessageId(null)} className="btn btn-xs btn-ghost btn-circle">
                        <XIcon className="size-3" />
                      </button>
                      <button onClick={handleEditSubmit} className="btn btn-xs btn-primary btn-circle">
                        <Check className="size-3" />
                      </button>
                    </div>
                  </div>
                ) : (
                  message.text && <p>{message.text}</p>
                )}

                {/* Edit / Delete actions for own message */}
                {isOwnMessage && !isEditing && (
                  <div className="absolute -top-3 -right-2 hidden group-hover:flex bg-base-200 rounded-lg shadow-sm border border-base-300">
                    {message.text && (
                      <button
                        onClick={() => handleEditInit(message._id, message.text!)}
                        className="btn btn-xs btn-ghost px-1.5 rounded-r-none"
                      >
                        <Edit2 className="size-3 text-base-content/70 hover:text-primary" />
                      </button>
                    )}
                    <button
                      onClick={() => deleteMessage(message._id)}
                      className={`btn btn-xs btn-ghost px-1.5 ${message.text ? 'border-l border-base-300 rounded-l-none' : ''}`}
                    >
                      <Trash2 className="size-3 text-base-content/70 hover:text-error" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <SmartReplies onReplySelect={(reply) => {
        useChatStore.getState().sendMessages({ text: reply });
        clearSmartReplies();
      }} />
      <MessageInput />
    </div>
  );
};
export default ChatContainer;