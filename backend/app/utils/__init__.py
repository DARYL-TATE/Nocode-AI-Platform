"""
Utility Functions for SmartML
Helper functions for file handling, data processing, etc.
"""

from .file_handlers import FileHandler

__all__ = [
    "FileHandler"
]

# Utility functions registry
UTILS = {
    "file_handler": FileHandler
}

def get_utility(utility_name: str):
    """Get a utility by name"""
    if utility_name in UTILS:
        return UTILS[utility_name]
    raise ValueError(f"Utility '{utility_name}' not found")