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

  // Personas
  personas: [
    {
      id: 'default',
      name: '默认身份',
      prompt: '后续用户可能会提问的问题',
      count: 3
    }
  ],
  activePersonaId: 'default',
  setPersonas: (personas) => set({ personas }),
  setActivePersonaId: (id) => set({ activePersonaId: id }),
  addPersona: (persona) => set((state) => ({
    personas: [...state.personas, persona],
    activePersonaId: persona.id // Auto switch to new persona
  })),
  updatePersona: (id, updates) => set((state) => ({
    personas: state.personas.map(p => p.id === id ? { ...p, ...updates } : p)
  })),
  deletePersona: (id) => set((state) => {
      const newPersonas = state.personas.filter(p => p.id !== id);
      // If active persona is deleted, switch to default or first available
      let newActiveId = state.activePersonaId;
      if (state.activePersonaId === id) {
          newActiveId = newPersonas.length > 0 ? newPersonas[0].id : null;
      }
      return {
          personas: newPersonas,
          activePersonaId: newActiveId
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
  
  isChatOpen: true,
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
    pushHistory: (actionType = 'unknown') => set((state) => {
        const currentState = { 
            nodes: JSON.parse(JSON.stringify(state.nodes)), 
            edges: JSON.parse(JSON.stringify(state.edges)),
            actionType 
        };
        // Limit history size to 50
        const newPast = [...state.past, currentState].slice(-50);
        return { past: newPast, future: [] };
    }),
    undo: () => set((state) => {
        if (state.past.length === 0) return {};
        
        let previous = state.past[state.past.length - 1];
        let newPast = state.past.slice(0, -1);
        
        // If the previous state was a 'layout' action, skip it and go further back
        // But wait, undo means we revert TO the previous state.
        // If we revert to a state that was saved BEFORE a layout, that's fine.
        // The issue is if the user clicked "Layout", a state was saved.
        // Then the user clicks "Undo". We revert to the state BEFORE "Layout".
        // This is correct behavior for undoing layout.
        
        // Wait, the user request says: "If the step to undo is auto-layout, then automatically continue to undo one more step, until the content to undo is a non-auto-layout operation"
        
        // This implies that the 'layout' operation itself saved a state, which we are now restoring.
        // But usually, we save state BEFORE an operation.
        // So state.past contains snapshots of the world.
        // past[last] is the state before the MOST RECENT change.
        
        // Example:
        // 1. Initial State (A) -> past: []
        // 2. Add Node (B) -> pushHistory(A) -> past: [A], current: B
        // 3. Layout (C) -> pushHistory(B, 'layout') -> past: [A, B(type='layout')], current: C
        
        // Undo 1:
        // We take B from past. current becomes B. past becomes [A].
        // But B was saved with type 'layout'.
        // So if we restore B, we are restoring the state right before layout (which is the un-layouted state).
        // This effectively UNDOES the layout.
        
        // The user says: "if the step to undo IS auto-layout".
        // This might mean:
        // If I just did a layout, and I click undo, I want to go back to BEFORE the layout. (This is standard undo)
        // OR
        // If I did (Add Node -> Layout), and I click Undo.
        // Standard: Revert Layout -> Back to "Add Node" state (unorganized).
        // User Request: "Continue undoing until non-auto-layout".
        // This sounds like: "I don't want to just undo the layout, I want to undo the action BEFORE the layout too"?
        // Or maybe: "I want to skip intermediate layout states if multiple layouts happened?"
        
        // Let's re-read: "如果撤销的步骤是自动排版，则自动继续网上撤销一步，直到撤销的内容为非自动排版操作"
        // "If the step being undone IS auto-layout"
        
        // Scenario 1:
        // State 0 (Clean)
        // Action: Add Node -> State 1 (Node added)
        // Action: Layout -> State 2 (Layouted)
        
        // History Stack (past): [State 0, State 1]
        // Current: State 2
        
        // When we click Undo:
        // We pop State 1. We restore State 1.
        // State 1 is "Node Added" (but unlayouted).
        // This IS undoing the layout.
        
        // Maybe the user means:
        // Some operations trigger layout AUTOMATICALLY (like auto-layout on node add?).
        // In my code, adding a child triggers layout.
        
        // Code: handleAddChild -> pushHistory() -> add node -> setTimeout(layout)
        // Layout -> pushHistory() -> setNodes(layouted)
        
        // So:
        // 1. Initial
        // 2. Add Child:
        //    - pushHistory (State A)
        //    - update nodes (State B)
        //    - layout triggers
        //    - pushHistory (State B) [This is the layout push]
        //    - update nodes (State C)
        
        // So past is [State A, State B]. Current is C.
        // Undo 1: Restore State B (Unlayouted, with new node).
        // Undo 2: Restore State A (No new node).
        
        // User wants: Click Undo once -> Jump straight to State A.
        // Because State B is just an intermediate state of "Node added but not yet layouted".
        // And the user considers "Add Node + Layout" as ONE atomic action.
        
        // So we need to detect if the state we are about to restore was saved just before a layout.
        // If `previous.actionType === 'layout'`, it means this state was saved right before a layout happened.
        // So restoring it brings us to the un-layouted state.
        // We want to skip this and go deeper.
        
        const current = { 
            nodes: JSON.parse(JSON.stringify(state.nodes)), 
            edges: JSON.parse(JSON.stringify(state.edges)),
            actionType: 'current' // doesn't matter
        };
        
        // We need to accumulate future states
        let accumulatedFuture = [current, ...state.future];
        
        // Loop to skip 'layout' states
        while (previous && previous.actionType === 'layout') {
            // This state was saved before a layout.
            // We want to skip restoring this state, because restoring it just shows un-layouted mess.
            // So we move this 'previous' to future (effectively undoing it without showing it)
            // And look at the next one in past.
            
            // Wait, if we skip it, we need to add it to future so Redo works?
            // Yes, standard undo/redo stack.
            
            accumulatedFuture = [previous, ...accumulatedFuture]; // Add the skipped state to future
            
            if (newPast.length === 0) {
                // No more history, we have to stop here or return empty?
                // If we ran out of history while skipping layouts, we effectively revert to initial empty state or we just stop.
                // If newPast is empty, previous is undefined? No.
                previous = null;
                break;
            }
            
            previous = newPast[newPast.length - 1];
            newPast = newPast.slice(0, -1);
        }
        
        if (!previous) {
            // We skipped everything or history was empty?
            // If we skipped everything, we might be at the very beginning.
            // But we can't return empty object if we changed future.
            // If previous is null, it means we consumed all history.
            // We should probably just return the oldest state available if we can't skip anymore?
            // Or if history is exhausted, we just stay at current?
            
            // If we consumed all past, we can't undo further.
            // But we updated future.
            // So we should return the updated future and maybe empty past.
            // But what about nodes?
            // If we can't find a non-layout state, we should probably just return to the earliest state we found?
            
            // Actually, if we consumed all past, it means all history steps were layouts? Unlikely.
            // But if it happens, we probably just return the last found 'layout' state (which is the earliest).
            // But let's assume there's always a base state.
            
            return {
                past: [],
                future: accumulatedFuture
            };
        }

        return {
            nodes: previous.nodes,
            edges: previous.edges,
            past: newPast,
            future: accumulatedFuture
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
        activeLlmConfig: state.activeLlmConfig,
        personas: state.personas,
        activePersonaId: state.activePersonaId
    }),
    migrate: (persistedState, version) => {
        if (version === 1) {
            // Migration: Rename '默认助手' or '添加身份' to '默认身份'
            if (persistedState.personas) {
                persistedState.personas = persistedState.personas.map(p => {
                    if (p.id === 'default' && (p.name === '默认助手' || p.name === '添加身份')) {
                        return { ...p, name: '默认身份' };
                    }
                    return p;
                });
            }
        }
        return persistedState;
    }
}))

export default useStore
