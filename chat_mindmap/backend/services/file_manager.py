import os
import shutil
import json
from typing import List, Optional
from fastapi import HTTPException
from models import FileItem

# Use absolute path for safety
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")

class FileManager:
    def __init__(self, base_path: str = DATA_DIR):
        self.base_path = base_path
        if not os.path.exists(self.base_path):
            os.makedirs(self.base_path)

    def _get_abs_path(self, relative_path: str) -> str:
        # Normalize and join
        if relative_path.startswith("/"):
            relative_path = relative_path[1:]
        abs_path = os.path.abspath(os.path.join(self.base_path, relative_path))
        if not abs_path.startswith(self.base_path):
            raise HTTPException(status_code=400, detail="Invalid path")
        return abs_path

    def list_files(self, path: str = "") -> List[FileItem]:
        abs_path = self._get_abs_path(path)
        items = []
        try:
            for entry in os.scandir(abs_path):
                if entry.name.startswith("."): continue
                item_type = "folder" if entry.is_dir() else "file"
                if item_type == "file" and not entry.name.endswith(".json"): continue
                
                # Return relative path from base_path
                rel_path = os.path.relpath(entry.path, self.base_path)
                
                items.append(FileItem(
                    name=entry.name,
                    path=rel_path,
                    type=item_type
                ))
            # Sort: folders first, then files
            items.sort(key=lambda x: (x.type != 'folder', x.name))
            return items
        except FileNotFoundError:
            return []

    def create_folder(self, path: str, name: str):
        # path is the parent folder relative path
        parent_abs = self._get_abs_path(path)
        abs_path = os.path.join(parent_abs, name)
        try:
            os.makedirs(abs_path, exist_ok=False)
        except FileExistsError:
            raise HTTPException(status_code=400, detail="Folder already exists")

    def create_map(self, path: str, name: str):
        if not name.endswith(".json"):
            name += ".json"
        parent_abs = self._get_abs_path(path)
        abs_path = os.path.join(parent_abs, name)
        if os.path.exists(abs_path):
             raise HTTPException(status_code=400, detail="File already exists")
        
        # Create empty map structure
        empty_map = {
            "nodes": [{"id": "root", "type": "input", "data": {"label": "中心主题"}, "position": {"x": 0, "y": 0}}],
            "edges": [],
            "viewport": {"x": 0, "y": 0, "zoom": 1}
        }
        with open(abs_path, "w", encoding="utf-8") as f:
            json.dump(empty_map, f, ensure_ascii=False, indent=2)

    def rename(self, path: str, new_name: str):
        abs_path = self._get_abs_path(path)
        parent_dir = os.path.dirname(abs_path)
        # Keep extension if it's a file
        if os.path.isfile(abs_path) and not new_name.endswith(".json") and not os.path.isdir(abs_path):
             new_name += ".json"
             
        new_abs_path = os.path.join(parent_dir, new_name)
        
        if os.path.exists(new_abs_path):
             raise HTTPException(status_code=400, detail="Target name already exists")
        os.rename(abs_path, new_abs_path)

    def move(self, source_path: str, dest_path: str):
        # dest_path is the folder to move into
        src_abs = self._get_abs_path(source_path)
        dst_folder_abs = self._get_abs_path(dest_path)
        
        if not os.path.isdir(dst_folder_abs):
             raise HTTPException(status_code=400, detail="Destination is not a folder")
        
        # Check if file already exists in destination
        filename = os.path.basename(src_abs)
        if os.path.exists(os.path.join(dst_folder_abs, filename)):
             raise HTTPException(status_code=400, detail="File with same name exists in destination")
             
        shutil.move(src_abs, dst_folder_abs)

    def delete(self, path: str):
        abs_path = self._get_abs_path(path)
        if os.path.isdir(abs_path):
            shutil.rmtree(abs_path)
        else:
            os.remove(abs_path)

    def read_map(self, path: str) -> dict:
        abs_path = self._get_abs_path(path)
        if not os.path.exists(abs_path):
            raise HTTPException(status_code=404, detail="File not found")
        with open(abs_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        return data

    def save_map(self, path: str, data: dict):
        abs_path = self._get_abs_path(path)
        with open(abs_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
