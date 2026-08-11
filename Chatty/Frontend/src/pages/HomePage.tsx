import { useChatStore } from "../store/useChatStore";
import { useGroupStore } from "../store/useGroupStore";

import Sidebar from "../components/Sidebar";
import NoChatSelected from "../components/NoChatSelected";
import ChatContainer from "../components/ChatContainer";
import GroupChatContainer from "../components/GroupChatContainer";

const HomePage = () => {
  const { selectedUser } = useChatStore();
  const { selectedGroup } = useGroupStore();

  const renderMainContent = () => {
    if (selectedGroup) return <GroupChatContainer />;
    if (selectedUser) return <ChatContainer />;
    return <NoChatSelected />;
  };

  return (
    <div className="h-screen bg-base-200">
      <div className="flex items-center justify-center pt-20 px-4">
        <div className="bg-base-100 rounded-lg shadow-cl w-full max-w-6xl h-[calc(100vh-8rem)]">
          <div className="flex h-full rounded-lg overflow-hidden">
            <Sidebar />

            {renderMainContent()}
          </div>
        </div>
      </div>
    </div>
  );
};
export default HomePage;