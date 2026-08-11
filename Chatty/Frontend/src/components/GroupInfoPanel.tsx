import { useState } from "react";
import { useGroupStore } from "../store/useGroupStore";
import { useFriendStore } from "../store/useFriendStore";
import { useAuthStore } from "../store/useAuthStore";
import {
    X,
    Crown,
    UserPlus,
    UserMinus,
    Shield,
    Pencil,
    Trash2,
    Loader2,
    Check,
    Camera
} from "lucide-react";
import toast from "react-hot-toast";

interface GroupInfoPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

const GroupInfoPanel = ({ isOpen, onClose }: GroupInfoPanelProps) => {
    const { selectedGroup, addMember, removeMember, promoteToAdmin, updateGroup, updateGroupPhoto, deleteGroup, isUpdatingGroupPhoto } =
        useGroupStore();
    const { friends } = useFriendStore();
    const { authUser } = useAuthStore();

    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState("");
    const [showAddMember, setShowAddMember] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    if (!isOpen || !selectedGroup) return null;

    const isAdmin = selectedGroup.admins.some((a) => a._id === authUser?._id);
    const isCreator =
        typeof selectedGroup.createdBy === "object"
            ? selectedGroup.createdBy._id === authUser?._id
            : selectedGroup.createdBy === authUser?._id;

    const memberIds = selectedGroup.members.map((m) => m._id);
    const nonMemberFriends = friends.filter((f) => !memberIds.includes(f._id));

    const handleRename = async () => {
        if (!editName.trim() || !selectedGroup) return;
        await updateGroup(selectedGroup._id, { name: editName.trim() });
        setIsEditing(false);
    };

    const handleDelete = async () => {
        if (!selectedGroup) return;
        setIsDeleting(true);
        await deleteGroup(selectedGroup._id);
        setIsDeleting(false);
        onClose();
    };

    const handleAddMember = async (userId: string) => {
        if (!selectedGroup) return;
        await addMember(selectedGroup._id, userId);
    };

    const handleRemoveMember = async (userId: string) => {
        if (!selectedGroup) return;
        await removeMember(selectedGroup._id, userId);
    };

    const handlePromote = async (userId: string) => {
        if (!selectedGroup) return;
        await promoteToAdmin(selectedGroup._id, userId);
    };

    const isUserAdmin = (userId: string) =>
        selectedGroup.admins.some((a) => a._id === userId);

    const isUserCreator = (userId: string) => {
        if (typeof selectedGroup.createdBy === "object") {
            return selectedGroup.createdBy._id === userId;
        }
        return selectedGroup.createdBy === userId;
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedGroup) return;

        if (!file.type.startsWith("image/")) {
            toast.error("Please select an image file");
            return;
        }

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
            const base64Image = reader.result as string;
            await updateGroupPhoto(selectedGroup._id, base64Image);
        };
    };

    return (
        <div className="modal modal-open" id="group-info-modal">
            <div className="modal-box max-w-md max-h-[80vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-lg">Group Info</h3>
                    <button
                        className="btn btn-sm btn-circle btn-ghost"
                        onClick={onClose}
                    >
                        <X className="size-4" />
                    </button>
                </div>

                {/* Group Icon & Name */}
                <div className="flex flex-col items-center mb-6">
                    <div className="relative mb-3 group">
                        <div className="avatar placeholder">
                            <div className={`size-20 rounded-full bg-primary text-primary-content ${isUpdatingGroupPhoto ? 'opacity-50' : ''}`}>
                                {selectedGroup.groupIcon ? (
                                    <img
                                        src={selectedGroup.groupIcon}
                                        alt={selectedGroup.name}
                                        className="rounded-full object-cover"
                                    />
                                ) : (
                                    <span className="text-3xl font-bold">
                                        {selectedGroup.name.charAt(0).toUpperCase()}
                                    </span>
                                )}
                            </div>
                        </div>
                        {isAdmin && (
                            <label className={`absolute bottom-0 right-0 bg-base-content hover:scale-105 p-1.5 rounded-full cursor-pointer transition-all ${isUpdatingGroupPhoto ? 'pointer-events-none' : ''}`}>
                                <Camera className="size-4 text-base-200" />
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleImageUpload}
                                    disabled={isUpdatingGroupPhoto}
                                />
                            </label>
                        )}
                    </div>

                    {isEditing ? (
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                className="input input-bordered input-sm"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                autoFocus
                                maxLength={50}
                            />
                            <button
                                className="btn btn-sm btn-primary btn-circle"
                                onClick={handleRename}
                            >
                                <Check className="size-3" />
                            </button>
                            <button
                                className="btn btn-sm btn-ghost btn-circle"
                                onClick={() => setIsEditing(false)}
                            >
                                <X className="size-3" />
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <h2 className="text-xl font-bold">{selectedGroup.name}</h2>
                            {isAdmin && (
                                <button
                                    className="btn btn-xs btn-ghost btn-circle"
                                    onClick={() => {
                                        setEditName(selectedGroup.name);
                                        setIsEditing(true);
                                    }}
                                    title="Rename Group"
                                >
                                    <Pencil className="size-3" />
                                </button>
                            )}
                        </div>
                    )}
                    <p className="text-sm text-base-content/60 mt-1">
                        {selectedGroup.members.length} members
                    </p>
                </div>

                {/* Members List */}
                <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-base-content/70 uppercase tracking-wide">
                            Members
                        </h4>
                        {isAdmin && (
                            <button
                                className="btn btn-xs btn-primary gap-1"
                                onClick={() => setShowAddMember(!showAddMember)}
                            >
                                <UserPlus className="size-3" />
                                Add
                            </button>
                        )}
                    </div>

                    {/* Add Member Section */}
                    {showAddMember && isAdmin && (
                        <div className="mb-3 border border-base-300 rounded-lg p-2 space-y-1">
                            <p className="text-xs text-base-content/50 mb-1">
                                Select a friend to add:
                            </p>
                            {nonMemberFriends.length === 0 ? (
                                <p className="text-xs text-base-content/50 text-center py-2">
                                    All friends are already in this group
                                </p>
                            ) : (
                                nonMemberFriends.map((friend) => (
                                    <button
                                        key={friend._id}
                                        className="flex items-center gap-2 p-2 w-full rounded hover:bg-base-200 transition-colors"
                                        onClick={() => handleAddMember(friend._id)}
                                    >
                                        <img
                                            src={friend.profilePic || "/avatar.png"}
                                            alt={friend.fullName}
                                            className="size-7 rounded-full object-cover"
                                        />
                                        <span className="text-sm truncate flex-1 text-left">
                                            {friend.fullName}
                                        </span>
                                        <UserPlus className="size-3 text-primary" />
                                    </button>
                                ))
                            )}
                        </div>
                    )}

                    {/* Member List */}
                    <div className="space-y-1">
                        {selectedGroup.members.map((member) => (
                            <div
                                key={member._id}
                                className="flex items-center gap-3 p-2 rounded-lg hover:bg-base-200 transition-colors"
                            >
                                <img
                                    src={member.profilePic || "/avatar.png"}
                                    alt={member.fullName}
                                    className="size-9 rounded-full object-cover"
                                />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-sm font-medium truncate">
                                            {member.fullName}
                                        </span>
                                        {member._id === authUser?._id && (
                                            <span className="text-xs text-base-content/50">(You)</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {isUserCreator(member._id) && (
                                            <span className="badge badge-xs badge-warning gap-0.5">
                                                <Crown className="size-2" />
                                                Creator
                                            </span>
                                        )}
                                        {isUserAdmin(member._id) && !isUserCreator(member._id) && (
                                            <span className="badge badge-xs badge-info gap-0.5">
                                                <Shield className="size-2" />
                                                Admin
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Admin controls (only for non-self, non-creator members) */}
                                {isAdmin &&
                                    member._id !== authUser?._id &&
                                    !isUserCreator(member._id) && (
                                        <div className="flex gap-1">
                                            {!isUserAdmin(member._id) && (
                                                <button
                                                    className="btn btn-xs btn-ghost btn-circle"
                                                    onClick={() => handlePromote(member._id)}
                                                    title="Promote to Admin"
                                                >
                                                    <Shield className="size-3" />
                                                </button>
                                            )}
                                            <button
                                                className="btn btn-xs btn-ghost btn-circle text-error"
                                                onClick={() => handleRemoveMember(member._id)}
                                                title="Remove Member"
                                            >
                                                <UserMinus className="size-3" />
                                            </button>
                                        </div>
                                    )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Danger Zone: Delete Group */}
                {isCreator && (
                    <div className="border-t border-base-300 pt-4 mt-4">
                        <button
                            className="btn btn-error btn-sm w-full gap-2"
                            onClick={handleDelete}
                            disabled={isDeleting}
                        >
                            {isDeleting ? (
                                <Loader2 className="size-4 animate-spin" />
                            ) : (
                                <Trash2 className="size-4" />
                            )}
                            Delete Group
                        </button>
                        <p className="text-xs text-base-content/50 text-center mt-1">
                            Only the group creator can delete this group
                        </p>
                    </div>
                )}
            </div>
            <div className="modal-backdrop" onClick={onClose}></div>
        </div>
    );
};

export default GroupInfoPanel;
