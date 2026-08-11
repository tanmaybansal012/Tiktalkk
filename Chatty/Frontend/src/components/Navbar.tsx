import { Link } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { useFriendStore } from "../store/useFriendStore";
import { LogOut, MessageSquare, Settings, User, UserPlus } from "lucide-react";
import { useState } from "react";
import FriendRequestsDrawer from "./FriendRequestsDrawer";

const Navbar = () => {
  const { logout, authUser } = useAuthStore();
  const { friendRequests } = useFriendStore();
  const [isRequestsOpen, setIsRequestsOpen] = useState(false);

  return (
    <>
      <header
        className="border-b border-base-300 fixed w-full top-0 z-40 
      backdrop-blur-lg bg-base-100/80"
      >
        <div className="container mx-auto px-4 h-16">
          <div className="flex items-center justify-between h-full">
            <div className="flex items-center gap-8">
              <Link to="/" className="flex items-center gap-2.5 hover:opacity-80 transition-all">
                <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-primary" />
                </div>
                <h1 className="text-lg font-bold">Tiktalkk</h1>
              </Link>
            </div>

            <div className="flex items-center gap-2">
              <Link
                to={"/settings"}
                className={`
                btn btn-sm gap-2 transition-colors
                
                `}
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Settings</span>
              </Link>

              {authUser && (
                <>
                  {/* Friend Requests badge in navbar */}
                  <button
                    className="btn btn-sm gap-2 relative"
                    onClick={() => setIsRequestsOpen(true)}
                  >
                    <UserPlus className="w-4 h-4" />
                    <span className="hidden sm:inline">Requests</span>
                    {friendRequests.received.length > 0 && (
                      <span className="absolute -top-1 -right-1 size-5 bg-error text-error-content text-[10px] font-bold rounded-full flex items-center justify-center">
                        {friendRequests.received.length}
                      </span>
                    )}
                  </button>

                  <Link to={"/profile"} className={`btn btn-sm gap-2`}>
                    <User className="size-5" />
                    <span className="hidden sm:inline">Profile</span>
                  </Link>

                  <button className="flex gap-2 items-center" onClick={logout}>
                    <LogOut className="size-5" />
                    <span className="hidden sm:inline">Logout</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <FriendRequestsDrawer
        isOpen={isRequestsOpen}
        onClose={() => setIsRequestsOpen(false)}
      />
    </>
  );
};
export default Navbar;