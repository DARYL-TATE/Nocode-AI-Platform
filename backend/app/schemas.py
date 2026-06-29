from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import List, Dict, Any, Optional

# User schemas
class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr

class UserCreate(UserBase):
    password: str = Field(..., min_length=6)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    
    model_config = {"from_attributes": True}

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    user_id: Optional[int] = None

# Dataset schemas
class DatasetBase(BaseModel):
    original_name: str
    rows_count: int
    columns_count: int

class DatasetCreate(DatasetBase):
    filename: str
    user_id: int
    file_path: str
    file_size: int

class DatasetResponse(DatasetBase):
    id: int
    status: str
    created_at: datetime
    
    model_config = {"from_attributes": True}

# Validation schemas
class ValidationResponse(BaseModel):
    id: int
    dataset_id: int
    is_valid: bool
    missing_columns: List[str]
    type_issues: List[str]
    range_issues: List[str]
    row_count: int
    column_count: int
    created_at: datetime
    
    model_config = {"from_attributes": True}

# Model schemas
class ModelCreate(BaseModel):
    dataset_id: int
    model_name: str
    model_type: str
    algorithm: str
    parameters: Dict[str, Any] = {}

class ModelResponse(BaseModel):
    id: int
    model_name: str
    model_type: str
    algorithm: str
    accuracy: Optional[float]
    created_at: datetime
    
    model_config = {"from_attributes": True}

# Upload response
class UploadResponse(BaseModel):
    success: bool
    message: str
    dataset_id: int
    file: Dict[str, Any]
    validation: Dict[str, Any]
    preview: List[Dict[str, Any]]