-- Employee Management Module Migration
-- Extends users table with employee_details for additional employee information

-- Create employee_details table (optional, for extended employee info)
CREATE TABLE IF NOT EXISTS employee_details (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    phone VARCHAR(50),
    address TEXT,
    date_of_birth DATE,
    joining_date DATE DEFAULT CURRENT_DATE,
    department VARCHAR(100),
    designation VARCHAR(100),
    salary DECIMAL(10, 2),
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_employee_details_user_id ON employee_details(user_id);

-- Create index on department for filtering
CREATE INDEX IF NOT EXISTS idx_employee_details_department ON employee_details(department);

-- Add updated_at trigger for users table
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add updated_at trigger for employee_details table
CREATE TRIGGER update_employee_details_updated_at
    BEFORE UPDATE ON employee_details
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
