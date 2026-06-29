from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
import pandas as pd
import os
import shutil
from datetime import datetime
from ..database import get_db
from ..models import Dataset, Validation, User
from ..schemas import DatasetResponse, ValidationResponse
from ..auth import get_current_user
from ..config import settings
from ..services.data_validation import DataValidator
from ..services.preprocessing import DataPreprocessor
from ..services.ml_models import MLModelService

router = APIRouter(prefix="/api/datasets", tags=["datasets"])

@router.post("/upload", response_model=DatasetResponse)
async def upload_dataset(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Validate file type
    allowed_extensions = ['.csv', '.xlsx', '.xls']
    file_ext = os.path.splitext(file.filename)[1].lower()
    
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file format. Use: {', '.join(allowed_extensions)}"
        )
    
    # Save file
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    safe_filename = f"{timestamp}_{file.filename}"
    file_path = os.path.join(settings.UPLOAD_DIR, safe_filename)
    
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Read and validate
    if file_ext == '.csv':
        df = pd.read_csv(file_path)
    else:
        df = pd.read_excel(file_path)
    
    validator = DataValidator()
    validation_result = validator.validate_structure(df)
    
    # Save to database
    dataset = Dataset(
        user_id=current_user.id,
        filename=safe_filename,
        original_name=file.filename,
        file_path=file_path,
        file_size=os.path.getsize(file_path),
        rows_count=len(df),
        columns_count=len(df.columns),
        status="validated" if validation_result["is_valid"] else "invalid"
    )
    
    db.add(dataset)
    db.commit()
    db.refresh(dataset)
    
    # Save validation results
    validation = Validation(
        dataset_id=dataset.id,
        is_valid=validation_result["is_valid"],
        missing_columns=validation_result.get("missing_columns", []),
        type_issues=validation_result.get("type_issues", []),
        row_count=len(df),
        column_count=len(df.columns)
    )
    
    db.add(validation)
    db.commit()
    
    return dataset

@router.get("/", response_model=list[DatasetResponse])
def get_datasets(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    datasets = db.query(Dataset).filter(Dataset.user_id == current_user.id).all()
    return datasets

@router.get("/{dataset_id}/validation", response_model=ValidationResponse)
def get_validation(
    dataset_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    validation = db.query(Validation).filter(
        Validation.dataset_id == dataset_id,
        Validation.dataset.has(user_id=current_user.id)
    ).first()
    
    if not validation:
        raise HTTPException(status_code=404, detail="Validation not found")
    
    return validation

@router.post("/{dataset_id}/preprocess")
async def preprocess_dataset(
    dataset_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """FR3 and FR4: Clean and preprocess dataset"""
    
    # Get dataset
    dataset = db.query(Dataset).filter(
        Dataset.id == dataset_id,
        Dataset.user_id == current_user.id
    ).first()
    
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    # Load data
    file_ext = os.path.splitext(dataset.filename)[1].lower()
    if file_ext == '.csv':
        df = pd.read_csv(dataset.file_path)
    else:
        df = pd.read_excel(dataset.file_path)
    
    # Run preprocessing pipeline
    preprocessor = DataPreprocessor()
    result = preprocessor.full_preprocessing_pipeline(df)
    
    if result["success"]:
        # Save cleaned data
        cleaned_file_path = dataset.file_path.replace('.', '_cleaned.')
        result["cleaned_data"].to_csv(cleaned_file_path, index=False)
        
        # Update dataset status
        dataset.status = "preprocessed"
        db.commit()
        
        # Remove cleaned data from response (too large)
        del result["cleaned_data"]
        
        return result
    else:
        raise HTTPException(status_code=500, detail="Preprocessing failed")

@router.post("/{dataset_id}/train")
async def train_model(
    dataset_id: int,
    target_column: str,
    model_type: str = "linear_regression",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """FR8: Train ML model on dataset"""
    
    # Get dataset
    dataset = db.query(Dataset).filter(
        Dataset.id == dataset_id,
        Dataset.user_id == current_user.id
    ).first()
    
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    # Load data
    file_ext = os.path.splitext(dataset.filename)[1].lower()
    if file_ext == '.csv':
        df = pd.read_csv(dataset.file_path)
    else:
        df = pd.read_excel(dataset.file_path)
    
    # Train model
    ml_service = MLModelService()
    
    if model_type == "linear_regression":
        result = ml_service.train_linear_regression(df, target_column)
    elif model_type == "random_forest":
        # Auto-detect problem type
        if df[target_column].dtype == 'object' or df[target_column].nunique() < 10:
            problem_type = "classification"
        else:
            problem_type = "regression"
        result = ml_service.train_random_forest(df, target_column, problem_type)
    else:
        raise HTTPException(status_code=400, detail=f"Unknown model type: {model_type}")
    
    if result["success"]:
        # Save model info to database
        from ..models import Model
        new_model = Model(
            user_id=current_user.id,
            dataset_id=dataset_id,
            model_name=f"{model_type}_model",
            model_type=result.get("problem_type", "regression"),
            algorithm=model_type,
            parameters={},
            accuracy=result["metrics"].get("r2_score") or result["metrics"].get("accuracy"),
            file_path=result["model_path"]
        )
        db.add(new_model)
        db.commit()
        
        return result
    else:
        raise HTTPException(status_code=500, detail=result.get("error", "Training failed"))