import React, { useEffect, useState } from 'react';
import { Folder, FileText, ChevronRight, ChevronDown, Plus, FolderPlus, FilePlus, Edit2, Trash2, ArrowLeft, PanelLeftClose } from 'lucide-react';
import useStore from '../store/useStore';
import { fetchFiles, createFolder, createMap, renameFile, deleteFile, moveFile, readMap } from '../api';
import clsx from 'clsx';

const Sidebar = () => {
    const { files, setFiles, currentPath, setCurrentPath, loadMap, isSidebarOpen, toggleSidebar, currentMapPath } = useStore();
    const [isCreating, setIsCreating] = useState(null); // 'folder' or 'map'
    const [newItemName, setNewItemName] = useState('');
    const [editingItem, setEditingItem] = useState(null);

    useEffect(() => {
        loadFiles();
    }, [currentPath]);

    const loadFiles = async () => {
        try {
            const res = await fetchFiles(currentPath);
            setFiles(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleCreate = async () => {
        if (!newItemName) return;
        try {
            if (isCreating === 'folder') {
                await createFolder(currentPath, newItemName);
            } else {
                await createMap(currentPath, newItemName);
            }
            setIsCreating(null);
            setNewItemName('');
            loadFiles();
        } catch (err) {
            alert(err.response?.data?.detail || err.message || 'Error creating item');
        }
    };

    const handleRename = async () => {
        if (!newItemName) return;
        try {
            await renameFile(editingItem.path, newItemName);
            setEditingItem(null);
            setNewItemName('');
            loadFiles();
        } catch (err) {
            alert(err.response?.data?.detail || 'Error renaming item');
        }
    };

    const handleDelete = async (path) => {
        if (!confirm('Are you sure you want to delete this?')) return;
        try {
            await deleteFile(path);
            loadFiles();
        } catch (err) {
            console.error(err);
        }
    };

    const handleFileClick = async (file) => {
        if (file.type === 'folder') {
            setCurrentPath(file.path);
        } else {
            try {
                const res = await readMap(file.path);
                loadMap(file.path, res.data);
            } catch (err) {
                console.error(err);
            }
        }
    };

    const handleDragStart = (e, file) => {
        e.dataTransfer.setData('text/plain', file.path);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleDrop = async (e, targetFolder) => {
        e.preventDefault();
        const sourcePath = e.dataTransfer.getData('text/plain');
        if (!sourcePath) return;
        
        try {
            await moveFile(sourcePath, targetFolder.path);
            loadFiles();
        } catch (err) {
            alert(err.response?.data?.detail || 'Error moving file');
        }
    };

    if (!isSidebarOpen) return null;

    return (
        <div className="w-64 bg-gray-100 border-r border-gray-200 h-full flex flex-col flex-shrink-0 transition-all duration-300">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-white">
                <h2 className="font-semibold text-gray-700">文件管理</h2>
                <button onClick={toggleSidebar} className="text-gray-500 hover:bg-gray-100 rounded p-1">
                    <PanelLeftClose size={18} />
                </button>
            </div>
            
            <div className="p-2 grid grid-cols-2 gap-2">
                <button 
                    onClick={() => setIsCreating('map')}
                    className="flex items-center justify-center gap-1 px-3 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50 text-sm whitespace-nowrap"
                >
                    <Plus size={16} /> 新建导图
                </button>
                <button 
                    onClick={() => setIsCreating('folder')}
                    className="flex items-center justify-center gap-1 px-3 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50 text-sm whitespace-nowrap"
                >
                    <FolderPlus size={16} /> 新建文件夹
                </button>
            </div>

            {currentPath && (
                <button 
                    onClick={() => setCurrentPath(currentPath.split('/').slice(0, -1).join('/'))}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:bg-gray-200"
                >
                    <ArrowLeft size={16} /> 返回上一级
                </button>
            )}

            <div className="flex-1 overflow-y-auto p-2">
                {isCreating && (
                    <div className="flex items-center gap-2 p-2 bg-white rounded border border-blue-300 mb-2">
                        {isCreating === 'folder' ? <Folder size={16} className="text-yellow-500"/> : <FileText size={16} className="text-blue-500"/>}
                        <input 
                            autoFocus
                            value={newItemName}
                            onChange={e => setNewItemName(e.target.value)}
                            onBlur={() => setIsCreating(null)}
                            onKeyDown={e => e.key === 'Enter' && handleCreate()}
                            className="w-full text-sm outline-none"
                            placeholder="Enter name..."
                        />
                    </div>
                )}

                {files.map(file => (
                    <div 
                        key={file.path}
                        draggable
                        onDragStart={(e) => handleDragStart(e, file)}
                        onDragOver={file.type === 'folder' ? handleDragOver : undefined}
                        onDrop={file.type === 'folder' ? (e) => handleDrop(e, file) : undefined}
                        className={clsx(
                            "group flex items-center justify-between p-2 rounded cursor-pointer text-sm",
                            currentMapPath === file.path ? "bg-blue-100 text-blue-700" : "hover:bg-gray-200 text-gray-700"
                        )}
                    >
                        {editingItem?.path === file.path ? (
                            <div className="flex items-center gap-2 w-full">
                                <input 
                                    autoFocus
                                    value={newItemName}
                                    onChange={e => setNewItemName(e.target.value)}
                                    onBlur={() => setEditingItem(null)}
                                    onKeyDown={e => e.key === 'Enter' && handleRename()}
                                    onClick={e => e.stopPropagation()}
                                    className="w-full outline-none bg-white px-1 rounded border border-blue-300"
                                />
                            </div>
                        ) : (
                            <>
                                <div 
                                    className="flex items-center gap-2 flex-1 overflow-hidden"
                                    onClick={() => handleFileClick(file)}
                                >
                                    {file.type === 'folder' ? (
                                        <Folder size={18} className="text-yellow-500 flex-shrink-0" />
                                    ) : (
                                        <FileText size={18} className="text-blue-500 flex-shrink-0" />
                                    )}
                                    <span className="truncate">{file.name}</span>
                                </div>
                                <div className="hidden group-hover:flex items-center gap-1">
                                    <button onClick={(e) => { e.stopPropagation(); setEditingItem(file); setNewItemName(file.name); }} className="p-1 hover:bg-gray-300 rounded">
                                        <Edit2 size={14} />
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); handleDelete(file.path); }} className="p-1 hover:bg-gray-300 rounded text-red-500">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Sidebar;
