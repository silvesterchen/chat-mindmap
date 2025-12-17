import React, { useCallback, useRef, useState, useEffect } from 'react';
import dagre from 'dagre';
import { 
    ReactFlow, 
    MiniMap, 
    Controls, 
    Background, 
    useNodesState, 
    useEdgesState, 
    addEdge,
    Panel,
    useReactFlow,
    ReactFlowProvider
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import CustomNode from './CustomNode';
import useStore from '../store/useStore';
import { saveMap } from '../api';
import { Download, Upload, Save, Plus, Trash2, MessageSquare, Layout, Undo, FileText, X, Copy, Check } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { chatStream } from '../api';
import ReactMarkdown from 'react-markdown';

const nodeTypes = {
  default: CustomNode,
  input: CustomNode, // Re-use for root
};

const MindMapContent = () => {
    const { 
        nodes, setNodes, onNodesChange, 
        edges, setEdges, onEdgesChange, onConnect,
        currentMapPath,
        setChatOpen, isChatOpen, setActiveNodeId,
        addChatMessage, clearChat,
        updateNodeData,
        chatHistories,
        layoutTrigger,
        pushHistory, undo, past,
        activeLlmConfig
    } = useStore();
    
    const [menu, setMenu] = useState(null);
    const [isExporting, setIsExporting] = useState(false);
    const [exportContent, setExportContent] = useState('');
    const [exportStatus, setExportStatus] = useState('idle'); // idle, generating, completed, error
    const [isCopied, setIsCopied] = useState(false);
    const reactFlowWrapper = useRef(null);
    const { screenToFlowPosition, getIntersectingNodes, fitView, getNodes, getEdges } = useReactFlow();

    const selectedNodes = nodes.filter((node) => node.selected);
    const selectedNode = selectedNodes.length === 1 ? selectedNodes[0] : null;

    // Update activeNodeId when selection changes if chat is open
    useEffect(() => {
        if (isChatOpen && selectedNode) {
            setActiveNodeId(selectedNode.id);
        }
    }, [selectedNode, isChatOpen, setActiveNodeId]);

    const handleStyleChange = (key, value) => {
        selectedNodes.forEach(node => {
             updateNodeData(node.id, { [key]: value });
        });
    };

    const onLayout = useCallback((direction = 'LR', nodesParam, edgesParam) => {
        pushHistory('layout'); // Save state before layout, marking it as a layout action
        const currentNodes = nodesParam || getNodes();
        const currentEdges = edgesParam || getEdges();

        const dagreGraph = new dagre.graphlib.Graph();
        dagreGraph.setDefaultEdgeLabel(() => ({}));
        dagreGraph.setGraph({ rankdir: direction });

        currentNodes.forEach((node) => {
            dagreGraph.setNode(node.id, { width: node.measured?.width || 150, height: node.measured?.height || 50 });
        });

        currentEdges.forEach((edge) => {
            dagreGraph.setEdge(edge.source, edge.target);
        });

        dagre.layout(dagreGraph);

        const layoutedNodes = currentNodes.map((node) => {
            const nodeWithPosition = dagreGraph.node(node.id);
            return {
                ...node,
                targetPosition: direction === 'LR' ? 'left' : 'top',
                sourcePosition: direction === 'LR' ? 'right' : 'bottom',
                position: {
                    x: nodeWithPosition.x - (node.measured?.width || 150) / 2,
                    y: nodeWithPosition.y - (node.measured?.height || 50) / 2,
                },
            };
        });

        setNodes(layoutedNodes);
        // Removed automatic fitView() to preserve user's viewport
        /* 
        setTimeout(() => {
            window.requestAnimationFrame(() => {
                fitView();
            });
        }, 50);
        */
    }, [getNodes, getEdges, setNodes]);

    // Listen to layoutTrigger
    useEffect(() => {
        if (layoutTrigger > 0) {
            onLayout('LR');
        }
    }, [layoutTrigger, onLayout]);

    // Auto-save effect
    useEffect(() => {
        if (!currentMapPath) return;
        
        // Debounce auto-save
        const timer = setTimeout(async () => {
            try {
                const currentHistory = chatHistories[currentMapPath];
                await saveMap(currentMapPath, { 
                    nodes, 
                    edges, 
                    viewport: { x: 0, y: 0, zoom: 1 }, // Ideally get current viewport
                    chatHistory: currentHistory
                });
                console.log('Auto-saved map');
            } catch (err) {
                console.error('Auto-save failed', err);
            }
        }, 1000); // 1s debounce

        return () => clearTimeout(timer);
    }, [nodes, edges, currentMapPath, chatHistories]);

    const onNodeContextMenu = useCallback(
        (event, node) => {
            event.preventDefault();
            const pane = reactFlowWrapper.current.getBoundingClientRect();
            setMenu({
                id: node.id,
                top: event.clientY - pane.top,
                left: event.clientX - pane.left,
                node: node
            });
        },
        [setMenu],
    );

    const onPaneClick = useCallback(() => setMenu(null), [setMenu]);

    const handleAddChild = useCallback((parentId) => {
        const parent = nodes.find(n => n.id === parentId);
        if (!parent) return;

        pushHistory();

        const newNode = {
            id: `${Date.now()}`,
            type: 'default',
            position: { x: parent.position.x + 200, y: parent.position.y }, // Temporary position
            data: { label: '新节点' },
        };
        
        const newEdge = {
            id: `e${parentId}-${newNode.id}`,
            source: parentId,
            target: newNode.id,
        };

        const newNodes = [...nodes, newNode];
        const newEdges = [...edges, newEdge];

        setNodes(newNodes);
        setEdges(newEdges);
        setMenu(null);
        
        // Trigger layout after a short delay to allow measurement
        setTimeout(() => {
            onLayout('LR', newNodes, newEdges);
        }, 50);

    }, [nodes, edges, setNodes, setEdges, onLayout]);

    const handleDeleteNode = useCallback((id) => {
        pushHistory();
        setNodes(nodes.filter(n => n.id !== id));
        setEdges(edges.filter(e => e.source !== id && e.target !== id));
        setMenu(null);
    }, [nodes, edges, setNodes, setEdges, pushHistory]);

    const handleAIChat = useCallback((id) => {
        setActiveNodeId(id);
        setChatOpen(true);
        // Removed clearChat() to preserve history
        // Optional: Add initial system message or context
        setMenu(null);
    }, [setActiveNodeId, setChatOpen]);

    // Reparenting on Drag Stop
    const onNodeDragStart = useCallback((event, node) => {
        pushHistory();
    }, [pushHistory]);

    const onNodeDragStop = useCallback(
        (event, node) => {
            const intersections = getIntersectingNodes(node).filter(n => n.id !== node.id);
            if (intersections.length > 0) {
                const newParent = intersections[0];
                
                // Update edge: Remove old edge where target is node.id, add new edge
                const newEdges = edges.filter(e => e.target !== node.id);
                newEdges.push({
                    id: `e${newParent.id}-${node.id}`,
                    source: newParent.id,
                    target: node.id,
                });
                
                setEdges(newEdges);
                
                // Adjust position to be relative or visually distinct if needed
                // For now, just link them. Ideally, we'd run a layout algorithm.
            }
        },
        [nodes, edges, getIntersectingNodes, setEdges]
    );

    const handleExportPDF = async () => {
        if (!reactFlowWrapper.current) return;
        try {
            const canvas = await html2canvas(reactFlowWrapper.current);
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'landscape',
            });
            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save('mindmap.pdf');
        } catch (err) {
            console.error(err);
        }
    };

    // Export Markdown Logic
    const handleExportMarkdown = async () => {
        setIsExporting(true);
        setExportContent('');
        setExportStatus('generating');
        setIsCopied(false);

        // Collect all node contents
        const allNodesContent = nodes.map(node => `- ${node.data.label}`).join('\n');
        
        const systemMsg = {
            role: 'system',
            content: `你是一位乐于助人的助手。你的任务是将提供的思维导图节点整理成一份结构清晰的 Markdown 文档，要求根据内容选择合适的输出格式，例如调研最终格式要符合调研的格式，有背景、目标、内容、结论；技术学习核心知识点梳理、实操、成果和后续方向、总结；学习类笔记有核心概念说明、原理、个人思考、应用场景联想等。
            这份文档要进行适当的扩写和润色，让文章显出一条清晰的故事线，能让新手也能理解，需适合分享与阅读，要保证逻辑连贯、格式规范（包含标题、列表、加粗文本，根据文章内容适当划分章节），并完整覆盖所有相关内容。
            文档中请勿添加任何前言或后记，只保留 Markdown 格式的正文内容。`
        };

        const userMsg = {
            role: 'user',
            content: `Mind Map Content:\n${allNodesContent}`
        };

        let fullText = "";
        try {
            await chatStream([systemMsg, userMsg], activeLlmConfig, null, (chunk) => {
                fullText += chunk;
                setExportContent(fullText);
            }, (err) => {
                console.error("Export stream error", err);
                setExportStatus('error');
            });
            setExportStatus('completed');
        } catch (err) {
            console.error("Export error", err);
            setExportStatus('error');
        }
    };

    const handleCopyMarkdown = () => {
        navigator.clipboard.writeText(exportContent);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    const handleDownloadMarkdown = () => {
        const blob = new Blob([exportContent], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'mindmap_export.md';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Ignore if editing text
            if (['INPUT', 'TEXTAREA'].includes(e.target.tagName) || e.target.isContentEditable) {
                return;
            }

            if (e.key === 'Delete' || e.key === 'Backspace') {
                const selected = nodes.filter(n => n.selected);
                if (selected.length > 0) {
                    selected.forEach(n => handleDeleteNode(n.id));
                }
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [nodes, handleDeleteNode]);


    return (
        <div className="flex-1 h-full relative" ref={reactFlowWrapper}>
            <div className="absolute top-4 left-4 z-10 flex gap-2 bg-white p-2 rounded shadow-sm border border-gray-200">
                 <button onClick={() => {
                     if (confirm('确定要清除所有节点吗？这将重置导图。')) {
                         pushHistory();
                         const root = { id: 'root', type: 'input', data: { label: '中心主题' }, position: { x: 100, y: 100 } };
                         setNodes([root]); setEdges([]);
                     }
                 }} className="flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white rounded hover:bg-red-600 text-sm">
                    <Trash2 size={16} /> 清除所有节点
                </button>
                <button onClick={() => onLayout('LR')} className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-300 rounded hover:bg-gray-50 text-sm">
                    <Layout size={16} /> 一键排版
                </button>
                <button 
                    onClick={undo} 
                    disabled={past.length === 0}
                    className={`flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-300 rounded text-sm ${past.length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}
                >
                    <Undo size={16} /> 撤销
                </button>
                <button 
                    onClick={handleExportMarkdown} 
                    className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-300 rounded hover:bg-gray-50 text-sm"
                >
                    <FileText size={16} /> 导出 Markdown
                </button>
                {/* Removed Save button as it's auto-saved */}
                {/*
                <button onClick={handleExportPDF} className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-300 rounded hover:bg-gray-50 text-sm">
                    <Download size={16} /> 导出PDF
                </button>
                */}
            </div>

            {/* Export Modal */}
            {isExporting && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[80vh] flex flex-col">
                        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-lg">
                            <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                                <FileText size={18} /> 导出 Markdown 文档
                            </h3>
                            <button onClick={() => setIsExporting(false)} className="p-1 hover:bg-gray-200 rounded text-gray-600">
                                <X size={18} />
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                            {exportStatus === 'idle' || exportStatus === 'generating' ? (
                                <div className="space-y-4">
                                    {exportContent ? (
                                        <div className="prose max-w-none bg-white p-6 rounded shadow-sm border border-gray-200">
                                            <ReactMarkdown>{exportContent}</ReactMarkdown>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                                            <div className="animate-spin mb-4">
                                                <Layout size={32} className="text-blue-500" />
                                            </div>
                                            <p>正在根据导图内容生成文档，请稍候...</p>
                                        </div>
                                    )}
                                </div>
                            ) : exportStatus === 'error' ? (
                                <div className="flex flex-col items-center justify-center h-64 text-red-500">
                                    <p>生成文档时出错，请重试。</p>
                                    <button 
                                        onClick={handleExportMarkdown}
                                        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                                    >
                                        重试
                                    </button>
                                </div>
                            ) : (
                                <div className="prose max-w-none bg-white p-6 rounded shadow-sm border border-gray-200">
                                    <ReactMarkdown>{exportContent}</ReactMarkdown>
                                </div>
                            )}
                        </div>

                        {exportStatus === 'completed' && (
                            <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg flex justify-end gap-3">
                                <button 
                                    onClick={handleCopyMarkdown}
                                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded hover:bg-gray-100 text-sm text-gray-700"
                                >
                                    {isCopied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                                    {isCopied ? '已复制' : '复制文本'}
                                </button>
                                <button 
                                    onClick={handleDownloadMarkdown}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                                >
                                    <Download size={16} /> 下载 Markdown
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeContextMenu={onNodeContextMenu}
                onPaneClick={onPaneClick}
                onNodeDragStart={onNodeDragStart}
                onNodeDragStop={onNodeDragStop}
                nodeTypes={nodeTypes}
                fitView
            >
                <Background color="#aaa" gap={16} />
                <Controls />
                <MiniMap />
            </ReactFlow>

            {menu && (
                <div
                    style={{ top: menu.top, left: menu.left }}
                    className="absolute z-50 bg-white shadow-lg rounded-lg border border-gray-200 py-1 min-w-[120px]"
                >
                    <button onClick={() => handleAddChild(menu.id)} className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm flex items-center gap-2">
                        <Plus size={14} /> 添加子节点
                    </button>
                    {/* Removed AI Chat option from context menu as Chat Panel is now always available */}
                    <button onClick={() => handleDeleteNode(menu.id)} className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-red-500 flex items-center gap-2">
                        <Trash2 size={14} /> 删除节点
                    </button>
                </div>
            )}
        </div>
    );
};

const MindMap = () => (
    <ReactFlowProvider>
        <MindMapContent />
    </ReactFlowProvider>
);

export default MindMap;
