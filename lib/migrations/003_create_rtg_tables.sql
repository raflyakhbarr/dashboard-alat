-- Create RTG Groups table
CREATE TABLE IF NOT EXISTS rtg_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_group VARCHAR(255) UNIQUE NOT NULL,
  deskripsi TEXT,
  lokasi VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create RTG Units table
CREATE TABLE IF NOT EXISTS rtg_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kode_rtg VARCHAR(255) UNIQUE NOT NULL,
  nama_rtg VARCHAR(255) NOT NULL,
  group_rtg_id UUID REFERENCES rtg_groups(id) ON DELETE SET NULL,
  kapasitas INTEGER,
  tahun_pembuatan INTEGER,
  manufacturer VARCHAR(255),
  spesifikasi TEXT,
  status_kondisi VARCHAR(50) NOT NULL DEFAULT 'READY' CHECK (status_kondisi IN ('READY', 'READY_CATATAN_RINGAN', 'READY_CATATAN_BERAT', 'TIDAK_READY')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_rtg_units_kode ON rtg_units(kode_rtg);
CREATE INDEX idx_rtg_units_status ON rtg_units(status_kondisi);
CREATE INDEX idx_rtg_units_group ON rtg_units(group_rtg_id);

-- Insert sample RTG Groups
INSERT INTO rtg_groups (nama_group, deskripsi, lokasi) VALUES
  ('Group A', 'RTG Group A - Terminal 1', 'Terminal 1, Block A'),
  ('Group B', 'RTG Group B - Terminal 2', 'Terminal 2, Block B'),
  ('Group C', 'RTG Group C - Terminal 3', 'Terminal 3, Block C')
ON CONFLICT (nama_group) DO NOTHING;

-- Insert sample RTG Units (password untuk demo: rtg123)
INSERT INTO rtg_units (kode_rtg, nama_rtg, group_rtg_id, kapasitas, tahun_pembuatan, manufacturer, spesifikasi, status_kondisi)
SELECT
  'RTG-001',
  'RTG A1',
  (SELECT id FROM rtg_groups WHERE nama_group = 'Group A' LIMIT 1),
  40,
  2020,
  'Konecranes',
  'Rubber Tyred Gantry Crane - Single Trolley',
  'READY'
UNION ALL
SELECT
  'RTG-002',
  'RTG A2',
  (SELECT id FROM rtg_groups WHERE nama_group = 'Group A' LIMIT 1),
  40,
  2020,
  'Konecranes',
  'Rubber Tyred Gantry Crane - Single Trolley',
  'READY'
UNION ALL
SELECT
  'RTG-003',
  'RTG B1',
  (SELECT id FROM rtg_groups WHERE nama_group = 'Group B' LIMIT 1),
  45,
  2021,
  'Liebherr',
  'Rubber Tyred Gantry Crane - Twin Lift',
  'READY_CATATAN_RINGAN'
UNION ALL
SELECT
  'RTG-004',
  'RTG B2',
  (SELECT id FROM rtg_groups WHERE nama_group = 'Group B' LIMIT 1),
  45,
  2021,
  'Liebherr',
  'Rubber Tyred Gantry Crane - Twin Lift',
  'READY'
UNION ALL
SELECT
  'RTG-005',
  'RTG C1',
  (SELECT id FROM rtg_groups WHERE nama_group = 'Group C' LIMIT 1),
  50,
  2019,
  'Noell',
  'Rubber Tyred Gantry Crane - Heavy Duty',
  'TIDAK_READY'
ON CONFLICT (kode_rtg) DO NOTHING;
