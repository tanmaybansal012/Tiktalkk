import { useEffect } from "react";
import { useFriendStore } from "../store/useFriendStore";
import { Check, X, Clock } from "lucide-react";

interface FriendRequestsDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

const FriendRequestsDrawer = ({ isOpen, onClose }: FriendRequestsDrawerProps) => {
    const { friendRequests, getFriendRequests, acceptFriendRequest, rejectFriendRequest } =
        useFriendStore();

    useEffect(() => {
        if (isOpen) {
            getFriendRequests();
        }
    }, [isOpen, getFriendRequests]);

    if (!isOpen) return null;

    return (
        <div className="modal modal-open" id="friend-requests-modal">
            <div className="modal-box max-w-md">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-lg">Friend Requests</h3>
                    <button
                        className="btn btn-sm btn-circle btn-ghost"
                        onClick={onClose}
                    >
                        <X className="size-4" />
                    </button>
                </div>

                {/* Received Requests */}
                <div className="mb-6">
                    <h4 className="text-sm font-semibold text-base-content/70 mb-2 uppercase tracking-wide">
                        Received ({friendRequests.received.length})
                    </h4>

                    {friendRequests.received.length === 0 ? (
                        <p className="text-sm text-base-content/50 py-3">No pending requests</p>
                    ) : (
                        <div className="space-y-1">
                            {friendRequests.received.map((user) => (
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
                                        <div className="font-medium truncate">{user.fullName}</div>
                                        <div className="text-xs text-base-content/50 truncate">
                                            {user.email}
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <button
                                            className="btn btn-sm btn-circle btn-success"
                                            onClick={() => acceptFriendRequest(user._id)}
                                            title="Accept"
                                        >
                                            <Check className="size-4" />
                                        </button>
                                        <button
                                            className="btn btn-sm btn-circle btn-error"
                                            onClick={() => rejectFriendRequest(user._id)}
                                            title="Reject"
                                        >
                                            <X className="size-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Sent Requests */}
                <div>
                    <h4 className="text-sm font-semibold text-base-content/70 mb-2 uppercase tracking-wide">
                        Sent ({friendRequests.sent.length})
                    </h4>

                    {friendRequests.sent.length === 0 ? (
                        <p className="text-sm text-base-content/50 py-3">No sent requests</p>
                    ) : (
                        <div className="space-y-1">
                            {friendRequests.sent.map((user) => (
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
                                        <div className="font-medium truncate">{user.fullName}</div>
                                        <div className="text-xs text-base-content/50">
                                            {user.email}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 text-warning">
                                        <Clock className="size-3" />
                                        <span className="text-xs">Pending</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            <div className="modal-backdrop" onClick={onClose}></div>
        </div>
    );
};

export default FriendRequestsDrawer;
