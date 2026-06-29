export interface User {
  id: number;
  username: string;
  email: string;
  is_active: boolean;
  created_at: string;
}

export interface Dataset {
  id: number;
  filename: string;
  original_name: string;
  file_size: number;
  rows_count: number;
  columns_count: number;
  status: string;
  created_at: string;
}

export interface Validation {
  id: number;
  dataset_id: number;
  is_valid: boolean;
  missing_columns: string[];
  type_issues: string[];
  row_count: number;
  column_count: number;
}

export interface Model {
  id: number;
  model_name: string;
  model_type: string;
  algorithm: string;
  accuracy: number | null;
  created_at: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
}