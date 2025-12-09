import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import {
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
} from '@xyflow/react';

const useStore = create(persist((set, get) => ({
  // File System
  files: [],
  currentPath: '', // Current folder path in sidebar
  setFiles: (files) => set({ files }),
  setCurrentPath: (path) => set({ currentPath: path }),

  // Mind Map
  currentMapPath: null, // Path of the currently open map
  nodes: [],
  edges: [],
  viewport: { x: 0, y: 0, zoom: 1 },
  
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  onNodesChange: (changes) => set({
    nodes: applyNodeChanges(changes, get().nodes),
  }),
  onEdgesChange: (changes) => set({
    edges: applyEdgeChanges(changes, get().edges),
  }),
  onConnect: (connection) => {
    const state = get();
    // Push history before connecting
    state.pushHistory();
    set({
      edges: addEdge(connection, state.edges),
    });
  },
  loadMap: (path, data) => set((state) => {
      // Load chat history from file data if available
      const fileHistory = data.chatHistory;
      
      let newHistories = { ...state.chatHistories };
      if (fileHistory) {
          newHistories[path] = fileHistory;
      } else {
          // Try to use existing history if not in file (backward compatibility or already loaded)
          // But if we just opened the file, we should trust the file or start fresh if not present?
          // If the file doesn't have history, but we have it in memory?
          // If we just reloaded the page, memory is empty.
          // So we rely on fileHistory.
      }
      
      // If no file history and no memory history, initialize empty
      if (!newHistories[path]) {
         // Don't initialize here, getChatContext handles empty.
         // But we need it for chatMessages
      }

      return {
          currentMapPath: path,
          nodes: data.nodes || [],
          edges: data.edges || [],
          viewport: data.viewport || { x: 0, y: 0, zoom: 1 },
          chatMessages: (fileHistory && fileHistory.messages) ? fileHistory.messages : (state.chatHistories[path]?.messages || []),
          chatHistories: newHistories
      };
  }),
  updateNodeData: (id, data) => {
      const state = get();
      state.pushHistory();
      set({
          nodes: state.nodes.map(node => 
              node.id === id ? { ...node, data: { ...node.data, ...data } } : node
          )
      });
  },

  updateNode: (id, patch) => set({
      nodes: get().nodes.map(node => 
          node.id === id ? { ...node, ...patch } : node
      )
  }),

  // LLM
  llmConfigs: [
    {
      id: 'default',
      name: 'Default',
      model_name: 'gpt-3.5-turbo',
      base_url: 'https://api.openai.com/v1',
      api_key: '',
      temperature: 0.7,
      max_tokens: 1000
    }
  ],
  currentLlmConfigId: 'default',
  activeLlmConfig: {
    id: 'default',
    name: 'Default',
    model_name: 'gpt-3.5-turbo',
    base_url: 'https://api.openai.com/v1',
    api_key: '',
    temperature: 0.7,
    max_tokens: 1000
  },
  setLlmConfigs: (configs) => set({ llmConfigs: configs }),
  addLlmConfig: (config) => set((state) => ({ 
    llmConfigs: [...state.llmConfigs, config],
    activeLlmConfig: config.id === state.currentLlmConfigId ? config : state.activeLlmConfig
  })),
  updateLlmConfig: (id, config) => set((state) => ({
    llmConfigs: state.llmConfigs.map(c => c.id === id ? { ...c, ...config } : c),
    activeLlmConfig: state.currentLlmConfigId === id ? { ...state.activeLlmConfig, ...config } : state.activeLlmConfig
  })),
  deleteLlmConfig: (id) => set((state) => {
    const newConfigs = state.llmConfigs.filter(c => c.id !== id);
    const newCurrentId = state.currentLlmConfigId === id ? 
      (newConfigs.length > 0 ? newConfigs[0].id : 'default') : 
      state.currentLlmConfigId;
    const newActiveConfig = newConfigs.find(c => c.id === newCurrentId) || state.activeLlmConfig;
    return {
      llmConfigs: newConfigs,
      currentLlmConfigId: newCurrentId,
      activeLlmConfig: newActiveConfig
    };
  }),
  switchLlmConfig: (id) => set((state) => {
    const config = state.llmConfigs.find(c => c.id === id);
    return {
      currentLlmConfigId: id,
      activeLlmConfig: config || state.activeLlmConfig
    };
  }),
  
  // UI
  isSidebarOpen: true,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  
  // Chat
  chatHistories: {}, // { [mapPath]: { messages: [], lastUpdated: timestamp } }
  chatMessages: [], // Current active chat messages
  
  addChatMessage: (msg) => set((state) => {
      const newMessages = [...state.chatMessages, msg];
      // Save to current map's history
      if (state.currentMapPath) {
          const newHistories = { ...state.chatHistories };
          if (!newHistories[state.currentMapPath]) {
              newHistories[state.currentMapPath] = { messages: [], lastUpdated: Date.now() };
          }
          newHistories[state.currentMapPath].messages = newMessages;
          newHistories[state.currentMapPath].lastUpdated = Date.now();
          return { chatMessages: newMessages, chatHistories: newHistories };
      }
      return { chatMessages: newMessages };
  }),
  
  updateLastMessage: (content) => set((state) => {
      const msgs = [...state.chatMessages];
      if (msgs.length > 0) {
          msgs[msgs.length - 1].content = content;
      }
      // Save to current map's history
      if (state.currentMapPath) {
          const newHistories = { ...state.chatHistories };
          if (!newHistories[state.currentMapPath]) {
              newHistories[state.currentMapPath] = { messages: [], lastUpdated: Date.now() };
          }
          newHistories[state.currentMapPath].messages = msgs;
          newHistories[state.currentMapPath].lastUpdated = Date.now();
          return { chatMessages: msgs, chatHistories: newHistories };
      }
      return { chatMessages: msgs };
  }),
  
  clearChat: () => set((state) => {
      // Clear current chat and remove from history
      if (state.currentMapPath) {
          const newHistories = { ...state.chatHistories };
          if (newHistories[state.currentMapPath]) {
              newHistories[state.currentMapPath].messages = [];
              newHistories[state.currentMapPath].lastUpdated = Date.now();
          }
          return { chatMessages: [], chatHistories: newHistories };
      }
      return { chatMessages: [] };
  }),
  
  loadChatHistory: (mapPath) => set((state) => {
      const history = state.chatHistories[mapPath];
      return { 
          chatMessages: history ? history.messages : [],
          currentMapPath: mapPath
      };
  }),
  
  getChatContext: (mapPath, currentMessages) => {
      const state = get();
      const history = state.chatHistories[mapPath];
      if (!history || history.messages.length === 0) {
          return currentMessages;
      }
      
      // Get last 5 rounds (10 messages: 5 user + 5 assistant)
      const recentHistory = history.messages.slice(-10);
      
      // Combine with current messages, avoiding duplicates
      const combined = [...recentHistory, ...currentMessages];
      
      // Remove duplicates while preserving order
      const unique = combined.filter((msg, index, self) => 
          index === self.findIndex(m => m.content === msg.content && m.role === msg.role)
      );
      
      return unique;
  },
  
  isChatOpen: false,
  setChatOpen: (isOpen) => set({ isChatOpen: isOpen }),
  activeNodeId: null, // Node triggering the chat
  setActiveNodeId: (id) => set({ activeNodeId: id }),
  
  // Chat interruption
  isChatInterrupted: false,
    interruptChat: () => set({ isChatInterrupted: true }),
    resetChatInterrupt: () => set({ isChatInterrupted: false }),
    
    // Layout trigger
    layoutTrigger: 0,
    triggerLayout: () => set((state) => ({ layoutTrigger: state.layoutTrigger + 1 })),

    // Suggestions
    suggestions: [],
    isSuggestionsLoading: false,
    setSuggestions: (suggestions) => set({ suggestions }),
    setSuggestionsLoading: (isLoading) => set({ isSuggestionsLoading: isLoading }),

    // History
    past: [],
    future: [],
    pushHistory: () => set((state) => {
        const currentState = { nodes: JSON.parse(JSON.stringify(state.nodes)), edges: JSON.parse(JSON.stringify(state.edges)) };
        // Limit history size to 50
        const newPast = [...state.past, currentState].slice(-50);
        return { past: newPast, future: [] };
    }),
    undo: () => set((state) => {
        if (state.past.length === 0) return {};
        const previous = state.past[state.past.length - 1];
        const newPast = state.past.slice(0, -1);
        const current = { nodes: JSON.parse(JSON.stringify(state.nodes)), edges: JSON.parse(JSON.stringify(state.edges)) };
        return {
            nodes: previous.nodes,
            edges: previous.edges,
            past: newPast,
            future: [current, ...state.future]
        };
    }),
    redo: () => set((state) => {
        if (state.future.length === 0) return {};
        const next = state.future[0];
        const newFuture = state.future.slice(1);
        const current = { nodes: JSON.parse(JSON.stringify(state.nodes)), edges: JSON.parse(JSON.stringify(state.edges)) };
        return {
            nodes: next.nodes,
            edges: next.edges,
            past: [...state.past, current],
            future: newFuture
        };
    }),
}), {
    name: 'mindmap-storage',
    storage: createJSONStorage(() => localStorage),
    version: 1,
    partialize: (state) => ({
        llmConfigs: state.llmConfigs,
        currentLlmConfigId: state.currentLlmConfigId,
        activeLlmConfig: state.activeLlmConfig
    })
}))

export default useStore
