import React, { memo, useState, useRef, useEffect, useCallback } from 'react';
import { Handle, Position, NodeResizer, useReactFlow } from '@xyflow/react';
import useStore from '../store/useStore';

export default memo(({ id, data, selected }) => {
  const updateNodeData = useStore(state => state.updateNodeData);
  const updateNode = useStore(state => state.updateNode);
  const triggerLayout = useStore(state => state.triggerLayout);
  const pushHistory = useStore(state => state.pushHistory);
  const { getNode } = useReactFlow();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(data.label);
  const inputRef = useRef(null);
  const measureRef = useRef(null);

  useEffect(() => {
    setEditText(data.label);
  }, [data.label]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
    }
  }, [isEditing]);

  // Styles from data
  const fontSize = data.fontSize || 14;
  const color = data.color || '#1f2937'; // gray-800

  const calculateHeight = useCallback((text, width) => {
      if (!measureRef.current) return 40;
      
      // Account for border width (2px * 2 = 4px) defined in CSS
      const borderWidth = 4;
      measureRef.current.style.width = `${width - borderWidth}px`;
      measureRef.current.style.height = '1px'; // Reset height to force scrollHeight calculation
      measureRef.current.value = text || ''; 
      
      const scrollHeight = measureRef.current.scrollHeight;
      return scrollHeight + 2; // Small buffer
   }, []);

  const adjustHeight = useCallback((text) => {
      const node = getNode(id);
      if (!node) return;
      
      // Prefer style.width if set (from resize), else measured width, else default
      let currentWidth = node.style?.width;
      if (typeof currentWidth === 'string' && currentWidth.endsWith('px')) {
          currentWidth = parseInt(currentWidth);
      } else {
          currentWidth = node.width || node.measured?.width || 150;
      }

      const newHeight = calculateHeight(text, currentWidth);
      
      if (node.style?.height !== newHeight) {
          updateNode(id, {
              style: { ...node.style, width: currentWidth, height: newHeight },
              width: currentWidth,
              height: newHeight
          });
      }
  }, [id, getNode, updateNode, calculateHeight]);

  // Auto-resize while typing
  useEffect(() => {
      if (isEditing) {
          adjustHeight(editText);
      }
  }, [editText, isEditing, adjustHeight]);

  const onSubmit = () => {
      setIsEditing(false);
      updateNodeData(id, { label: editText });
      // Final adjustment and trigger layout
      adjustHeight(editText);
      // Small delay to ensure state update before layout
      setTimeout(() => triggerLayout(), 50);
  };

  const handleKeyDown = (evt) => {
      evt.stopPropagation();
      if (evt.key === 'Enter' && !evt.shiftKey) {
          evt.preventDefault(); 
          onSubmit();
      }
  };
  
  const onResizeEnd = useCallback((event, params) => {
      pushHistory();
      const { width } = params;
      const text = isEditing ? editText : data.label;
      const newHeight = calculateHeight(text, width);
      
      updateNode(id, {
          style: { width, height: newHeight },
          width,
          height: newHeight
      });
      
      setTimeout(() => triggerLayout(), 50);
  }, [id, isEditing, editText, data.label, updateNode, triggerLayout, calculateHeight, pushHistory]);

  return (
    <>
        {/* Hidden measurement textarea */}
        <textarea
            ref={measureRef}
            className="px-4 py-2 fixed invisible pointer-events-none resize-none border-none m-0 font-inherit block break-words whitespace-pre-wrap"
            style={{
                fontSize: `${fontSize}px`,
                lineHeight: '1.5',
                fontFamily: 'inherit',
                left: '-9999px',
                top: '-9999px',
                width: '150px',
                minHeight: '40px',
                boxSizing: 'border-box',
                overflow: 'hidden'
            }}
            readOnly
            tabIndex={-1}
            aria-hidden="true"
        />

        <NodeResizer 
            color="#3b82f6" 
            isVisible={selected} 
            minWidth={100} 
            minHeight={40} 
            onResizeEnd={onResizeEnd}
        />
        
        <div 
            onDoubleClick={() => setIsEditing(true)}
            className="h-full w-full relative" // Removed flex centering from parent
            style={{
                fontSize: `${fontSize}px`,
                lineHeight: '1.5',
                color: color,
                boxSizing: 'border-box'
            }}
        >
            <Handle 
                type="target" 
                position={Position.Left} 
                className="w-2 h-2 !bg-blue-400" 
                style={{ left: -6, top: '50%' }} // Center handle manually
            />
            
            {isEditing ? (
                <textarea
                    ref={inputRef}
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    onBlur={onSubmit}
                    onKeyDown={handleKeyDown}
                    className="nodrag w-full h-full resize-none outline-none border-none focus:ring-0 text-left bg-transparent overflow-hidden px-4 py-2 m-0 break-words whitespace-pre-wrap font-inherit block"
                    style={{ 
                        fontSize: `${fontSize}px`, 
                        color: color,
                        lineHeight: '1.5',
                        boxSizing: 'border-box',
                        fontFamily: 'inherit'
                    }}
                />
            ) : (
                <div className="w-full h-full flex items-center text-left pointer-events-none select-none break-words whitespace-pre-wrap px-4 py-2">
                    {data.label}
                </div>
            )}
            
            <Handle 
                type="source" 
                position={Position.Right} 
                className="w-2 h-2 !bg-blue-400" 
                style={{ right: -6, top: '50%' }} // Center handle manually
            />
        </div>
    </>
  );
});
