from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from models import *
from services.file_manager import FileManager
from services.llm_handler import LLMHandler

app = FastAPI()

# Allow CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

file_manager = FileManager()
llm_handler = LLMHandler()

# File Management Endpoints
@app.get("/files", response_model=List[FileItem])
def list_files(path: str = ""):
    return file_manager.list_files(path)

@app.post("/folders")
def create_folder(req: CreateFolderRequest):
    file_manager.create_folder(req.path, req.name)
    return {"status": "success"}

@app.post("/maps")
def create_map(req: CreateFolderRequest): 
    # Using CreateFolderRequest because it has path and name, which is what we need
    file_manager.create_map(req.path, req.name)
    return {"status": "success"}

@app.put("/rename")
def rename_file(req: RenameRequest):
    file_manager.rename(req.path, req.new_name)
    return {"status": "success"}

@app.put("/move")
def move_file(req: MoveRequest):
    file_manager.move(req.source_path, req.dest_path)
    return {"status": "success"}

@app.delete("/files")
def delete_file(path: str):
    file_manager.delete(path)
    return {"status": "success"}

@app.get("/map")
def read_map(path: str):
    return file_manager.read_map(path)

@app.post("/map")
def save_map(path: str = "", data: MindMapData = Body(...)):
    # Note: path is query param
    file_manager.save_map(path, data.dict())
    return {"status": "success"}

# LLM Endpoints
@app.post("/chat/stream")
async def chat_stream(request: ChatRequest):
    return await llm_handler.chat_stream(request)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
