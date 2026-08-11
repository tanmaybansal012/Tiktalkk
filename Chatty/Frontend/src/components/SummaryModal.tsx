import React from 'react';
import { X, Sparkles } from 'lucide-react';

interface SummaryModalProps {
    isOpen: boolean;
    onClose: () => void;
    summary: string | null;
    isSummarizing: boolean;
    chatName: string;
}

const SummaryModal: React.FC<SummaryModalProps> = ({ isOpen, onClose, summary, isSummarizing, chatName }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-base-200 rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
                <div className="flex items-center justify-between p-4 border-b border-base-300">
                    <div className="flex items-center gap-2">
                        <Sparkles className="text-primary size-5" />
                        <h3 className="font-semibold text-lg">AI Summary</h3>
                    </div>
                    <button onClick={onClose} className="btn btn-sm btn-circle btn-ghost">
                        <X className="size-4" />
                    </button>
                </div>

                <div className="p-6">
                    {isSummarizing ? (
                        <div className="flex flex-col items-center justify-center py-6 gap-4">
                            <span className="loading loading-spinner loading-lg text-primary"></span>
                            <p className="text-sm text-base-content/70">Analyzing conversation with {chatName}...</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <p className="text-base-content leading-relaxed whitespace-pre-wrap">
                                {summary || "No summary available."}
                            </p>
                        </div>
                    )}
                </div>

                <div className="bg-base-300 p-4 flex justify-end">
                    <button onClick={onClose} className="btn btn-sm btn-primary">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SummaryModal;
