import React, { memo, useState, useRef, useEffect, useCallback } from 'react';
import { Handle, Position, NodeResizer, useReactFlow } from '@xyflow/react';
import useStore from '../store/useStore';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import rehypeRaw from 'rehype-raw';
import { marked } from 'marked';
import TurndownService from 'turndown';
import { Bold, Underline, Heading1, Heading2, Heading3, Minus, Type, ChevronDown, List, ListOrdered, Minimize2 } from 'lucide-react';

// Configure Turndown
const turndownService = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    emDelimiter: '*'
});

// Keep some HTML tags if needed, or rely on Markdown
turndownService.keep(['span', 'div', 'br']);

// Configure Marked
marked.setOptions({
    breaks: true,
    gfm: true
});

const colors = [
    '#000000', '#374151', '#9ca3af', '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899'
];

const fontSizes = [
    { label: '小', value: '1' },
    { label: '中', value: '3' }, // Default
    { label: '大', value: '5' },
    { label: '特大', value: '7' },
];

const Toolbar = ({ onAction, currentFormat }) => {
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [showSizePicker, setShowSizePicker] = useState(false);
    const [showHeadingPicker, setShowHeadingPicker] = useState(false);

    // Helper to handle button action without losing focus
    const handleAction = (e, action, value) => {
        e.preventDefault();
        e.stopPropagation();
        onAction(action, value);
    };

    return (
        <div 
            className="absolute z-50 flex items-center bg-white shadow-lg rounded-lg border border-gray-200 p-1 gap-1 nodrag"
            style={{ 
                top: -45, // Fixed position above the node
                left: '50%',
                transform: 'translateX(-50%)' // Center horizontally
            }}
            onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
        >
            {/* Bold */}
            <button 
                onMouseDown={(e) => handleAction(e, 'bold')}
                className="p-1.5 hover:bg-gray-100 rounded text-gray-700"
                title="加粗"
            >
                <Bold size={16} />
            </button>

            {/* Underline */}
            <button 
                onMouseDown={(e) => handleAction(e, 'underline')}
                className="p-1.5 hover:bg-gray-100 rounded text-gray-700"
                title="下划线"
            >
                <Underline size={16} />
            </button>

            {/* Heading / Block Type */}
            <div className="relative">
                <button 
                    onMouseDown={(e) => {
                        e.preventDefault();
                        setShowHeadingPicker(!showHeadingPicker);
                        setShowColorPicker(false);
                        setShowSizePicker(false);
                    }}
                    className="p-1.5 hover:bg-gray-100 rounded text-gray-700 flex items-center gap-1"
                    title="标题设置"
                >
                    <Type size={16} />
                    <ChevronDown size={10} />
                </button>
                {showHeadingPicker && (
                    <div className="absolute top-full left-0 mt-1 bg-white shadow-xl border border-gray-200 rounded py-1 w-32 flex flex-col z-50">
                        <button onMouseDown={(e) => { handleAction(e, 'formatBlock', 'P'); setShowHeadingPicker(false); }} className="px-3 py-2 text-left hover:bg-gray-100 text-sm">正文</button>
                        <button onMouseDown={(e) => { handleAction(e, 'formatBlock', 'H1'); setShowHeadingPicker(false); }} className="px-3 py-2 text-left hover:bg-gray-100 text-sm font-bold">标题 1</button>
                        <button onMouseDown={(e) => { handleAction(e, 'formatBlock', 'H2'); setShowHeadingPicker(false); }} className="px-3 py-2 text-left hover:bg-gray-100 text-sm font-bold">标题 2</button>
                        <button onMouseDown={(e) => { handleAction(e, 'formatBlock', 'H3'); setShowHeadingPicker(false); }} className="px-3 py-2 text-left hover:bg-gray-100 text-sm font-bold">标题 3</button>
                        <button onMouseDown={(e) => { handleAction(e, 'formatBlock', 'H4'); setShowHeadingPicker(false); }} className="px-3 py-2 text-left hover:bg-gray-100 text-sm font-bold">标题 4</button>
                    </div>
                )}
            </div>

            {/* Font Size */}
            <div className="relative">
                <button 
                    onMouseDown={(e) => {
                        e.preventDefault();
                        setShowSizePicker(!showSizePicker);
                        setShowColorPicker(false);
                        setShowHeadingPicker(false);
                    }}
                    className="p-1.5 hover:bg-gray-100 rounded text-gray-700 flex items-center gap-1"
                    title="字号"
                >
                    <span className="text-xs font-bold">A</span>
                    <ChevronDown size={10} />
                </button>
                {showSizePicker && (
                    <div className="absolute top-full left-0 mt-1 bg-white shadow-xl border border-gray-200 rounded py-1 w-24 flex flex-col z-50">
                        {fontSizes.map(size => (
                            <button 
                                key={size.value}
                                onMouseDown={(e) => { handleAction(e, 'fontSize', size.value); setShowSizePicker(false); }} 
                                className="px-3 py-2 text-left hover:bg-gray-100 text-sm"
                            >
                                {size.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>

             {/* Color */}
             <div className="relative">
                <button 
                    onMouseDown={(e) => {
                        e.preventDefault();
                        setShowColorPicker(!showColorPicker);
                        setShowSizePicker(false);
                        setShowHeadingPicker(false);
                    }}
                    className="p-1.5 hover:bg-gray-100 rounded text-gray-700 flex items-center gap-1"
                    title="字体颜色"
                >
                    <div className="w-4 h-4 rounded-full border border-gray-300" style={{ backgroundColor: currentFormat.color || '#000' }}></div>
                    <ChevronDown size={10} />
                </button>
                {showColorPicker && (
                    <div className="absolute top-full left-0 mt-1 bg-white shadow-xl border border-gray-200 rounded p-2 grid grid-cols-5 gap-1 w-40 z-50">
                        {colors.map(c => (
                            <button 
                                key={c}
                                onMouseDown={(e) => { handleAction(e, 'foreColor', c); setShowColorPicker(false); }} 
                                className="w-6 h-6 rounded-full border border-gray-200 hover:scale-110 transition-transform"
                                style={{ backgroundColor: c }}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Lists */}
            <div className="w-px h-4 bg-gray-300 mx-1"></div>

            <button 
                onMouseDown={(e) => handleAction(e, 'insertUnorderedList')}
                className="p-1.5 hover:bg-gray-100 rounded text-gray-700"
                title="无序列表"
            >
                <List size={16} />
            </button>

            <button 
                onMouseDown={(e) => handleAction(e, 'insertOrderedList')}
                className="p-1.5 hover:bg-gray-100 rounded text-gray-700"
                title="有序列表"
            >
                <ListOrdered size={16} />
            </button>

            <div className="w-px h-4 bg-gray-300 mx-1"></div>

             {/* Separator */}
             <button 
                onMouseDown={(e) => handleAction(e, 'insertHorizontalRule')}
                className="p-1.5 hover:bg-gray-100 rounded text-gray-700"
                title="分隔符"
            >
                <Minus size={16} />
            </button>

            <div className="w-px h-4 bg-gray-300 mx-1"></div>

            {/* Golden Ratio Shrink */}
            <button 
                onMouseDown={(e) => handleAction(e, 'goldenRatioShrink')}
                className="p-1.5 hover:bg-gray-100 rounded text-gray-700"
                title="黄金比例收缩"
            >
                <Minimize2 size={16} />
            </button>
        </div>
    );
};

export default memo(({ id, data, selected }) => {
    const updateNodeData = useStore(state => state.updateNodeData);
    const updateNode = useStore(state => state.updateNode);
    const triggerLayout = useStore(state => state.triggerLayout);
    const pushHistory = useStore(state => state.pushHistory);
    const { getNode } = useReactFlow();
  
    const [isEditing, setIsEditing] = useState(false);
    const [currentFormat, setCurrentFormat] = useState({});
    
    const editorRef = useRef(null);
    const containerRef = useRef(null);

    // Initialize content when entering edit mode
    useEffect(() => {
        if (isEditing && editorRef.current) {
            // Convert Markdown to HTML
            const html = marked.parse(data.label || '');
            editorRef.current.innerHTML = html;
            editorRef.current.focus();
            
            // Select all
            const range = document.createRange();
            range.selectNodeContents(editorRef.current);
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
        }
    }, [isEditing]); // Intentionally not depending on data.label to avoid overwrite during edit

    const handleSelectionChange = useCallback(() => {
        if (!isEditing || !editorRef.current) return;

        // Detect current format (simplified)
        setCurrentFormat({
            color: document.queryCommandValue('foreColor'),
        });

    }, [isEditing]);

    useEffect(() => {
        document.addEventListener('selectionchange', handleSelectionChange);
        return () => document.removeEventListener('selectionchange', handleSelectionChange);
    }, [handleSelectionChange]);

    const executeCommand = (command, value = null) => {
        if (command === 'goldenRatioShrink') {
            const node = getNode(id);
            if (node && node.width) {
                // Golden ratio calculation: Height > Width
                // Target Height = Width * 1.618 (approx 1 / 0.618)
                const targetHeight = node.width / 0.618;
                
                // IMPORTANT: Do NOT set overflowY on the node style, as it will clip the toolbar (which is positioned outside with negative top).
                // The internal container div already handles overflow-y-auto.
                
                const newStyle = { ...node.style, height: targetHeight };
                if (newStyle.overflowY) {
                    delete newStyle.overflowY;
                }

                pushHistory();
                updateNode(id, {
                    style: newStyle,
                    height: targetHeight
                });
                
                // Trigger layout to adjust surrounding nodes if needed
                setTimeout(() => triggerLayout(), 50);
            }
            return;
        }

        document.execCommand(command, false, value);
        if (editorRef.current) {
            editorRef.current.focus();
        }
    };

    const handleBlur = (e) => {
        // Delay blur to allow toolbar clicks
        // Check if relatedTarget is toolbar button? 
        // Actually, toolbar buttons use preventDefault on mousedown, so focus shouldn't leave editor.
        // But if we click outside, we want to save.
        
        // We can use a small timeout or check logic.
        // For simplicity: save on blur.
        
        // But wait, if we click toolbar, we don't want to blur.
        // The toolbar buttons have e.preventDefault() on mousedown, so they shouldn't trigger blur on editor.
        
        // Let's verify if focus is really lost.
        // If relatedTarget is null (clicking background) or another element.
        
        // Convert HTML to Markdown
        if (editorRef.current) {
            const html = editorRef.current.innerHTML;
            const markdown = turndownService.turndown(html);
            
            if (markdown !== data.label) {
                updateNodeData(id, { label: markdown });
            }
        }
        setIsEditing(false);
    };

    // Auto-resize logic
    useEffect(() => {
        if (containerRef.current) {
            const resizeObserver = new ResizeObserver((entries) => {
                for (let entry of entries) {
                    const { width, height } = entry.contentRect;
                    // We need to update the node style height to match content
                    // But prevent infinite loops.
                    const node = getNode(id);
                    if (node && (Math.abs(node.height - height) > 5 || Math.abs(node.width - width) > 5)) {
                        // Only update if difference is significant
                        // updateNode(id, { width, height: height + 10 }); // Add padding?
                        // Actually, React Flow nodes with auto height works better if we don't force height in style unless resizing.
                        // But for dagre layout, we need dimensions.
                        // We will just store measured dimensions in data or a separate field, 
                        // or update style if we want to enforce it.
                        
                        // For now, let's just let the div expand naturally.
                        // And update the node's internal dimensions for layout engine.
                         updateNode(id, { 
                             measured: { width: width + 8, height: height + 8 },
                             // style: { ...node.style, height: 'auto' } // Removed to allow fixed height
                         });
                    }
                }
            });
            resizeObserver.observe(containerRef.current);
            return () => resizeObserver.disconnect();
        }
    }, [id, getNode, updateNode]);


    // Track resize start height to determine if user wants to change height
    const resizeStartHeightRef = useRef(null);

    const onResizeStart = useCallback((event, params) => {
        resizeStartHeightRef.current = params.height;
    }, []);

    const onResizeEnd = useCallback((event, params) => {
        pushHistory();
        const { width, height } = params;
        
        // If height changed significantly, user probably dragged bottom/corner -> fixed height
        // If height is almost same as start, user probably dragged right edge -> auto height
        
        const heightChanged = Math.abs(height - (resizeStartHeightRef.current || 0)) > 5;
        
        const newStyle = { width };
        if (heightChanged) {
            newStyle.height = height;
        } else {
            newStyle.height = 'auto';
        }

        updateNode(id, {
            style: newStyle,
            width,
            height: heightChanged ? height : undefined // undefined implies auto/measured
        });
        
        // Reset ref
        resizeStartHeightRef.current = null;
        
        setTimeout(() => triggerLayout(), 50);
    }, [id, updateNode, triggerLayout, pushHistory]);

    // Tailwind typography prose class for markdown styling
    const proseClass = "markdown-content text-left";

    return (
        <>
            <NodeResizer 
                color="#3b82f6" 
                isVisible={selected} 
                minWidth={100} 
                minHeight={40} 
                onResizeStart={onResizeStart}
                onResizeEnd={onResizeEnd}
                handleStyle={{ width: 12, height: 12, borderRadius: 6 }} // Make handles bigger
                lineStyle={{ borderStyle: 'solid', borderWidth: 1 }} // Make border clearer
            />
            
            {/* Toolbar Portal */}
            {isEditing && (
                <Toolbar 
                    onAction={executeCommand} 
                    currentFormat={currentFormat}
                />
            )}

            <div 
                ref={containerRef}
                className={`relative h-full w-full min-h-[40px] px-4 py-2 bg-white ${selected ? 'ring-2 ring-blue-500' : ''} rounded overflow-y-auto custom-scrollbar nowheel ${isEditing ? 'nodrag cursor-text' : 'cursor-default'}`}
                onDoubleClick={() => setIsEditing(true)}
                onWheel={(e) => {
                    // Prevent React Flow zoom/pan when scrolling inside node
                    e.stopPropagation();
                }}
            >
                <Handle 
                    type="target" 
                    position={Position.Left} 
                    className="w-2 h-2 !bg-blue-400" 
                    style={{ left: -6, top: '50%' }} 
                />
                
                {isEditing ? (
                    <div
                        key="editor"
                        ref={editorRef}
                        contentEditable
                        onBlur={handleBlur}
                        className={`nodrag outline-none min-h-[1em] break-words whitespace-normal ${proseClass}`}
                        suppressContentEditableWarning
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                                e.preventDefault();
                                e.target.blur();
                            }
                            if (e.key === 'Tab') {
                                e.preventDefault();
                                document.execCommand('insertText', false, '  ');
                            }
                        }}
                    />
                ) : (
                    <div key="viewer" className={`${proseClass} select-none pointer-events-none`}>
                        <ReactMarkdown 
                            remarkPlugins={[remarkGfm, remarkBreaks]}
                            rehypePlugins={[rehypeRaw]}
                            components={{
                                // Custom renderers if needed
                                // e.g. links to open in new tab
                                a: ({node, ...props}) => <a {...props} target="_blank" rel="noopener noreferrer" />
                            }}
                        >
                            {data.label}
                        </ReactMarkdown>
                    </div>
                )}
                
                <Handle 
                    type="source" 
                    position={Position.Right} 
                    className="w-2 h-2 !bg-blue-400" 
                    style={{ right: -6, top: '50%' }} 
                />
            </div>
        </>
    );
});
