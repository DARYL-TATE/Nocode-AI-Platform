from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, JSON, BigInteger
from sqlalchemy.sql import func
from .database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class Dataset(Base):
    __tablename__ = "datasets"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, nullable=False, index=True)
    filename = Column(String(255), nullable=False)
    original_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(BigInteger)
    rows_count = Column(Integer)
    columns_count = Column(Integer)
    status = Column(String(50), default="uploaded")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Validation(Base):
    __tablename__ = "validations"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    dataset_id = Column(Integer, nullable=False, index=True)
    is_valid = Column(Boolean, default=False)
    missing_columns = Column(JSON, default=list)
    type_issues = Column(JSON, default=list)
    range_issues = Column(JSON, default=list)
    row_count = Column(Integer)
    column_count = Column(Integer)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class MLModel(Base):  # Renamed from Model to avoid SQLAlchemy reserved name
    __tablename__ = "ml_models"  # Renamed table
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, nullable=False, index=True)
    dataset_id = Column(Integer, nullable=False, index=True)
    ml_name = Column(String(100))  # Renamed from model_name
    ml_type = Column(String(50))   # Renamed from model_type
    algorithm = Column(String(50))
    parameters = Column(JSON, default=dict)
    accuracy = Column(Float)
    file_path = Column(String(500))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Prediction(Base):
    __tablename__ = "predictions"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    ml_model_id = Column(Integer, nullable=False, index=True)  # Renamed from model_id
    dataset_id = Column(Integer, nullable=False, index=True)
    predictions = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())