import pandas as pd
import numpy as np
from typing import Dict, List, Any

class DataValidator:
    """Data validation service"""
    
    REQUIRED_COLUMNS = ["ID", "Age", "Gender", "Income", "Purchased"]
    
    @staticmethod
    def validate_file_format(filename: str) -> Dict[str, Any]:
        """Validate file format"""
        allowed_extensions = ['.csv', '.xlsx', '.xls']
        file_ext = filename.lower()
        
        for ext in allowed_extensions:
            if file_ext.endswith(ext):
                return {
                    "is_valid": True,
                    "extension": ext,
                    "message": f"Valid {ext} file"
                }
        
        return {
            "is_valid": False,
            "extension": None,
            "message": f"Invalid format. Use: {', '.join(allowed_extensions)}"
        }
    
    @staticmethod
    def validate_structure(df: pd.DataFrame) -> Dict[str, Any]:
        """Validate dataset structure"""
        columns = df.columns.tolist()
        missing_columns = [col for col in DataValidator.REQUIRED_COLUMNS if col not in columns]
        
        # Check data types
        type_issues = []
        for col in DataValidator.REQUIRED_COLUMNS:
            if col in columns:
                if col in ["ID", "Age"]:
                    if not pd.api.types.is_numeric_dtype(df[col]):
                        type_issues.append(f"{col} should be numeric")
                elif col == "Gender":
                    if not pd.api.types.is_string_dtype(df[col]) and not pd.api.types.is_object_dtype(df[col]):
                        type_issues.append(f"{col} should be text")
                elif col in ["Income", "Purchased"]:
                    if not pd.api.types.is_numeric_dtype(df[col]):
                        type_issues.append(f"{col} should be numeric")
        
        # Check for empty dataframe
        is_empty = df.empty
        
        return {
            "is_valid": len(missing_columns) == 0 and len(type_issues) == 0 and not is_empty,
            "missing_columns": missing_columns,
            "type_issues": type_issues,
            "row_count": len(df),
            "column_count": len(df.columns),
            "columns_found": columns,
            "is_empty": is_empty
        }
    
    @staticmethod
    def get_data_preview(df: pd.DataFrame, rows: int = 5) -> List[Dict]:
        """Get first N rows as preview"""
        return df.head(rows).to_dict(orient="records")
    
    @staticmethod
    def get_basic_statistics(df: pd.DataFrame) -> Dict[str, Any]:
        """Get basic statistics for numerical columns"""
        stats = {}
        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        
        for col in numeric_cols:
            stats[col] = {
                "mean": float(df[col].mean()) if not df[col].isnull().all() else None,
                "median": float(df[col].median()) if not df[col].isnull().all() else None,
                "min": float(df[col].min()) if not df[col].isnull().all() else None,
                "max": float(df[col].max()) if not df[col].isnull().all() else None,
                "std": float(df[col].std()) if not df[col].isnull().all() else None,
                "missing": int(df[col].isnull().sum()),
                "missing_percentage": float((df[col].isnull().sum() / len(df)) * 100)
            }
        
        return stats