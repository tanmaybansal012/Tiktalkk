import { useEffect, useRef, useState } from "react";
import { useFriendStore } from "../store/useFriendStore";
import { Search, UserPlus, X, Loader2 } from "lucide-react";

interface FindPeopleModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const FindPeopleModal = ({ isOpen, onClose }: FindPeopleModalProps) => {
    const [query, setQuery] = useState("");
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const {
        searchResults,
        isSearching,
        isSendingRequest,
        searchUsers,
        sendFriendRequest,
        clearSearchResults,
    } = useFriendStore();

    useEffect(() => {
        if (!isOpen) {
            setQuery("");
            clearSearchResults();
        }
    }, [isOpen, clearSearchResults]);

    const handleQueryChange = (value: string) => {
        setQuery(value);

        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        debounceRef.current = setTimeout(() => {
            searchUsers(value);
        }, 300);
    };

    useEffect(() => {
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, []);

    if (!isOpen) return null;

    return (
        <div className="modal modal-open" id="find-people-modal">
            <div className="modal-box max-w-md">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-lg">Find People</h3>
                    <button
                        className="btn btn-sm btn-circle btn-ghost"
                        onClick={onClose}
                    >
                        <X className="size-4" />
                    </button>
                </div>

                {/* Search input */}
                <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-base-content/50" />
                    <input
                        type="text"
                        placeholder="Search by name..."
                        className="input input-bordered w-full pl-10"
                        value={query}
                        onChange={(e) => handleQueryChange(e.target.value)}
                        autoFocus
                    />
                </div>

                {/* Results */}
                <div className="max-h-72 overflow-y-auto space-y-1">
                    {isSearching && (
                        <div className="flex justify-center py-6">
                            <Loader2 className="size-6 animate-spin text-primary" />
                        </div>
                    )}

                    {!isSearching && query.trim() && searchResults.length === 0 && (
                        <div className="text-center text-base-content/50 py-6">
                            No users found
                        </div>
                    )}

                    {!isSearching &&
                        searchResults.map((user) => (
                            <div
                                key={user._id}
                                className="flex items-center gap-3 p-3 rounded-lg hover:bg-base-200 transition-colors"
                            >
                                <img
                                    src={user.profilePic || "/avatar.png"}
                                    alt={user.fullName}
                                    className="size-10 rounded-full object-cover"
                                />
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium truncate">
                                        {user.fullName}
                                    </div>
                                    <div className="text-xs text-base-content/50 truncate">
                                        {user.email}
                                    </div>
                                </div>
                                <button
                                    className="btn btn-sm btn-primary gap-1"
                                    onClick={() => sendFriendRequest(user._id)}
                                    disabled={isSendingRequest[user._id]}
                                >
                                    {isSendingRequest[user._id] ? (
                                        <Loader2 className="size-3 animate-spin" />
                                    ) : (
                                        <UserPlus className="size-3" />
                                    )}
                                    <span className="hidden sm:inline">Add</span>
                                </button>
                            </div>
                        ))}

                    {!query.trim() && !isSearching && (
                        <div className="text-center text-base-content/50 py-6">
                            Start typing to search for people
                        </div>
                    )}
                </div>
            </div>
            <div className="modal-backdrop" onClick={onClose}></div>
        </div>
    );
};

export default FindPeopleModal;
