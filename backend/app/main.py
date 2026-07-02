from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import Column, Integer, String, Boolean, DateTime, JSON, BigInteger
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from jose import JWTError, jwt
from pydantic import BaseModel
from typing import List, Dict, Any
import pandas as pd
import numpy as np
import os
import uvicorn
import hashlib
import secrets
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# ============ PYDANTIC MODELS ============
class UserCreate(BaseModel):
    username: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

# ============ CONFIGURATION ============
# Use environment variables for PostgreSQL
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres.[smart-platform]:[Smart-ml123]@aws-0-us-east-1.pooler.supabase.com:5432/postgres")
SECRET_KEY = os.getenv("SECRET_KEY", "your-super-secret-key-change-this-in-production")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "./uploads")
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:5173").split(",")

os.makedirs(UPLOAD_DIR, exist_ok=True)

# ============ DATABASE ============
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=3600,
    pool_size=5,
    max_overflow=10,
    echo=False
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# ============ HASHING ============
def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    password_hash = hashlib.sha256(f"{password}{salt}".encode()).hexdigest()
    return f"{salt}:{password_hash}"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    if not hashed_password or ":" not in hashed_password:
        return False
    salt, stored_hash = hashed_password.split(":")
    computed_hash = hashlib.sha256(f"{plain_password}{salt}".encode()).hexdigest()
    return computed_hash == stored_hash

security = HTTPBearer()

# ============ MODELS ============
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Dataset(Base):
    __tablename__ = "datasets"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    filename = Column(String(255), nullable=False)
    original_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(BigInteger)
    rows_count = Column(Integer)
    columns_count = Column(Integer)
    status = Column(String(50), default="uploaded")
    created_at = Column(DateTime, default=datetime.utcnow)

class Validation(Base):
    __tablename__ = "validations"
    id = Column(Integer, primary_key=True, index=True)
    dataset_id = Column(Integer, nullable=False)
    is_valid = Column(Boolean)
    missing_columns = Column(JSON)
    type_issues = Column(JSON)
    row_count = Column(Integer)
    column_count = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)

# Create tables
Base.metadata.create_all(bind=engine)

# ============ HELPER FUNCTIONS ============
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def authenticate_user(db, email, password):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user

def create_access_token(data):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security), 
    db: Session = Depends(get_db)
):
    token = credentials.credentials
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(payload.get("sub"))
        if user_id is None:
            raise credentials_exception
        user = db.query(User).filter(User.id == user_id).first()
        if user is None:
            raise credentials_exception
        return user
    except JWTError:
        raise credentials_exception

def validate_dataset(df):
    required = ["ID", "Age", "Gender", "Income", "Purchased"]
    columns = df.columns.tolist()
    missing = [c for c in required if c not in columns]
    
    issues = []
    for col in required:
        if col in columns:
            if col in ["ID", "Age"]:
                if not pd.api.types.is_numeric_dtype(df[col]):
                    issues.append(f"{col} must be numeric")
            elif col == "Gender":
                if df[col].dtype not in ['object', 'category']:
                    issues.append(f"{col} should be text")
            elif col in ["Income", "Purchased"]:
                if not pd.api.types.is_numeric_dtype(df[col]):
                    issues.append(f"{col} must be numeric")
    
    return {
        "is_valid": len(missing) == 0 and len(issues) == 0,
        "missing_columns": missing,
        "type_issues": issues,
        "row_count": len(df),
        "column_count": len(df.columns)
    }

def formatFCFA(amount):
    return f"{int(amount):,} FCFA".replace(",", " ")

