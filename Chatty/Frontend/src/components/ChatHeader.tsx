import { X, Sparkles } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { formatLastSeen } from "../lib/utils";
import { useState } from "react";
import SummaryModal from "./SummaryModal";

const ChatHeader = () => {
  const { selectedUser, setSelectedUser, summarizeChat, chatSummary, isSummarizing, clearSummary } = useChatStore();
  const { onlineUsers } = useAuthStore();
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);

  if (!selectedUser) return null

  const isOnline = onlineUsers.includes(selectedUser._id);

  return (
    <div className="p-2.5 border-b border-base-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="avatar">
            <div className="size-10 rounded-full relative">
              <img src={selectedUser.profilePic || "/avatar.png"} alt={selectedUser.fullName} />
            </div>
          </div>

          <div>
            <h3 className="font-medium">{selectedUser.fullName}</h3>
            <p className="text-sm text-base-content/70">
              {isOnline
                ? "Online"
                : selectedUser.lastSeen
                  ? formatLastSeen(selectedUser.lastSeen)
                  : "Offline"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              setIsSummaryOpen(true);
              summarizeChat(selectedUser._id);
            }}
            className="btn btn-sm btn-outline btn-primary rounded-full hidden sm:flex"
          >
            <Sparkles className="size-4" />
            Summarize Chat
          </button>
          
          <button onClick={() => setSelectedUser(null)}>
            <X />
          </button>
        </div>
      </div>
      
      <SummaryModal
        isOpen={isSummaryOpen}
        onClose={() => {
          setIsSummaryOpen(false);
          clearSummary();
        }}
        summary={chatSummary}
        isSummarizing={isSummarizing}
        chatName={selectedUser.fullName}
      />
    </div>
  );
};
export default ChatHeader;