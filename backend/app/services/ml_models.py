import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.linear_model import LinearRegression, LogisticRegression
from sklearn.cluster import KMeans
from sklearn.metrics import accuracy_score, r2_score, mean_squared_error
import joblib
import os
from typing import Dict, Any, Tuple, Optional
from ..config import settings

class MLModelService:
    """Complete ML model service for FR8"""
    
    @staticmethod
    def prepare_data(df: pd.DataFrame, target_column: str, problem_type: str = "regression"):
        """Prepare data for model training"""
        # Separate features and target
        if target_column not in df.columns:
            raise ValueError(f"Target column '{target_column}' not found in dataset")
        
        X = df.drop(columns=[target_column])
        y = df[target_column]
        
        # Handle categorical variables
        X = pd.get_dummies(X, drop_first=True)
        
        # Handle missing values
        X = X.fillna(X.mean())
        y = y.fillna(y.mean() if problem_type == "regression" else y.mode()[0])
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )
        
        return {
            "X_train": X_train,
            "X_test": X_test,
            "y_train": y_train,
            "y_test": y_test,
            "feature_names": X.columns.tolist(),
            "target_name": target_column
        }
    
    @staticmethod
    def train_linear_regression(df: pd.DataFrame, target_column: str) -> Dict[str, Any]:
        """Train linear regression model (FR8)"""
        try:
            data = MLModelService.prepare_data(df, target_column, "regression")
            
            model = LinearRegression()
            model.fit(data["X_train"], data["y_train"])
            
            # Make predictions
            y_pred = model.predict(data["X_test"])
            
            # Calculate metrics
            r2 = r2_score(data["y_test"], y_pred)
            mse = mean_squared_error(data["y_test"], y_pred)
            rmse = np.sqrt(mse)
            
            # Save model
            model_path = os.path.join(settings.MODEL_DIR, f"linear_regression_{target_column}.joblib")
            os.makedirs(settings.MODEL_DIR, exist_ok=True)
            joblib.dump(model, model_path)
            
            return {
                "success": True,
                "model_type": "linear_regression",
                "target_column": target_column,
                "metrics": {
                    "r2_score": float(r2),
                    "mse": float(mse),
                    "rmse": float(rmse)
                },
                "feature_importance": dict(zip(data["feature_names"], model.coef_.tolist())),
                "model_path": model_path
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    @staticmethod
    def train_random_forest(df: pd.DataFrame, target_column: str, problem_type: str = "regression") -> Dict[str, Any]:
        """Train Random Forest model for classification or regression"""
        try:
            data = MLModelService.prepare_data(df, target_column, problem_type)
            
            if problem_type == "classification":
                model = RandomForestClassifier(n_estimators=100, random_state=42)
                model.fit(data["X_train"], data["y_train"])
                y_pred = model.predict(data["X_test"])
                accuracy = accuracy_score(data["y_test"], y_pred)
                main_metric = accuracy
                metric_name = "accuracy"
            else:
                model = RandomForestRegressor(n_estimators=100, random_state=42)
                model.fit(data["X_train"], data["y_train"])
                y_pred = model.predict(data["X_test"])
                r2 = r2_score(data["y_test"], y_pred)
                main_metric = r2
                metric_name = "r2_score"
            
            # Save model
            model_path = os.path.join(settings.MODEL_DIR, f"random_forest_{target_column}.joblib")
            os.makedirs(settings.MODEL_DIR, exist_ok=True)
            joblib.dump(model, model_path)
            
            return {
                "success": True,
                "model_type": "random_forest",
                "problem_type": problem_type,
                "target_column": target_column,
                "metrics": {
                    metric_name: float(main_metric)
                },
                "feature_importance": dict(zip(data["feature_names"], model.feature_importances_.tolist())),
                "model_path": model_path
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    @staticmethod
    def make_prediction(model_path: str, input_data: pd.DataFrame) -> np.ndarray:
        """Make predictions using saved model"""
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model not found at {model_path}")
        
        model = joblib.load(model_path)
        predictions = model.predict(input_data)
        return predictions