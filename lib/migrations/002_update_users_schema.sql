-- Drop existing table and recreate with new schema
DROP TABLE IF EXISTS users CASCADE;

-- Create users table with new schema
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  nama VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'operasional', 'mekanik', 'operator')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert seed users
-- Passwords: admin123, oper123, mekanik123, operator123 (hashed with bcrypt, cost 10)
INSERT INTO users (email, nama, password, role) VALUES
  ('admin@dashboard.com', 'Administrator', '$2b$10$8xcH3A3KSuz6l4w4yhwkUO4wSJ5yWQU0BxZe.8eWKHfoQDJVejj7y', 'admin'),
  ('operasional@dashboard.com', 'Tim Operasional', '$2b$10$uIwtRNw5VRLDxpyT4jKW1emfPePNXvFuMnghE6dFPf3WgeOCwd5JS', 'operasional'),
  ('mekanik@dashboard.com', 'Tim Mekanik', '$2b$10$FgWzwQ5Oka7bAGldLonbW.wbdXTRCBRX3PEhkVwVSIXWgmlL2zWiO', 'mekanik'),
  ('operator@dashboard.com', 'Tim Operator', '$2b$10$Yft5trlHGwZxVZXTZS8awOp0KkSOwdYb/0jvBnUQNPxWBGNd1I2v2', 'operator')
ON CONFLICT (email) DO NOTHING;
