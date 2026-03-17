-- Mini CompliHR Database Migration
-- Creates the users table for authentication

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'employee' CHECK (role IN ('admin', 'employee')),
    branch_id INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Create index on role for role-based queries
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Create index on branch_id for branch-based queries
CREATE INDEX IF NOT EXISTS idx_users_branch_id ON users(branch_id);

-- Insert default admin user (password: admin123)
-- IMPORTANT: Change this password in production!
INSERT INTO users (name, email, password, role)
VALUES (
    'System Admin',
    'admin@minicomplihr.com',
    '$2b$10$KIXxZJz8Q9kF5h5h5h5h5uO5v5v5v5v5v5v5v5v5v5v5v5v5v5v5v',
    'admin'
)
ON CONFLICT (email) DO NOTHING;

-- Note: The above password hash is a placeholder. 
-- Use the register endpoint to create actual users with proper bcrypt hashing.
