from pydantic import BaseModel
from typing import List, Optional, Dict, Any, Union

class MindMapNode(BaseModel):
    id: str
    type: Optional[str] = 'default'
    position: Dict[str, float]
    data: Dict[str, Any]
    parentId: Optional[str] = None
    extent: Optional[str] = None

class MindMapEdge(BaseModel):
    id: str
    source: str
    target: str
    type: Optional[str] = 'default'

class MindMapData(BaseModel):
    nodes: List[Dict[str, Any]]
    edges: List[Dict[str, Any]]
    viewport: Dict[str, Any]
    chatHistory: Optional[Dict[str, Any]] = None

class FileItem(BaseModel):
    name: str
    path: str
    type: str  # 'file' or 'folder'
    children: Optional[List['FileItem']] = None

class CreateFolderRequest(BaseModel):
    path: str
    name: str

class RenameRequest(BaseModel):
    path: str
    new_name: str

class MoveRequest(BaseModel):
    source_path: str
    dest_path: str

class LLMConfig(BaseModel):
    model_name: str
    base_url: str
    api_key: str
    temperature: float = 0.7
    max_tokens: int = 1000

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    config: LLMConfig
    node_context: Optional[str] = None
