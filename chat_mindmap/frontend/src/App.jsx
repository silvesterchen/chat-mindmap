import React from 'react';
import Sidebar from './components/Sidebar';
import MindMap from './components/MindMap';
import ChatPanel from './components/ChatPanel';
import { Menu } from 'lucide-react';
import useStore from './store/useStore';

function App() {
  const { isSidebarOpen, toggleSidebar } = useStore();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col h-full relative">
        {!isSidebarOpen && (
             <button 
                onClick={toggleSidebar}
                className="absolute top-4 left-4 z-20 p-2 bg-white shadow rounded border border-gray-200 hover:bg-gray-50"
            >
                <Menu size={20} />
            </button>
        )}
        
        <div className="flex-1 h-full">
            <MindMap />
        </div>

        <ChatPanel />
      </div>
    </div>
  );
}

export default App;
