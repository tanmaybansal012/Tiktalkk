import React from 'react';
import { useChatStore } from '../store/useChatStore';

interface SmartRepliesProps {
    onReplySelect: (reply: string) => void;
}

const SmartReplies: React.FC<SmartRepliesProps> = ({ onReplySelect }) => {
    const { smartReplies, isFetchingReplies } = useChatStore();

    if (isFetchingReplies) {
        return (
            <div className="flex gap-2 overflow-x-auto py-2 px-4 bg-base-100 items-center border-t border-base-300">
                <span className="loading loading-dots loading-sm text-primary"></span>
                <span className="text-xs text-base-content/50">AI is thinking...</span>
            </div>
        );
    }

    if (!smartReplies || smartReplies.length === 0) return null;

    return (
        <div className="flex gap-2 overflow-x-auto py-2 px-4 bg-base-100 border-t border-base-300 scrollbar-hide">
            {smartReplies.map((reply, idx) => (
                <button
                    key={idx}
                    onClick={() => onReplySelect(reply)}
                    className="btn btn-sm btn-outline btn-primary rounded-full whitespace-nowrap"
                >
                    ✨ {reply}
                </button>
            ))}
        </div>
    );
};

export default SmartReplies;
