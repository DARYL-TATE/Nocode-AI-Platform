import os
import shutil
from typing import Dict, Any, Optional
from datetime import datetime
import pandas as pd

class FileHandler:
    """Utility functions for file handling"""
    
    @staticmethod
    def save_upload_file(file_content: bytes, filename: str, upload_dir: str) -> Dict[str, Any]:
        """Save uploaded file to disk"""
        try:
            # Create timestamp
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            safe_filename = f"{timestamp}_{filename}"
            file_path = os.path.join(upload_dir, safe_filename)
            
            # Ensure directory exists
            os.makedirs(upload_dir, exist_ok=True)
            
            # Save file
            with open(file_path, "wb") as buffer:
                buffer.write(file_content)
            
            return {
                "success": True,
                "filename": safe_filename,
                "original_name": filename,
                "file_path": file_path,
                "file_size": len(file_content),
                "uploaded_at": datetime.now().isoformat()
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    @staticmethod
    def delete_file(file_path: str) -> bool:
        """Delete file from disk"""
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
                return True
            return False
        except Exception:
            return False
    
    @staticmethod
    def get_file_info(file_path: str) -> Optional[Dict[str, Any]]:
        """Get file information"""
        if not os.path.exists(file_path):
            return None
        
        stat = os.stat(file_path)
        return {
            "path": file_path,
            "size": stat.st_size,
            "created": datetime.fromtimestamp(stat.st_ctime).isoformat(),
            "modified": datetime.fromtimestamp(stat.st_mtime).isoformat()
        }
    
    @staticmethod
    def cleanup_old_files(upload_dir: str, days_old: int = 7):
        """Delete files older than specified days"""
        try:
            current_time = datetime.now()
            deleted_count = 0
            
            for filename in os.listdir(upload_dir):
                file_path = os.path.join(upload_dir, filename)
                if os.path.isfile(file_path):
                    file_time = datetime.fromtimestamp(os.path.getctime(file_path))
                    age_days = (current_time - file_time).days
                    
                    if age_days > days_old:
                        os.remove(file_path)
                        deleted_count += 1
            
            return {"deleted_count": deleted_count}
        except Exception as e:
            return {"error": str(e), "deleted_count": 0}