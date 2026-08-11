import { useState } from "react";
import { useGroupStore } from "../store/useGroupStore";
import { useAuthStore } from "../store/useAuthStore";
import { X, Info, Sparkles } from "lucide-react";
import GroupInfoPanel from "./GroupInfoPanel";
import SummaryModal from "./SummaryModal";

const GroupChatHeader = () => {
    const { selectedGroup, setSelectedGroup, summarizeChat, chatSummary, isSummarizing, clearSummary } = useGroupStore();
    const { onlineUsers } = useAuthStore();
    const [showInfo, setShowInfo] = useState(false);
    const [isSummaryOpen, setIsSummaryOpen] = useState(false);

    if (!selectedGroup) return null;

    const onlineCount = selectedGroup.members.filter((m) =>
        onlineUsers.includes(m._id)
    ).length;

    return (
        <>
            <div className="p-2.5 border-b border-base-300">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="avatar placeholder">
                            <div className="size-10 rounded-full bg-primary text-primary-content">
                                {selectedGroup.groupIcon ? (
                                    <img
                                        src={selectedGroup.groupIcon}
                                        alt={selectedGroup.name}
                                        className="rounded-full object-cover"
                                    />
                                ) : (
                                    <span className="text-lg font-bold">
                                        {selectedGroup.name.charAt(0).toUpperCase()}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div>
                            <h3 className="font-medium">{selectedGroup.name}</h3>
                            <p className="text-sm text-base-content/70">
                                {selectedGroup.members.length} members · {onlineCount} online
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => {
                                setIsSummaryOpen(true);
                                summarizeChat(selectedGroup._id);
                            }}
                            className="btn btn-sm btn-outline btn-primary rounded-full hidden sm:flex mr-2"
                        >
                            <Sparkles className="size-4" />
                            Summarize Chat
                        </button>

                        <button
                            className="btn btn-sm btn-ghost btn-circle"
                            onClick={() => setShowInfo(true)}
                            title="Group Info"
                        >
                            <Info className="size-4" />
                        </button>
                        <button onClick={() => setSelectedGroup(null)}>
                            <X />
                        </button>
                    </div>
                </div>
            </div>

            <GroupInfoPanel
                isOpen={showInfo}
                onClose={() => setShowInfo(false)}
            />

            <SummaryModal
                isOpen={isSummaryOpen}
                onClose={() => {
                    setIsSummaryOpen(false);
                    clearSummary();
                }}
                summary={chatSummary}
                isSummarizing={isSummarizing}
                chatName={selectedGroup.name}
            />
        </>
    );
};

export default GroupChatHeader;
