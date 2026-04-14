-- ================================================================
-- COMPLETE REDESIGN: Roles & Laporan Kerusakan System
-- Date: 2026-04-14
-- ================================================================

-- Drop existing tables (CASCADE to drop dependent objects)
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS temuan_rtg CASCADE;

-- Create new users table with 4 roles
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  nama VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_role CHECK (role IN (
    'operasional',
    'peralatan_terminal',
    'perencanaan_persediaan',
    'fasilitas'
  ))
);

-- Insert seed users for each role (password: password123 for all)
INSERT INTO users (email, nama, password, role) VALUES
  ('operasional@tps.com', 'Operasional Team', '$2b$10$jqs7krW7r2aKO2Qt4lb93exuuTXUl0ejWy2hh/dyQadao4wWS8LGq', 'operasional'),
  ('peralatan@tps.com', 'Tim Peralatan Terminal', '$2b$10$jqs7krW7r2aKO2Qt4lb93exuuTXUl0ejWy2hh/dyQadao4wWS8LGq', 'peralatan_terminal'),
  ('perencanaan@tps.com', 'Tim Perencanaan Persediaan', '$2b$10$jqs7krW7r2aKO2Qt4lb93exuuTXUl0ejWy2hh/dyQadao4wWS8LGq', 'perencanaan_persediaan'),
  ('fasilitas@tps.com', 'Tim Fasilitas', '$2b$10$jqs7krW7r2aKO2Qt4lb93exuuTXUl0ejWy2hh/dyQadao4wWS8LGq', 'fasilitas');

-- Create laporan_kerusakan table
CREATE TABLE laporan_kerusakan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rtg_unit_id UUID NOT NULL REFERENCES rtg_units(id) ON DELETE CASCADE,
  dilaporkan_oleh VARCHAR(255) NOT NULL,
  nama_pelapor VARCHAR(255) NOT NULL,
  email_pelapor VARCHAR(255),
  ditugaskan_ke VARCHAR(50) NOT NULL,
  tanggal_laporan DATE NOT NULL,
  waktu_laporan TIME NOT NULL,
  jenis_kerusakan VARCHAR(255) NOT NULL,
  deskripsi TEXT,
  foto_laporan JSONB DEFAULT '[]'::jsonb,
  status_kerusakan VARCHAR(50) NOT NULL DEFAULT 'DIPERIKSA',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_ditugaskan_ke CHECK (ditugaskan_ke IN (
    'peralatan_terminal',
    'perencanaan_persediaan',
    'fasilitas'
  )),
  CONSTRAINT chk_status_kerusakan CHECK (status_kerusakan IN (
    'DIPERIKSA',
    'DITINDAKLANJUTI',
    'SELESAI'
  ))
);

-- Create indexes for laporan_kerusakan
CREATE INDEX idx_laporan_kerusakan_tanggal ON laporan_kerusakan(tanggal_laporan DESC);
CREATE INDEX idx_laporan_kerusakan_status ON laporan_kerusakan(status_kerusakan);
CREATE INDEX idx_laporan_kerusakan_ditugaskan ON laporan_kerusakan(ditugaskan_ke);

-- Create penindaklanjut_kerusakan table
CREATE TABLE penindaklanjut_kerusakan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  laporan_kerusakan_id UUID NOT NULL REFERENCES laporan_kerusakan(id) ON DELETE CASCADE,
  ditangani_oleh_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tanggal_selesai DATE NOT NULL,
  deskripsi_tindakan TEXT NOT NULL,
  foto_bukti JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for penindaklanjut_kerusakan
CREATE INDEX idx_penindaklanjut_laporan ON penindaklanjut_kerusakan(laporan_kerusakan_id);
CREATE INDEX idx_penindaklanjut_penangan ON penindaklanjut_kerusakan(ditangani_oleh_id);