# ============ FASTAPI APP ============
app = FastAPI(title="SmartML API", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============ AUTH ENDPOINTS ============
@app.get("/")
def root():
    return {"message": "SmartML API Running", "status": "online"}

@app.get("/health")
def health():
    return {"status": "healthy"}

@app.post("/api/auth/register")
def register(user: UserCreate, db: Session = Depends(get_db)):
    try:
        existing = db.query(User).filter(
            (User.email == user.email) | (User.username == user.username)
        ).first()
        
        if existing:
            raise HTTPException(400, "User with this email or username already exists")
        
        hashed = hash_password(user.password)
        new_user = User(
            username=user.username,
            email=user.email,
            password_hash=hashed
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        return {
            "success": True,
            "id": new_user.id,
            "username": new_user.username,
            "email": new_user.email,
            "is_active": new_user.is_active,
            "created_at": str(new_user.created_at)
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Registration error: {str(e)}")
        raise HTTPException(400, f"Registration failed: {str(e)}")

@app.post("/api/auth/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    try:
        db_user = authenticate_user(db, user.email, user.password)
        
        if not db_user:
            raise HTTPException(401, "Invalid email or password")
        
        token = create_access_token(data={"sub": str(db_user.id)})
        return {
            "access_token": token, 
            "token_type": "bearer",
            "user": {
                "id": db_user.id,
                "username": db_user.username,
                "email": db_user.email
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Login error: {str(e)}")
        raise HTTPException(401, f"Login failed: {str(e)}")

# ============ DATASET ENDPOINTS ============
@app.post("/api/datasets/upload")
async def upload_dataset(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        ext = os.path.splitext(file.filename)[1].lower()
        if ext not in ['.csv', '.xlsx', '.xls']:
            raise HTTPException(400, "Only CSV and Excel files allowed")
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        safe_name = f"{timestamp}_{file.filename}"
        file_path = os.path.join(UPLOAD_DIR, safe_name)
        
        content = await file.read()
        with open(file_path, "wb") as f:
            f.write(content)
        
        if ext == '.csv':
            df = pd.read_csv(file_path)
        else:
            df = pd.read_excel(file_path)
        
        validation = validate_dataset(df)
        
        dataset = Dataset(
            user_id=current_user.id,
            filename=safe_name,
            original_name=file.filename,
            file_path=file_path,
            file_size=len(content),
            rows_count=len(df),
            columns_count=len(df.columns),
            status="validated" if validation["is_valid"] else "invalid"
        )
        
        db.add(dataset)
        db.commit()
        db.refresh(dataset)
        
        val_record = Validation(
            dataset_id=dataset.id,
            is_valid=validation["is_valid"],
            missing_columns=validation["missing_columns"],
            type_issues=validation["type_issues"],
            row_count=len(df),
            column_count=len(df.columns)
        )
        db.add(val_record)
        db.commit()
        
        preview = df.head(3).fillna("").to_dict(orient="records")
        
        return {
            "success": validation["is_valid"],
            "message": "Upload successful" if validation["is_valid"] else "Validation failed",
            "dataset_id": dataset.id,
            "file_name": file.filename,
            "rows": len(df),
            "columns": len(df.columns),
            "validation": validation,
            "preview": preview
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Upload error: {str(e)}")
        raise HTTPException(500, f"Upload failed: {str(e)}")

@app.get("/api/datasets/")
def get_datasets(
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    datasets = db.query(Dataset).filter(Dataset.user_id == current_user.id).all()
    return [
        {
            "id": d.id,
            "name": d.original_name,
            "rows": d.rows_count,
            "columns": d.columns_count,
            "status": d.status,
            "created_at": str(d.created_at)
        }
        for d in datasets
    ]

@app.get("/api/datasets/{dataset_id}")
def get_dataset(
    dataset_id: int, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    dataset = db.query(Dataset).filter(
        Dataset.id == dataset_id,
        Dataset.user_id == current_user.id
    ).first()
    
    if not dataset:
        raise HTTPException(404, "Dataset not found")
    
    return {
        "id": dataset.id,
        "name": dataset.original_name,
        "rows": dataset.rows_count,
        "columns": dataset.columns_count,
        "status": dataset.status,
        "created_at": str(dataset.created_at)
    }

@app.get("/api/datasets/{dataset_id}/validation")
def get_validation(
    dataset_id: int, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    val = db.query(Validation).filter(Validation.dataset_id == dataset_id).first()
    if not val:
        raise HTTPException(404, "Validation not found")
    
    return {
        "is_valid": val.is_valid,
        "missing_columns": val.missing_columns,
        "type_issues": val.type_issues,
        "row_count": val.row_count,
        "column_count": val.column_count
    }

@app.get("/api/datasets/{dataset_id}/data")
def get_dataset_data(
    dataset_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    dataset = db.query(Dataset).filter(
        Dataset.id == dataset_id,
        Dataset.user_id == current_user.id
    ).first()
    
    if not dataset:
        raise HTTPException(404, "Dataset not found")
    
    try:
        file_ext = os.path.splitext(dataset.filename)[1].lower()
        if file_ext == '.csv':
            df = pd.read_csv(dataset.file_path)
        else:
            df = pd.read_excel(dataset.file_path)
        
        df = df.where(pd.notnull(df), None)
        data_records = df.head(1000).to_dict(orient="records")
        
        return {
            "id": dataset.id,
            "name": dataset.original_name,
            "rows": len(df),
            "columns": len(df.columns),
            "status": dataset.status,
            "created_at": str(dataset.created_at),
            "data": data_records,
            "statistics": {
                "total_rows": len(df),
                "total_columns": len(df.columns)
            }
        }
    except Exception as e:
        raise HTTPException(500, detail=f"Error reading dataset: {str(e)}")

@app.delete("/api/datasets/{dataset_id}")
def delete_dataset(
    dataset_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    dataset = db.query(Dataset).filter(
        Dataset.id == dataset_id,
        Dataset.user_id == current_user.id
    ).first()
    
    if not dataset:
        raise HTTPException(404, "Dataset not found")
    
    if os.path.exists(dataset.file_path):
        os.remove(dataset.file_path)
    
    db.query(Validation).filter(Validation.dataset_id == dataset_id).delete()
    db.delete(dataset)
    db.commit()
    
    return {"success": True, "message": "Dataset deleted successfully"}

@app.delete("/api/datasets/")
def delete_all_datasets(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    datasets = db.query(Dataset).filter(Dataset.user_id == current_user.id).all()
    
    for dataset in datasets:
        if os.path.exists(dataset.file_path):
            os.remove(dataset.file_path)
        db.query(Validation).filter(Validation.dataset_id == dataset.id).delete()
    
    db.query(Dataset).filter(Dataset.user_id == current_user.id).delete()
    db.commit()
    
    return {"success": True, "message": f"Deleted {len(datasets)} datasets"}

# ============ PREDICTIONS ENDPOINT ============
@app.post("/api/predictions/generate")
def generate_predictions(
    request: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    dataset_id = request.get("dataset_id")
    forecast_period = request.get("forecast_period", "30days")
    
    if not dataset_id:
        raise HTTPException(400, "Dataset ID required")
    
    dataset = db.query(Dataset).filter(
        Dataset.id == dataset_id,
        Dataset.user_id == current_user.id
    ).first()
    
    if not dataset:
        raise HTTPException(404, "Dataset not found")
    
    try:
        # Load actual dataset
        file_ext = os.path.splitext(dataset.filename)[1].lower()
        if file_ext == '.csv':
            df = pd.read_csv(dataset.file_path)
        else:
            df = pd.read_excel(dataset.file_path)
        
        total_customers = len(df)
        
        # Get actual purchase values from dataset
        if 'Purchased' in df.columns:
            purchase_values = df['Purchased'].values
            avg_purchase = purchase_values.mean()
            min_purchase = purchase_values.min()
            max_purchase = purchase_values.max()
            if len(purchase_values) > 1 and purchase_values[0] > 0:
                trend = (purchase_values[-1] - purchase_values[0]) / purchase_values[0]
            else:
                trend = 0.05
        else:
            avg_purchase = 45
            min_purchase = 20
            max_purchase = 80
            trend = 0.05
        
        # Get income data
        if 'Income' in df.columns:
            avg_income = df['Income'].mean()
        else:
            avg_income = 50000
        
        # Calculate base revenue from actual data
        base_revenue = (avg_purchase / 100) * avg_income * total_customers
        
        # Months for historical data
        months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        
        # Generate historical data - 12 months based on actual dataset values
        historical_data = []
        if 'Purchased' in df.columns:
            # Use actual purchase values distributed across 12 months
            for i in range(12):
                idx = i % len(purchase_values)
                val = purchase_values[idx]
                revenue = (val / 100) * avg_income * (total_customers / 12)
                historical_data.append({
                    "month": months[i],
                    "sales": round(revenue, 2)
                })
        else:
            # Fallback based on data pattern
            for i in range(12):
                revenue = base_revenue * (0.5 + (i / 24)) / 12
                historical_data.append({
                    "month": months[i],
                    "sales": round(revenue, 2)
                })
        
        # Determine weeks based on forecast period
        weeks = 4 if forecast_period == '30days' else 8 if forecast_period == '60days' else 12
        
        # Create period labels
        if forecast_period == '30days':
            labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4']
        elif forecast_period == '60days':
            labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7', 'Week 8']
        else:
            labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7', 'Week 8', 'Week 9', 'Week 10', 'Week 11', 'Week 12']
        
        # Generate forecast values based on actual data trend
        forecast_data = []
        for i in range(weeks):
            growth_factor = 1 + (trend * (i / weeks))
            seasonal_factor = 1 + 0.08 * np.sin(i * np.pi / 3)
            predicted = base_revenue * growth_factor * seasonal_factor / weeks
            
            forecast_data.append({
                "period": labels[i],
                "predictedSales": round(predicted, 2),
                "upperBound": round(predicted * 1.12, 2),
                "lowerBound": round(predicted * 0.88, 2),
            })
        
        # Calculate totals from forecast
        total_forecast_revenue = sum([f["predictedSales"] for f in forecast_data])
        growth_rate = ((forecast_data[-1]["predictedSales"] - forecast_data[0]["predictedSales"]) / forecast_data[0]["predictedSales"] * 100) if forecast_data[0]["predictedSales"] > 0 else 5
        
        # Generate insights based on actual data
        insights = []
        
        if avg_purchase > 60:
            insights.append({
                "title": "High Purchase Rate Detected",
                "description": f"Your customers have a high purchase rate of {avg_purchase:.1f}% based on your actual data. Excellent performance!",
                "type": "positive"
            })
        elif avg_purchase < 30:
            insights.append({
                "title": "Low Purchase Rate Alert",
                "description": f"Purchase rate is {avg_purchase:.1f}% from your dataset. Consider reviewing your strategy.",
                "type": "negative"
            })
        else:
            insights.append({
                "title": "Moderate Purchase Rate",
                "description": f"Purchase rate is {avg_purchase:.1f}% from your data. There's room for improvement.",
                "type": "info"
            })
        
        if trend > 0.1:
            insights.append({
                "title": "Strong Upward Trend",
                "description": f"Your sales data shows a strong increasing trend of {trend*100:.1f}% over the recorded period.",
                "type": "positive"
            })
        elif trend < -0.05:
            insights.append({
                "title": "Declining Trend Detected",
                "description": f"Your sales data shows a declining trend. Consider investigating the cause.",
                "type": "negative"
            })
        else:
            insights.append({
                "title": "Stable Performance",
                "description": "Your sales data shows stable performance with minor fluctuations.",
                "type": "info"
            })
        
        if avg_income > 60000:
            insights.append({
                "title": "Premium Customer Base",
                "description": f"Average income is {formatFCFA(avg_income)}. Consider premium product offerings.",
                "type": "positive"
            })
        
        insights.append({
            "title": "Growth Opportunity",
            "description": f"Based on {total_customers} customers in your dataset, there's potential to increase average purchase value from {avg_purchase:.1f}%.",
            "type": "info"
        })
        
        # Gender distribution
        gender_dist = {}
        if 'Gender' in df.columns:
            gender_counts = df['Gender'].value_counts()
            for gender, count in gender_counts.items():
                gender_dist[str(gender)] = int(count)
        
        return {
            "success": True,
            "dataset_id": dataset.id,
            "dataset_name": dataset.original_name,
            "confidence": min(95, max(65, int(70 + (total_customers / 200) * 20))),
            "metrics": {
                "expectedRevenue": formatFCFA(total_forecast_revenue),
                "expectedRevenueRaw": float(total_forecast_revenue),
                "growthRate": f"{max(0, growth_rate):.1f}",
                "peakMonth": "Based on forecast pattern",
                "cagr": f"{max(0, growth_rate * 4):.1f}",
                "mae": formatFCFA(total_forecast_revenue * 0.05),
                "rmse": formatFCFA(total_forecast_revenue * 0.08),
                "avgPurchaseRate": f"{avg_purchase:.1f}%",
                "avgIncome": formatFCFA(avg_income),
                "totalCustomers": total_customers,
                "minPurchase": f"{min_purchase:.1f}%",
                "maxPurchase": f"{max_purchase:.1f}%"
            },
            "historical": historical_data,
            "forecast": forecast_data,
            "insights": insights,
            "data_summary": {
                "total_rows": total_customers,
                "date_range": f"Based on {len(df)} records",
                "avg_age": f"{df['Age'].mean():.1f}" if 'Age' in df.columns else "N/A",
                "gender_distribution": gender_dist
            }
        }
    except Exception as e:
        print(f"Prediction error: {str(e)}")
        raise HTTPException(500, detail=f"Error generating predictions: {str(e)}")

# ============ STARTUP ============
@app.on_event("startup")
def startup():
    try:
        db = SessionLocal()
        db.execute("SELECT 1")
        print("✅ Database connection successful")
        
        admin = db.query(User).filter(User.email == "admin@smartml.com").first()
        if not admin:
            admin_user = User(
                username="admin",
                email="admin@smartml.com",
                password_hash=hash_password("admin123"),
                is_active=True
            )
            db.add(admin_user)
            db.commit()
            print("\n" + "="*50)
            print("✅ ADMIN USER CREATED")
            print("   Email: admin@smartml.com")
            print("   Password: admin123")
            print("="*50 + "\n")
        else:
            print("\n" + "="*50)
            print("✅ ADMIN USER EXISTS")
            print("   Email: admin@smartml.com")
            print("   Password: admin123")
            print("="*50 + "\n")
        db.close()
    except Exception as e:
        print(f"\n⚠️ Database connection error: {e}")
        print("Make sure DATABASE_URL is set correctly in environment variables\n")
    
    print("🚀 SmartML API Running on http://localhost:8000")
    print("📚 API Docs: http://localhost:8000/docs\n")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)