from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from .config import settings

# Create MySQL engine
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,  # Enable connection pool health checking
    pool_recycle=3600,   # Recycle connections every hour
    echo=False           # Set to True to see SQL queries
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
    """Create database if it doesn't exist"""
    from sqlalchemy import text
    try:
        # Create engine without database
        temp_engine = create_engine(
            f"mysql+pymysql://{settings.MYSQL_USER}:{settings.MYSQL_PASSWORD}@{settings.MYSQL_HOST}:{settings.MYSQL_PORT}",
            pool_pre_ping=True
        )
        with temp_engine.connect() as conn:
            conn.execute(text(f"CREATE DATABASE IF NOT EXISTS {settings.MYSQL_DATABASE}"))
            conn.commit()
        temp_engine.dispose()
        print(f"✅ Database '{settings.MYSQL_DATABASE}' ready")
    except Exception as e:
        print(f"⚠️ Database creation warning: {e}")