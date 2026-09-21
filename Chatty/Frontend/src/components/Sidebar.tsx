import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { useFriendStore } from "../store/useFriendStore";
import { useGroupStore } from "../store/useGroupStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import FindPeopleModal from "./FindPeopleModal";
import FriendRequestsDrawer from "./FriendRequestsDrawer";
import CreateGroupModal from "./CreateGroupModal";
import { Users, Search, UserPlus, Plus, MessagesSquare } from "lucide-react";
import { formatLastSeen } from "../lib/utils";

const Sidebar = () => {
  const { getUsers, users, selectedUser, setSelectedUser, isUsersLoading } = useChatStore();
  const { onlineUsers } = useAuthStore();
  const { friendRequests, getFriendRequests } = useFriendStore();
  const { groups, selectedGroup, setSelectedGroup, getGroups, isLoadingGroups } = useGroupStore();

  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [isFindPeopleOpen, setIsFindPeopleOpen] = useState(false);
  const [isRequestsOpen, setIsRequestsOpen] = useState(false);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"friends" | "groups">("friends");

  useEffect(() => {
    getUsers();
    getFriendRequests();
    getGroups();
  }, [getUsers, getFriendRequests, getGroups]);

  const safeUsers = Array.isArray(users) ? users : [];

  const filteredUsers = safeUsers.filter((u) =>
    showOnlineOnly ? onlineUsers.includes(u._id) : true
  );

  const handleSelectUser = (user: typeof safeUsers[0]) => {
    setSelectedUser(user);
    // Clear group selection when selecting a user
    setSelectedGroup(null);
  };

  const handleSelectGroup = (group: typeof groups[0]) => {
    setSelectedGroup(group);
    // Clear user selection when selecting a group
    setSelectedUser(null);
  };

  if (isUsersLoading && activeTab === "friends") return <SidebarSkeleton />;

  return (
    <>
      <aside className="h-full w-20 lg:w-72 border-r border-base-300 flex flex-col transition-all duration-200">
        {/* Header */}
        <div className="border-b border-base-300 w-full p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {activeTab === "friends" ? (
                <Users className="size-6" />
              ) : (
                <MessagesSquare className="size-6" />
              )}
              <span className="font-medium hidden lg:block">
                {activeTab === "friends" ? "Friends" : "Groups"}
              </span>
            </div>

            <div className="flex items-center gap-1">
              {activeTab === "friends" ? (
                <>
                  <button
                    className="btn btn-sm btn-ghost btn-circle"
                    onClick={() => setIsFindPeopleOpen(true)}
                    title="Find People"
                  >
                    <Search className="size-4" />
                  </button>
                  <div className="relative">
                    <button
                      className="btn btn-sm btn-ghost btn-circle"
                      onClick={() => setIsRequestsOpen(true)}
                      title="Friend Requests"
                    >
                      <UserPlus className="size-4" />
                    </button>
                    {friendRequests.received.length > 0 && (
                      <span className="absolute -top-1 -right-1 size-4 bg-primary text-primary-content text-[10px] font-bold rounded-full flex items-center justify-center">
                        {friendRequests.received.length}
                      </span>
                    )}
                  </div>
                </>
              ) : (
                <button
                  className="btn btn-sm btn-ghost btn-circle"
                  onClick={() => setIsCreateGroupOpen(true)}
                  title="New Group"
                >
                  <Plus className="size-4" />
                </button>
              )}
            </div>
          </div>

          {/* Tab Toggle */}
          <div className="mt-3 flex gap-1">
            <button
              className={`flex-1 btn btn-xs ${activeTab === "friends" ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setActiveTab("friends")}
            >
              <Users className="size-3 hidden lg:block" />
              <span className="hidden lg:inline">Friends</span>
              <span className="lg:hidden"><Users className="size-3" /></span>
            </button>
            <button
              className={`flex-1 btn btn-xs ${activeTab === "groups" ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setActiveTab("groups")}
            >
              <MessagesSquare className="size-3 hidden lg:block" />
              <span className="hidden lg:inline">Groups</span>
              <span className="lg:hidden"><MessagesSquare className="size-3" /></span>
            </button>
          </div>

          {/* Online only filter - only for friends tab */}
          {activeTab === "friends" && (
            <div className="mt-3 hidden lg:flex items-center gap-2">
              <label className="cursor-pointer flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={showOnlineOnly}
                  onChange={(e) => setShowOnlineOnly(e.target.checked)}
                  className="checkbox checkbox-sm"
                />
                <span className="text-sm">Show online only</span>
              </label>
              <span className="text-xs text-zinc-500">
                ({onlineUsers.length} online)
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="overflow-y-auto w-full py-3">
          {/* Friends Tab */}
          {activeTab === "friends" && (
            <>
              {filteredUsers.map((user) => (
                <button
                  key={user._id}
                  onClick={() => handleSelectUser(user)}
                  className={`
                    w-full p-3 flex items-center gap-3
                    hover:bg-base-300 transition-colors
                    ${selectedUser?._id === user._id && !selectedGroup ? "bg-base-300 ring-1 ring-base-300" : ""}
                  `}
                >
                  <div className="relative mx-auto lg:mx-0">
                    <img
                      src={user.profilePic || "/avatar.png"}
                      alt={user.fullName}
                      className="size-12 object-cover rounded-full"
                    />
                    {onlineUsers.includes(user._id) && (
                      <span
                        className="absolute bottom-0 right-0 size-3 bg-green-500 
                        rounded-full ring-2 ring-zinc-900"
                      />
                    )}
                  </div>

                  <div className="hidden lg:block text-left min-w-0">
                    <div className="font-medium truncate">{user.fullName}</div>
                    <div className="text-sm text-zinc-400">
                      {onlineUsers.includes(user._id)
                        ? "Online"
                        : user.lastSeen
                          ? formatLastSeen(user.lastSeen)
                          : "Offline"}
                    </div>
                  </div>
                </button>
              ))}

              {filteredUsers.length === 0 && (
                <div className="text-center text-zinc-500 py-4">
                  {showOnlineOnly
                    ? "No online friends"
                    : "No friends yet — find people to add!"}
                </div>
              )}
            </>
          )}

          {/* Groups Tab */}
          {activeTab === "groups" && (
            <>
              {isLoadingGroups ? (
                <div className="text-center text-zinc-500 py-4">Loading...</div>
              ) : (
                <>
                  {groups.map((group) => (
                    <button
                      key={group._id}
                      onClick={() => handleSelectGroup(group)}
                      className={`
                        w-full p-3 flex items-center gap-3
                        hover:bg-base-300 transition-colors
                        ${selectedGroup?._id === group._id ? "bg-base-300 ring-1 ring-base-300" : ""}
                      `}
                    >
                      <div className="avatar placeholder mx-auto lg:mx-0">
                        <div className="size-12 rounded-full bg-primary text-primary-content">
                          {group.groupIcon ? (
                            <img
                              src={group.groupIcon}
                              alt={group.name}
                              className="rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-lg font-bold">
                              {group.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="hidden lg:block text-left min-w-0">
                        <div className="font-medium truncate">{group.name}</div>
                        <div className="text-sm text-zinc-400">
                          {group.members.length} members
                        </div>
                      </div>
                    </button>
                  ))}

                  {groups.length === 0 && (
                    <div className="text-center text-zinc-500 py-4">
                      No groups yet — create one!
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </aside>

      <FindPeopleModal
        isOpen={isFindPeopleOpen}
        onClose={() => setIsFindPeopleOpen(false)}
      />
      <FriendRequestsDrawer
        isOpen={isRequestsOpen}
        onClose={() => setIsRequestsOpen(false)}
      />
      <CreateGroupModal
        isOpen={isCreateGroupOpen}
        onClose={() => setIsCreateGroupOpen(false)}
      />
    </>
  );
};
export default Sidebar;