import { useState } from "react";
import { useFriendStore } from "../store/useFriendStore";
import { useGroupStore } from "../store/useGroupStore";
import { X, Users, Loader2 } from "lucide-react";

interface CreateGroupModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const CreateGroupModal = ({ isOpen, onClose }: CreateGroupModalProps) => {
    const [name, setName] = useState("");
    const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
    const { friends } = useFriendStore();
    const { createGroup, isCreatingGroup } = useGroupStore();

    const toggleMember = (userId: string) => {
        setSelectedMembers((prev) =>
            prev.includes(userId)
                ? prev.filter((id) => id !== userId)
                : [...prev, userId]
        );
    };

    const handleCreate = async () => {
        if (!name.trim()) return;
        if (selectedMembers.length === 0) return;

        await createGroup({ name: name.trim(), members: selectedMembers });
        setName("");
        setSelectedMembers([]);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="modal modal-open" id="create-group-modal">
            <div className="modal-box max-w-md">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        <Users className="size-5" />
                        New Group
                    </h3>
                    <button
                        className="btn btn-sm btn-circle btn-ghost"
                        onClick={onClose}
                    >
                        <X className="size-4" />
                    </button>
                </div>

                {/* Group Name */}
                <div className="mb-4">
                    <label className="label">
                        <span className="label-text font-medium">Group Name</span>
                    </label>
                    <input
                        type="text"
                        placeholder="Enter group name..."
                        className="input input-bordered w-full"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        maxLength={50}
                    />
                </div>

                {/* Friend Selection */}
                <div className="mb-4">
                    <label className="label">
                        <span className="label-text font-medium">
                            Select Members ({selectedMembers.length} selected)
                        </span>
                    </label>
                    <div className="max-h-52 overflow-y-auto border border-base-300 rounded-lg">
                        {friends.length === 0 ? (
                            <p className="text-sm text-base-content/50 p-4 text-center">
                                No friends to add. Add friends first!
                            </p>
                        ) : (
                            friends.map((friend) => (
                                <label
                                    key={friend._id}
                                    className="flex items-center gap-3 p-3 hover:bg-base-200 cursor-pointer transition-colors"
                                >
                                    <input
                                        type="checkbox"
                                        className="checkbox checkbox-sm checkbox-primary"
                                        checked={selectedMembers.includes(friend._id)}
                                        onChange={() => toggleMember(friend._id)}
                                    />
                                    <img
                                        src={friend.profilePic || "/avatar.png"}
                                        alt={friend.fullName}
                                        className="size-8 rounded-full object-cover"
                                    />
                                    <span className="text-sm font-medium truncate">
                                        {friend.fullName}
                                    </span>
                                </label>
                            ))
                        )}
                    </div>
                </div>

                {/* Create Button */}
                <div className="modal-action">
                    <button className="btn btn-ghost" onClick={onClose}>
                        Cancel
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={handleCreate}
                        disabled={!name.trim() || selectedMembers.length === 0 || isCreatingGroup}
                    >
                        {isCreatingGroup ? (
                            <Loader2 className="size-4 animate-spin" />
                        ) : (
                            "Create Group"
                        )}
                    </button>
                </div>
            </div>
            <div className="modal-backdrop" onClick={onClose}></div>
        </div>
    );
};

export default CreateGroupModal;
