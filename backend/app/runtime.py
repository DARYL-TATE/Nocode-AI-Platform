from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get the DATABASE_URL
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("❌ DATABASE_URL not found in .env file")
    exit(1)

print("=" * 50)
print("🔍 Testing Supabase PostgreSQL Connection")
print("=" * 50)

# Hide password in output for security
safe_url = DATABASE_URL.split('@')[0].replace(DATABASE_URL.split(':')[2], '****') + '@' + DATABASE_URL.split('@')[1]
print(f"📡 Connection URL: {safe_url}")

try:
    # Create engine
    engine = create_engine(DATABASE_URL)
    
    # Test connection and get database info
    with engine.connect() as conn:
        # Check current database
        result = conn.execute(text("SELECT current_database()"))
        current_db = result.fetchone()[0]
        print(f"✅ Connected to database: {current_db}")
        
        # Check PostgreSQL version
        result = conn.execute(text("SELECT version()"))
        version = result.fetchone()[0]
        print(f"✅ PostgreSQL version: {version.split(',')[0]}")
        
        # List all databases
        result = conn.execute(text("SELECT datname FROM pg_database WHERE datistemplate = false"))
        databases = [row[0] for row in result.fetchall()]
        print(f"\n📁 Available databases:")
        for db in databases:
            print(f"   - {db}")
        
        # Check if your database exists
        target_db = DATABASE_URL.split('/')[-1]  # Get database name from URL
        if target_db in databases:
            print(f"\n✅ Database '{target_db}' exists!")
            
            # Count tables in the database
            result = conn.execute(text("""
                SELECT COUNT(*) FROM information_schema.tables 
                WHERE table_schema NOT IN ('information_schema', 'pg_catalog')
            """))
            table_count = result.fetchone()[0]
            print(f"   📊 Number of tables: {table_count}")
            
            # List tables if any exist
            if table_count > 0:
                result = conn.execute(text("""
                    SELECT table_name FROM information_schema.tables 
                    WHERE table_schema NOT IN ('information_schema', 'pg_catalog')
                    ORDER BY table_name
                """))
                tables = [row[0] for row in result.fetchall()]
                print(f"   📋 Tables: {', '.join(tables)}")
        else:
            print(f"\n❌ Database '{target_db}' does NOT exist!")
            print("   Available databases:", databases)
            
except Exception as e:
    print(f"\n❌ Connection failed: {e}")
    print("\n📌 Troubleshooting tips:")
    print("   1. Check your DATABASE_URL in .env file")
    print("   2. Verify Supabase project is not paused")
    print("   3. Check if the database name is correct")
    print("   4. Ensure your password is correct")

print("\n" + "=" * 50)