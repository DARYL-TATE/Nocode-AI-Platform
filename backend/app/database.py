from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from .config import settings

# ============ POSTGRESQL DATABASE ENGINE ============
# Create PostgreSQL engine for Supabase/Render
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,      # Enable connection pool health checking
    pool_recycle=3600,       # Recycle connections every hour
    pool_size=5,             # Number of connections to keep in pool
    max_overflow=10,         # Maximum overflow connections
    echo=False               # Set to True to see SQL queries
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    """Dependency to get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def create_database_if_not_exists():
    """Check if database connection works"""
    from sqlalchemy import text
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        print("✅ Database connection successful")
    except Exception as e:
        print(f"⚠️ Database connection warning: {e}")