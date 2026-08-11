import { useEffect, useRef, useState } from "react";
import { useGroupStore } from "../store/useGroupStore";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import GroupChatHeader from "./GroupChatHeader";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import SmartReplies from "./SmartReplies";
import { formatMessageTime } from "../lib/utils";
import { Image, Send, X, Edit2, Trash2, Check, X as XIcon } from "lucide-react";
import toast from "react-hot-toast";

const GroupChatContainer = () => {
    const {
        selectedGroup,
        groupMessages,
        getGroupMessages,
        sendGroupMessage,
        isLoadingGroupMessages,
        editGroupMessage,
        deleteGroupMessage,
    } = useGroupStore();
    const { authUser } = useAuthStore();
    const { getSmartReplies, clearSmartReplies } = useChatStore();
    const messageEndRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (groupMessages.length > 0) {
            const lastMessage = groupMessages[groupMessages.length - 1];
            // Check if sender is not me. Note: senderId could be an object or a string.
            const senderIdStr = typeof lastMessage.senderId === 'object' ? lastMessage.senderId._id : lastMessage.senderId;
            if (senderIdStr !== authUser?._id && lastMessage.text) {
                getSmartReplies(lastMessage.text);
            } else {
                clearSmartReplies();
            }
        } else {
            clearSmartReplies();
        }
    }, [groupMessages, authUser?._id, getSmartReplies, clearSmartReplies]);

    const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
    const [editTextState, setEditTextState] = useState("");

    const handleEditInit = (msgId: string, currentText: string) => {
        setEditingMessageId(msgId);
        setEditTextState(currentText);
    };

    const handleEditSubmit = () => {
        if (editingMessageId && editTextState.trim()) {
            editGroupMessage(editingMessageId, editTextState.trim());
        }
        setEditingMessageId(null);
    };

    const [text, setText] = useState("");
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        if (!selectedGroup) return;
        getGroupMessages(selectedGroup._id);
    }, [selectedGroup, getGroupMessages]);

    useEffect(() => {
        if (messageEndRef.current && groupMessages) {
            messageEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [groupMessages]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            toast.error("Please select an image file");
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            if (typeof reader.result === "string") {
                setImagePreview(reader.result);
            }
        };
        reader.readAsDataURL(file);
    };

    const removeImage = () => {
        setImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleSendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!selectedGroup) {
            toast.error("No group selected");
            return;
        }

        if (!text.trim() && !imagePreview) return;

        try {
            await sendGroupMessage(selectedGroup._id, {
                text: text.trim() || undefined,
                image: imagePreview || undefined,
            });

            setText("");
            setImagePreview(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        } catch (error) {
            console.error("Failed to send message:", error);
        }
    };

    const getSenderInfo = (senderId: string | { _id: string; fullName: string; profilePic?: string }) => {
        if (typeof senderId === "object" && senderId !== null) {
            return {
                _id: senderId._id,
                fullName: senderId.fullName,
                profilePic: senderId.profilePic,
            };
        }
        // Fallback: find from group members
        const member = selectedGroup?.members.find((m) => m._id === senderId);
        return {
            _id: senderId,
            fullName: member?.fullName || "Unknown",
            profilePic: member?.profilePic,
        };
    };

    if (isLoadingGroupMessages) {
        return (
            <div className="flex-1 flex flex-col overflow-auto">
                <GroupChatHeader />
                <MessageSkeleton />
                {/* Message input placeholder */}
                <div className="p-4 w-full">
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            className="w-full input input-bordered rounded-lg input-sm sm:input-md"
                            placeholder="Type a message..."
                            disabled
                        />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col overflow-auto">
            <GroupChatHeader />

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {groupMessages.map((message) => {
                    const sender = getSenderInfo(message.senderId);
                    const isOwnMessage = sender._id === authUser?._id;

                    return (
                        <div
                            key={message._id}
                            className={`chat ${isOwnMessage ? "chat-end" : "chat-start"}`}
                            ref={messageEndRef}
                        >
                            <div className="chat-image avatar">
                                <div className="size-10 rounded-full border">
                                    <img
                                        src={
                                            isOwnMessage
                                                ? authUser?.profilePic || "/avatar.png"
                                                : sender.profilePic || "/avatar.png"
                                        }
                                        alt="profile pic"
                                    />
                                </div>
                            </div>
                            <div className="chat-header mb-1">
                                {!isOwnMessage && (
                                    <span className="text-xs font-medium mr-1">
                                        {sender.fullName}
                                    </span>
                                )}
                                <time className="text-xs opacity-50">
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
                                {editingMessageId === message._id ? (
                                    <div className="flex flex-col gap-2 min-w-[200px]">
                                        <textarea
                                            className="textarea textarea-bordered textarea-sm w-full bg-base-100 text-base-content"
                                            value={editTextState}
                                            onChange={(e) => setEditTextState(e.target.value)}
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
                                {isOwnMessage && editingMessageId !== message._id && (
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
                                            onClick={() => deleteGroupMessage(message._id)}
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
                if (selectedGroup) {
                    sendGroupMessage(selectedGroup._id, { text: reply });
                }
                clearSmartReplies();
            }} />

            {/* Message Input */}
            <div className="p-4 w-full">
                {imagePreview && (
                    <div className="mb-3 flex items-center gap-2">
                        <div className="relative">
                            <img
                                src={imagePreview}
                                alt="Preview"
                                className="w-20 h-20 object-cover rounded-lg border border-zinc-700"
                            />
                            <button
                                onClick={removeImage}
                                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-base-300
                                flex items-center justify-center"
                                type="button"
                            >
                                <X className="size-3" />
                            </button>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    <div className="flex-1 flex gap-2">
                        <input
                            type="text"
                            className="w-full input input-bordered rounded-lg input-sm sm:input-md"
                            placeholder="Type a message..."
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                        />

                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleImageChange}
                        />

                        <button
                            type="button"
                            className={`flex btn btn-circle ${
                                imagePreview ? "text-emerald-500" : "text-zinc-400"
                            }`}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Image size={20} />
                        </button>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-sm btn-circle"
                        disabled={!text.trim() && !imagePreview}
                    >
                        <Send size={22} />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default GroupChatContainer;
