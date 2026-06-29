"""
Service Layer for SmartML
Contains business logic and data processing
"""

from .data_validation import DataValidator
from .preprocessing import DataPreprocessor
from .ml_models import MLModelService

__all__ = [
    "DataValidator",
    "DataPreprocessor", 
    "MLModelService"
]

# Service registry
SERVICES = {
    "validator": DataValidator,
    "preprocessor": DataPreprocessor,
    "ml_models": MLModelService
}

def get_service(service_name: str):
    """Get a service by name"""
    if service_name in SERVICES:
        return SERVICES[service_name]
    raise ValueError(f"Service '{service_name}' not found")