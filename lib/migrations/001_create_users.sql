-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'operasional', 'mekanik')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert seed users
-- Passwords: admin123, oper123, mekanik123 (hashed with bcrypt, cost 10)
INSERT INTO users (username, password, role) VALUES
  ('admin', '$2b$10$nY0e6b3F6PqkAtT8C5.gO.XFgFvnZAF.IYNiTnkGHRicS0OI70KWq', 'admin'),
  ('operasional', '$2b$10$w2ie9.HLO2pLe49McYHdtuCa0.lRD0SPyHilIIXKcfgbUETQIlxB.', 'operasional'),
  ('mekanik', '$2b$10$9iQQNfbd.j/xJsWV1hTDU.nXxWyYHRqCsnbBmLo4RHVYegLyMU9Hi', 'mekanik')
ON CONFLICT (username) DO NOTHING;
