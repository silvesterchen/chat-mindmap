import axios from 'axios';

const api = axios.create({
    baseURL: '/api'
});

export const fetchFiles = (path = '') => api.get(`/files?path=${path}`);
export const createFolder = (path, name) => api.post('/folders', { path, name });
export const createMap = (path, name) => api.post('/maps', { path, name });
export const renameFile = (path, new_name) => api.put('/rename', { path, new_name });
export const moveFile = (source_path, dest_path) => api.put('/move', { source_path, dest_path });
export const deleteFile = (path) => api.delete(`/files?path=${path}`);
export const readMap = (path) => api.get(`/map?path=${path}`);
export const saveMap = (path, data) => api.post(`/map?path=${path}`, data);

export const chatStream = async (messages, config, node_context, onChunk, onError, signal = null) => {
    try {
        const response = await fetch('/api/chat/stream', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messages,
                config,
                node_context
            }),
            signal // Pass the abort signal
        });

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            onChunk(chunk);
        }
    } catch (error) {
        if (error.name === 'AbortError') {
            onChunk('\n\n[对话已中断]');
        } else {
            onError(error);
        }
    }
};
