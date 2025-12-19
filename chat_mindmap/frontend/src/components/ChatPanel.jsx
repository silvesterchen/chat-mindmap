import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Settings, PlusCircle, Loader2, RefreshCw, PanelRightOpen, PanelRightClose, User, Edit2, Trash2 } from 'lucide-react';
import useStore from '../store/useStore';
import { chatStream, saveMap } from '../api';
import ReactMarkdown from 'react-markdown';

const ChatPanel = () => {
    const { 
        isChatOpen, setChatOpen, 
        activeNodeId, nodes, setNodes, edges, setEdges,
        chatMessages, addChatMessage, updateLastMessage, clearChat,
        llmConfigs, activeLlmConfig, switchLlmConfig, addLlmConfig, updateLlmConfig, deleteLlmConfig,
        currentMapPath, getChatContext, isChatInterrupted, interruptChat, resetChatInterrupt,
        triggerLayout,
        suggestions, setSuggestions, isSuggestionsLoading, setSuggestionsLoading,
        pushHistory,
        personas, activePersonaId, setActivePersonaId, addPersona, updatePersona, deletePersona
    } = useStore();

    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showConfig, setShowConfig] = useState(false);
    const [editingConfig, setEditingConfig] = useState(null);
    const [configForm, setConfigForm] = useState({
        name: '',
        model_name: '',
        base_url: '',
        api_key: '',
        temperature: 0.7,
        max_tokens: 1000
    });
    
    // Persona state
    const [showPersonaModal, setShowPersonaModal] = useState(false);
    const [editingPersona, setEditingPersona] = useState(null); // 'new' or persona object
    const [personaForm, setPersonaForm] = useState({
        name: '',
        prompt: '',
        count: 3
    });

    const activePersona = personas.find(p => p.id === activePersonaId) || personas[0];

    const messagesEndRef = useRef(null);

    const activeNode = nodes.find(n => n.id === activeNodeId);

    // Generate suggestions logic
    const generateSuggestions = async () => {
        if (!isChatOpen || !activeNode || !activeLlmConfig) return;

        setSuggestionsLoading(true);
        setSuggestions([]);

        const prompt = activePersona?.prompt || "后续用户可能会提问的问题";
        const count = activePersona?.count || 3;

        const systemMsg = {
            role: 'system',
            content: `You are a helpful assistant. Based on the provided content, suggest exactly ${count} follow-up questions or actions the user might want to take. 
The user's custom prompt for this task is: "${prompt}".
Output strictly a JSON array of strings, e.g. ["question 1", "question 2"]. Do not output markdown code blocks, just the raw JSON.`
        };

        const userMsg = {
            role: 'user',
            content: `Content: ${activeNode.data.label}`
        };

        let fullText = "";
        try {
            await chatStream([systemMsg, userMsg], activeLlmConfig, null, (chunk) => {
                fullText += chunk;
            }, (err) => {
                console.error("Suggestion stream error", err);
            });

            try {
                const cleanText = fullText.replace(/```json/g, '').replace(/```/g, '').trim();
                const parsed = JSON.parse(cleanText);
                if (Array.isArray(parsed)) {
                    setSuggestions(parsed.slice(0, count));
                } else {
                    throw new Error("Not an array");
                }
            } catch (e) {
                console.warn("Failed to parse suggestions as JSON, falling back to line split", e);
                const lines = fullText.split('\n')
                    .map(l => l.trim().replace(/^\d+\.\s*/, '').replace(/^- \s*/, ''))
                    .filter(l => l.length > 0)
                    .slice(0, count);
                setSuggestions(lines);
            }
        } catch (err) {
            console.error("Suggestion error", err);
        } finally {
            setSuggestionsLoading(false);
        }
    };

    useEffect(() => {
        generateSuggestions();
    }, [activeNodeId, isChatOpen]);

    const [selectionMenu, setSelectionMenu] = useState(null);

    useEffect(() => {
        const handleSelection = () => {
            const selection = window.getSelection();
            if (selection && selection.toString().trim()) {
                const range = selection.getRangeAt(0);
                const rect = range.getBoundingClientRect();
                
                // Only show if selection is within chat container
                const chatContainer = document.getElementById('chat-messages-container');
                if (chatContainer && chatContainer.contains(selection.anchorNode)) {
                    setSelectionMenu({
                        text: selection.toString(),
                        top: rect.bottom + window.scrollY + 5,
                        left: rect.left + window.scrollX
                    });
                }
            } else {
                setSelectionMenu(null);
            }
        };

        document.addEventListener('mouseup', handleSelection);
        return () => document.removeEventListener('mouseup', handleSelection);
    }, []);

    const handleCopyText = () => {
        if (selectionMenu) {
            navigator.clipboard.writeText(selectionMenu.text);
            setSelectionMenu(null);
            window.getSelection().removeAllRanges();
        }
    };

    const handleInsertSelectionAsChild = () => {
        if (selectionMenu) {
            handleInsertAsChild(selectionMenu.text);
            setSelectionMenu(null);
            window.getSelection().removeAllRanges();
        }
    };

    const scrollToBottom = (force = false) => {
        const container = document.getElementById('chat-messages-container');
        if (container) {
            const threshold = 100;
            const distanceToBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
            const isNearBottom = distanceToBottom < threshold;
            
            if (force || isNearBottom) {
                messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
            }
        } else {
            if (force) {
                messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
            }
        }
    };

    const prevMessagesLengthRef = useRef(0);

    useEffect(() => {
        // Only force scroll if new message added (length changed)
        // For streaming updates (length same), use smart scroll (only if near bottom)
        const isNewMessage = chatMessages.length > prevMessagesLengthRef.current;
        scrollToBottom(isNewMessage);
        prevMessagesLengthRef.current = chatMessages.length;
    }, [chatMessages]);

    useEffect(() => {
        if (isChatOpen) {
            setTimeout(() => scrollToBottom(true), 100);
        }
    }, [isChatOpen]);

    // Auto-save chat history when messages change
    useEffect(() => {
        if (chatMessages.length > 0 && currentMapPath) {
            const timer = setTimeout(async () => {
                const history = { messages: chatMessages, lastUpdated: Date.now() };
                try {
                    await saveMap(currentMapPath, {
                        nodes,
                        edges,
                        viewport: { x: 0, y: 0, zoom: 1 }, // Using default viewport as sync is complex
                        chatHistory: history
                    });
                    console.log('Chat history auto-saved');
                } catch (e) {
                    console.error("Auto-save chat failed", e);
                }
            }, 1000); // Debounce 1s
            return () => clearTimeout(timer);
        }
    }, [chatMessages, currentMapPath, nodes, edges]);

    const abortControllerRef = useRef(null);

    const handleStop = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        setIsLoading(false);
    };

    const handleSend = async (messageContent = null) => {
        const contentToSend = messageContent || input;
        if (!contentToSend.trim()) return;
        
        const abortController = new AbortController();
        abortControllerRef.current = abortController;
        
        const userMsg = { role: 'user', content: contentToSend };
        addChatMessage(userMsg);
        setInput('');
        setIsLoading(true);

        // Add placeholder for assistant
        addChatMessage({ role: 'assistant', content: '' });

        let fullResponse = "";
        
        // Get context from previous conversations (last 5 rounds)
        // Ensure the current userMsg is definitely included at the end
        const currentContext = currentMapPath ? getChatContext(currentMapPath, [...chatMessages]) : [...chatMessages];
        const contextMessages = [...currentContext, userMsg];
        
        await chatStream(
            contextMessages, 
            activeLlmConfig, 
            activeNode ? activeNode.data.label : null,
            (chunk) => {
                fullResponse += chunk;
                updateLastMessage(fullResponse);
            },
            (err) => {
                console.error(err);
                updateLastMessage("Error: " + err.message);
                setIsLoading(false);
            },
            abortController.signal
        );
        
        setIsLoading(false);
        abortControllerRef.current = null;
    };

    const handleInsertAsChild = (content) => {
        if (!activeNode) return;
        
        pushHistory();

        // Calculate dynamic width based on content
        // 1. Find max line length
        // 2. Estimate total length
        // 3. Set min width 150, max width 400
        
        const strippedContent = content.replace(/<[^>]*>/g, '');
        const lines = strippedContent.split('\n');
        const maxLineLength = Math.max(...lines.map(l => l.length));
        const totalLength = strippedContent.length;
        
        // Approx 14px per char (simplified)
        // If single line is long, width should be wider
        // If multiple lines, but short, width can be smaller
        
        let calculatedWidth = 150;
        
        if (maxLineLength > 50) {
            calculatedWidth = 400;
        } else if (maxLineLength > 30) {
            calculatedWidth = 300;
        } else if (maxLineLength > 15) {
            calculatedWidth = 200;
        }
        
        // If total text is very long but no single line is long (e.g. word wrap needed),
        // we still might want wider to reduce height
        if (totalLength > 200) {
            calculatedWidth = Math.max(calculatedWidth, 350);
        } else if (totalLength > 100) {
            calculatedWidth = Math.max(calculatedWidth, 250);
        }

        const newNode = {
            id: `${Date.now()}`,
            type: 'default',
            position: { x: activeNode.position.x + 200, y: activeNode.position.y },
            data: { label: content, notes: content },
            style: { width: calculatedWidth }, // Set initial width
            width: calculatedWidth, // For layout engine
        };
        
        const newEdge = {
            id: `e${activeNode.id}-${newNode.id}`,
            source: activeNode.id,
            target: newNode.id,
        };

        setNodes([...nodes, newNode]);
        setEdges([...edges, newEdge]);
        
        // Trigger auto-layout
        setTimeout(() => triggerLayout(), 50);
    };

    const handleAddConfig = () => {
        const newConfig = {
            id: `config_${Date.now()}`,
            ...configForm
        };
        addLlmConfig(newConfig);
        setConfigForm({
            name: '',
            model_name: '',
            base_url: '',
            api_key: '',
            temperature: 0.7,
            max_tokens: 1000,
            suggestion_prompt: '后续用户可能会提问的问题',
            suggestion_count: 3
        });
        setEditingConfig(null);
    };

    const handleEditConfig = (config) => {
        setEditingConfig(config.id);
        setConfigForm({
            name: config.name,
            model_name: config.model_name,
            base_url: config.base_url,
            api_key: config.api_key,
            temperature: config.temperature,
            max_tokens: config.max_tokens
        });
    };

    const handleUpdateConfig = () => {
        if (editingConfig) {
            updateLlmConfig(editingConfig, configForm);
            setEditingConfig(null);
            setConfigForm({
                name: '',
                model_name: '',
                base_url: '',
                api_key: '',
                temperature: 0.7,
                max_tokens: 1000
            });
        }
    };

    const handleDeleteConfig = (id) => {
        if (confirm('确定要删除这个配置吗？')) {
            deleteLlmConfig(id);
        }
    };

    // Persona Handlers
    const handleAddPersona = () => {
        setEditingPersona('new');
        setPersonaForm({
            name: '',
            prompt: '',
            count: 3
        });
    };

    const handleEditPersona = (persona) => {
        setEditingPersona(persona);
        setPersonaForm({
            name: persona.name,
            prompt: persona.prompt,
            count: persona.count
        });
    };

    const handleSavePersona = () => {
        if (editingPersona === 'new') {
            const newPersona = {
                id: `persona_${Date.now()}`,
                ...personaForm
            };
            addPersona(newPersona);
        } else if (editingPersona) {
            updatePersona(editingPersona.id, personaForm);
        }
        setEditingPersona(null);
        setPersonaForm({ name: '', prompt: '', count: 3 });
    };

    const handleDeletePersona = (id) => {
        if (personas.length <= 1) {
            alert("至少保留一个身份");
            return;
        }
        if (confirm('确定要删除这个身份吗？')) {
            deletePersona(id);
        }
    };

    if (!isChatOpen) {
        return (
            <div className="absolute top-4 right-4 z-20">
                <button 
                    onClick={() => setChatOpen(true)}
                    className="p-2 bg-white shadow rounded-lg border border-gray-200 hover:bg-gray-50 text-blue-500"
                    title="展开AI助手"
                >
                    <PanelRightOpen size={20} />
                </button>
            </div>
        );
    }

    return (
        <div className="w-96 bg-white border-l border-gray-200 flex flex-col h-full shadow-xl z-20 transition-all duration-300">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                <h2 className="font-semibold text-gray-700 flex items-center gap-2">
                    AI 助手 {activeNode ? `(${activeNode.data.label.substring(0, 10)}${activeNode.data.label.length > 10 ? '...' : ''})` : ''}
                </h2>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => setShowConfig(!showConfig)}
                        className="p-1.5 hover:bg-gray-200 rounded text-gray-600 transition-colors"
                        title="设置"
                    >
                        <Settings size={18} />
                    </button>
                    <button 
                        onClick={() => setChatOpen(false)}
                        className="p-1.5 hover:bg-gray-200 rounded text-gray-600 transition-colors"
                        title="隐藏AI助手"
                    >
                        <PanelRightClose size={18} />
                    </button>
                </div>
            </div>

            {/* Config Panel */}
            {showConfig && (
                <div className="p-4 bg-gray-50 border-b border-gray-200 space-y-3 text-sm max-h-96 overflow-y-auto">
                    {/* Configuration List */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <h4 className="font-medium text-gray-700">模型配置</h4>
                            <button 
                                onClick={() => setEditingConfig('new')}
                                className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                            >
                                添加配置
                            </button>
                        </div>
                        
                        {llmConfigs.map(config => (
                            <div key={config.id} className={`p-2 border rounded ${config.id === activeLlmConfig.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <input 
                                            type="radio" 
                                            name="config" 
                                            checked={config.id === activeLlmConfig.id}
                                            onChange={() => switchLlmConfig(config.id)}
                                            className="text-blue-500"
                                        />
                                        <span className="font-medium text-sm">{config.name}</span>
                                        <span className="text-xs text-gray-500">{config.model_name}</span>
                                    </div>
                                    <div className="flex gap-1">
                                        <button 
                                            onClick={() => handleEditConfig(config)}
                                            className="text-xs text-blue-600 hover:underline"
                                        >
                                            编辑
                                        </button>
                                        {config.id !== 'default' && (
                                            <button 
                                                onClick={() => handleDeleteConfig(config.id)}
                                                className="text-xs text-red-600 hover:underline"
                                            >
                                                删除
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Configuration Form */}
                    {editingConfig && (
                        <div className="border-t pt-3 space-y-2">
                            <h5 className="font-medium text-gray-700">
                                {editingConfig === 'new' ? '添加新配置' : '编辑配置'}
                            </h5>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">配置名称</label>
                                <input 
                                    value={configForm.name}
                                    onChange={e => setConfigForm({...configForm, name: e.target.value})}
                                    className="w-full p-2 border rounded text-sm"
                                    placeholder="例如：GPT-4"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">模型名称</label>
                                <input 
                                    value={configForm.model_name}
                                    onChange={e => setConfigForm({...configForm, model_name: e.target.value})}
                                    className="w-full p-2 border rounded text-sm"
                                    placeholder="gpt-3.5-turbo"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">API Key</label>
                                <input 
                                    type="password"
                                    value={configForm.api_key}
                                    onChange={e => setConfigForm({...configForm, api_key: e.target.value})}
                                    className="w-full p-2 border rounded text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Base URL</label>
                                <input 
                                    value={configForm.base_url}
                                    onChange={e => setConfigForm({...configForm, base_url: e.target.value})}
                                    className="w-full p-2 border rounded text-sm"
                                    placeholder="https://api.openai.com/v1"
                                />
                            </div>
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Temperature</label>
                                    <input 
                                        type="number" step="0.1" min="0" max="2"
                                        value={configForm.temperature}
                                        onChange={e => setConfigForm({...configForm, temperature: parseFloat(e.target.value)})}
                                        className="w-full p-2 border rounded text-sm"
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Max Tokens</label>
                                    <input 
                                        type="number" min="1"
                                        value={configForm.max_tokens}
                                        onChange={e => setConfigForm({...configForm, max_tokens: parseInt(e.target.value)})}
                                        className="w-full p-2 border rounded text-sm"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    onClick={editingConfig === 'new' ? handleAddConfig : handleUpdateConfig}
                                    disabled={!configForm.name || !configForm.model_name}
                                    className="flex-1 bg-blue-500 text-white py-2 rounded text-sm hover:bg-blue-600 disabled:bg-gray-300"
                                >
                                    {editingConfig === 'new' ? '添加' : '更新'}
                                </button>
                                <button 
                                    onClick={() => {
                                        setEditingConfig(null);
                                        setConfigForm({
                                            name: '',
                                            model_name: '',
                                            base_url: '',
                                            api_key: '',
                                            temperature: 0.7,
                                            max_tokens: 1000
                                        });
                                    }}
                                    className="flex-1 bg-gray-300 text-gray-700 py-2 rounded text-sm hover:bg-gray-400"
                                >
                                    取消
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Persona Modal */}
            {showPersonaModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={() => setShowPersonaModal(false)}>
                    <div 
                        className="bg-white shadow-2xl border border-gray-200 rounded-lg p-4 w-96 max-h-[600px] flex flex-col"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-3 border-b pb-2">
                            <h3 className="font-semibold text-gray-700">提问agent身份配置</h3>
                            <button onClick={() => setShowPersonaModal(false)} className="text-gray-500 hover:bg-gray-100 p-1 rounded">
                                <X size={16} />
                            </button>
                        </div>

                        {!editingPersona ? (
                            <div className="flex-1 overflow-y-auto space-y-2">
                                {personas.map(p => (
                                    <div key={p.id} className={`p-2 border rounded flex justify-between items-center ${activePersonaId === p.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                                        <div 
                                            className="flex-1 cursor-pointer flex items-center gap-2"
                                            onClick={() => setActivePersonaId(p.id)}
                                        >
                                            <User size={16} className={activePersonaId === p.id ? 'text-blue-500' : 'text-gray-500'} />
                                            <span className="text-sm font-medium">{p.name}</span>
                                        </div>
                                        <div className="flex gap-1">
                                            <button onClick={() => handleEditPersona(p)} className="p-1 text-gray-500 hover:text-blue-600">
                                                <Edit2 size={14} />
                                            </button>
                                            <button onClick={() => handleDeletePersona(p.id)} className="p-1 text-gray-500 hover:text-red-600">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                <button 
                                    onClick={handleAddPersona}
                                    className="w-full py-2 border border-dashed border-gray-300 rounded text-gray-500 hover:bg-gray-50 text-sm flex items-center justify-center gap-1 mt-2"
                                >
                                    <PlusCircle size={16} /> 添加身份
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">身份名称</label>
                                    <input 
                                        value={personaForm.name}
                                        onChange={e => setPersonaForm({...personaForm, name: e.target.value})}
                                        className="w-full p-2 border rounded text-sm"
                                        placeholder="例如：创意助手"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">建议提示词</label>
                                    <textarea 
                                        value={personaForm.prompt}
                                        onChange={e => setPersonaForm({...personaForm, prompt: e.target.value})}
                                        className="w-full p-2 border rounded text-sm h-32 resize-none"
                                        placeholder="基于当前内容，给出3个发散性的创意点..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">建议数量</label>
                                    <input 
                                        type="number" min="1" max="10"
                                        value={personaForm.count}
                                        onChange={e => setPersonaForm({...personaForm, count: parseInt(e.target.value)})}
                                        className="w-full p-2 border rounded text-sm"
                                    />
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <button 
                                        onClick={handleSavePersona}
                                        disabled={!personaForm.name}
                                        className="flex-1 bg-blue-500 text-white py-1.5 rounded text-sm hover:bg-blue-600 disabled:bg-gray-300"
                                    >
                                        保存
                                    </button>
                                    <button 
                                        onClick={() => setEditingPersona(null)}
                                        className="flex-1 bg-gray-200 text-gray-700 py-1.5 rounded text-sm hover:bg-gray-300"
                                    >
                                        返回
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Messages */}
            <div id="chat-messages-container" className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 relative">
                {selectionMenu && (
                    <div 
                        className="fixed z-50 bg-white shadow-lg rounded border border-gray-200 flex flex-col py-1 min-w-[120px]"
                        style={{ top: selectionMenu.top, left: selectionMenu.left }}
                    >
                         <button 
                            onClick={handleCopyText}
                            className="text-left px-4 py-2 hover:bg-gray-100 text-sm"
                        >
                            复制文字
                        </button>
                        <button 
                            onClick={handleInsertSelectionAsChild}
                            className="text-left px-4 py-2 hover:bg-gray-100 text-sm text-blue-600"
                        >
                            插入为子节点
                        </button>
                    </div>
                )}
                {chatMessages.map((msg, idx) => (
                    <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                        <div className={`max-w-[90%] p-3 rounded-lg text-sm ${msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-white border border-gray-200 text-gray-800'}`}>
                            {msg.role === 'assistant' ? <ReactMarkdown>{msg.content}</ReactMarkdown> : msg.content}
                        </div>
                        {msg.role === 'assistant' && msg.content && (
                             <button 
                                onClick={() => {
                                    const prevMsg = idx > 0 ? chatMessages[idx - 1] : null;
                                    let content = msg.content;
                                    if (prevMsg && prevMsg.role === 'user') {
                                        content = `<span style="color: #3b82f6">${prevMsg.content}</span>\n\n${msg.content}`;
                                    }
                                    handleInsertAsChild(content);
                                }}
                                className="mt-1 text-xs text-blue-600 flex items-center gap-1 hover:underline"
                            >
                                <PlusCircle size={12} /> 插入为子节点
                            </button>
                        )}
                    </div>
                ))}
                {isLoading && (
                    <div className="flex items-start">
                         <div className="bg-white border border-gray-200 p-3 rounded-lg flex items-center gap-2">
                            <Loader2 size={16} className="animate-spin text-blue-500" />
                            <span className="text-sm text-gray-600">AI正在思考中...</span>
                         </div>
                    </div>
                )}
                
                {/* Suggestions */}
                {isSuggestionsLoading ? (
                     <div className="flex flex-col gap-2 mt-4">
                        <div className="text-xs text-gray-500 ml-1">生成建议中...</div>
                        <div className="h-8 bg-gray-200 rounded animate-pulse w-3/4"></div>
                        <div className="h-8 bg-gray-200 rounded animate-pulse w-2/3"></div>
                     </div>
                ) : (
                    suggestions.length > 0 && (
                        <div className="flex flex-col gap-2 mt-4">
                             <div className="flex justify-between items-center px-1">
                                <div className="text-xs text-gray-500">您可以继续问：</div>
                                <button 
                                    onClick={generateSuggestions}
                                    className="p-1 hover:bg-blue-100 rounded-full text-blue-500 transition-colors"
                                    title="重新生成建议"
                                >
                                    <RefreshCw size={12} />
                                </button>
                             </div>
                             {suggestions.map((suggestion, idx) => (
                                <button 
                                    key={idx}
                                    onClick={() => handleSend(suggestion)}
                                    className="text-left p-2 bg-white border border-blue-200 rounded-lg text-sm text-gray-700 hover:bg-blue-50 hover:border-blue-300 transition-colors shadow-sm"
                                >
                                    {suggestion}
                                </button>
                             ))}
                        </div>
                    )
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-200 bg-white">
                <div className="flex gap-2">
                    <div className="flex flex-col flex-1 gap-2">
                         <textarea 
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                                    e.preventDefault();
                                    if (!isLoading) {
                                        handleSend();
                                    }
                                }
                            }}
                            placeholder="Ask AI..."
                            className="w-full p-2 border border-gray-300 rounded resize-none h-20 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={isLoading}
                        />
                        <div className="flex justify-between items-center">
                            <button 
                                onClick={() => setShowPersonaModal(!showPersonaModal)}
                                className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                                title="切换/配置身份"
                            >
                                <User size={14} />
                                <span>更换身份（{activePersona?.name || '默认身份'}）</span>
                            </button>
                        </div>
                    </div>
                    {isLoading ? (
                        <button 
                            onClick={handleStop}
                            className="px-3 bg-red-500 text-white rounded hover:bg-red-600 flex items-center justify-center h-20"
                            title="中断对话"
                        >
                            <div className="w-4 h-4 bg-white rounded-sm"></div>
                        </button>
                    ) : (
                        <button 
                            onClick={() => handleSend()}
                            disabled={!input.trim()}
                            className="px-3 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 flex items-center justify-center h-20"
                        >
                            <Send size={18} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChatPanel;
