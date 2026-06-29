"""Simple launcher for SmartML Backend"""

import uvicorn

if __name__ == "__main__":
    print("🚀 Starting SmartML Backend with MySQL...")
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)