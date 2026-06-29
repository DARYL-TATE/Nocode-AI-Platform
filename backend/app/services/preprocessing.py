import pandas as pd
import numpy as np
from typing import Dict, Any, List, Optional

class DataPreprocessor:
    """Complete data preprocessing service for FR3 and FR4"""
    
    @staticmethod
    def handle_missing_values(df: pd.DataFrame, strategy: str = "auto") -> pd.DataFrame:
        """
        FR3: Handle missing values
        Strategies: auto, drop, mean, median, mode, constant
        """
        df_clean = df.copy()
        missing_report = {}
        
        for col in df_clean.columns:
            if df_clean[col].isnull().sum() > 0:
                missing_count = df_clean[col].isnull().sum()
                
                if strategy == "auto":
                    # Auto-select strategy based on column type
                    if pd.api.types.is_numeric_dtype(df_clean[col]):
                        # For numeric columns, use median
                        df_clean[col].fillna(df_clean[col].median(), inplace=True)
                        strategy_used = "median"
                    else:
                        # For categorical, use mode
                        mode_val = df_clean[col].mode()
                        if len(mode_val) > 0:
                            df_clean[col].fillna(mode_val[0], inplace=True)
                            strategy_used = "mode"
                        else:
                            df_clean[col].fillna("Unknown", inplace=True)
                            strategy_used = "constant"
                elif strategy == "drop":
                    df_clean.dropna(subset=[col], inplace=True)
                    strategy_used = "drop"
                elif strategy == "mean" and pd.api.types.is_numeric_dtype(df_clean[col]):
                    df_clean[col].fillna(df_clean[col].mean(), inplace=True)
                    strategy_used = "mean"
                elif strategy == "median" and pd.api.types.is_numeric_dtype(df_clean[col]):
                    df_clean[col].fillna(df_clean[col].median(), inplace=True)
                    strategy_used = "median"
                else:
                    df_clean[col].fillna(0, inplace=True)
                    strategy_used = "constant"
                
                missing_report[col] = {
                    "missing_count": int(missing_count),
                    "strategy_used": strategy_used,
                    "remaining_missing": int(df_clean[col].isnull().sum())
                }
        
        return df_clean, missing_report
    
    @staticmethod
    def remove_duplicates(df: pd.DataFrame) -> pd.DataFrame:
        """FR3: Remove duplicate records"""
        df_clean = df.copy()
        initial_count = len(df_clean)
        
        # Check for duplicates based on all columns
        df_clean.drop_duplicates(inplace=True)
        
        # Also check for duplicates based on ID column if exists
        if 'ID' in df_clean.columns:
            df_clean.drop_duplicates(subset=['ID'], keep='first', inplace=True)
        
        duplicates_removed = initial_count - len(df_clean)
        
        return df_clean, {
            "duplicates_removed": duplicates_removed,
            "initial_rows": initial_count,
            "final_rows": len(df_clean)
        }
    
    @staticmethod
    def standardize_formats(df: pd.DataFrame) -> pd.DataFrame:
        """FR4: Standardize inconsistent data formats"""
        df_std = df.copy()
        format_report = {}
        
        # Standardize date columns
        date_columns = df_std.select_dtypes(include=['datetime64']).columns.tolist()
        for col in date_columns:
            df_std[col] = pd.to_datetime(df_std[col], errors='coerce')
            format_report[col] = "converted to datetime"
        
        # Try to convert string numbers to numeric
        for col in df_std.columns:
            if df_std[col].dtype == 'object':
                # Try to convert to numeric
                try:
                    # Remove currency symbols and commas
                    cleaned = df_std[col].astype(str).str.replace('[$£€,]', '', regex=True)
                    numeric = pd.to_numeric(cleaned, errors='coerce')
                    if numeric.notna().sum() > len(df_std) * 0.8:  # If >80% can be converted
                        df_std[col] = numeric
                        format_report[col] = "converted to numeric"
                except:
                    pass
                
                # Standardize text columns
                if df_std[col].dtype == 'object':
                    df_std[col] = df_std[col].astype(str).str.strip().str.title()
                    format_report[col] = "text standardized"
        
        # Standardize categorical values
        if 'Gender' in df_std.columns:
            gender_map = {
                'm': 'Male', 'male': 'Male', 'M': 'Male',
                'f': 'Female', 'female': 'Female', 'F': 'Female'
            }
            df_std['Gender'] = df_std['Gender'].map(gender_map).fillna(df_std['Gender'])
            format_report['Gender'] = "categorical standardized"
        
        return df_std, format_report
    
    @staticmethod
    def convert_data_types(df: pd.DataFrame) -> pd.DataFrame:
        """FR4: Automatic conversion and standardization of data types"""
        df_converted = df.copy()
        type_conversions = {}
        
        for col in df_converted.columns:
            original_type = str(df_converted[col].dtype)
            
            # Convert to numeric if possible
            if df_converted[col].dtype == 'object':
                try:
                    # Check if all values can be numeric
                    numeric_series = pd.to_numeric(df_converted[col], errors='coerce')
                    if numeric_series.notna().sum() > len(df_converted) * 0.9:
                        df_converted[col] = numeric_series
                        type_conversions[col] = f"{original_type} → {df_converted[col].dtype}"
                except:
                    pass
            
            # Convert to category for low cardinality strings
            if df_converted[col].dtype == 'object':
                unique_count = df_converted[col].nunique()
                if unique_count < len(df_converted) * 0.1 and unique_count < 50:
                    df_converted[col] = df_converted[col].astype('category')
                    type_conversions[col] = f"{original_type} → category"
        
        return df_converted, type_conversions
    
    @staticmethod
    def full_preprocessing_pipeline(df: pd.DataFrame) -> Dict[str, Any]:
        """Run complete preprocessing pipeline for FR3 and FR4"""
        
        # Step 1: Handle missing values
        df_cleaned, missing_report = DataPreprocessor.handle_missing_values(df)
        
        # Step 2: Remove duplicates
        df_cleaned, duplicate_report = DataPreprocessor.remove_duplicates(df_cleaned)
        
        # Step 3: Standardize formats
        df_cleaned, format_report = DataPreprocessor.standardize_formats(df_cleaned)
        
        # Step 4: Convert data types
        df_cleaned, type_conversions = DataPreprocessor.convert_data_types(df_cleaned)
        
        return {
            "success": True,
            "original_shape": df.shape,
            "cleaned_shape": df_cleaned.shape,
            "missing_values_report": missing_report,
            "duplicates_report": duplicate_report,
            "format_standardization": format_report,
            "type_conversions": type_conversions,
            "cleaned_data": df_cleaned
        }