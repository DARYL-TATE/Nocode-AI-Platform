-- SmartML Database Setup for MySQL Workbench
-- Run this in MySQL Workbench to create the database

-- Create database
CREATE DATABASE IF NOT EXISTS smartml_db;
USE smartml_db;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_username (username)
);

-- Datasets table
CREATE TABLE IF NOT EXISTS datasets (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT,
    rows_count INT,
    columns_count INT,
    status VARCHAR(50) DEFAULT 'uploaded',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Validations table
CREATE TABLE IF NOT EXISTS validations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    dataset_id INT NOT NULL,
    is_valid BOOLEAN DEFAULT FALSE,
    missing_columns JSON,
    type_issues JSON,
    range_issues JSON,
    row_count INT,
    column_count INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_dataset_id (dataset_id),
    FOREIGN KEY (dataset_id) REFERENCES datasets(id) ON DELETE CASCADE
);

-- Models table
CREATE TABLE IF NOT EXISTS models (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    dataset_id INT NOT NULL,
    model_name VARCHAR(100),
    model_type VARCHAR(50),
    algorithm VARCHAR(50),
    parameters JSON,
    accuracy FLOAT,
    file_path VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_dataset_id (dataset_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (dataset_id) REFERENCES datasets(id) ON DELETE CASCADE
);

-- Predictions table
CREATE TABLE IF NOT EXISTS predictions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    model_id INT NOT NULL,
    dataset_id INT NOT NULL,
    predictions JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_model_id (model_id),
    INDEX idx_dataset_id (dataset_id),
    FOREIGN KEY (model_id) REFERENCES models(id) ON DELETE CASCADE,
    FOREIGN KEY (dataset_id) REFERENCES datasets(id) ON DELETE CASCADE
);

-- Show all tables
SHOW TABLES;

-- Insert default admin user (password: admin123)
INSERT INTO users (username, email, password_hash) 
SELECT 'admin', 'admin@smartml.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/Lewd5jYFQlQyYK7Ai'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@smartml.com');

-- Verify admin user
SELECT id, username, email, is_active, created_at FROM users;