"""
API Routes for SmartML
"""

from .auth import router as auth_router
from .datasets import router as datasets_router

# Export all routers
__all__ = ["auth_router", "datasets_router"]

# List of available routes
routes_list = [
    {"prefix": "/api/auth", "tags": ["authentication"]},
    {"prefix": "/api/datasets", "tags": ["datasets"]},
]

def get_all_routers():
    """Return list of all routers for main app inclusion"""
    return [
        auth_router,
        datasets_router,
    ]