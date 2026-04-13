-- Create temuan_rtg table
CREATE TABLE IF NOT EXISTS temuan_rtg (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rtg_unit_id UUID NOT NULL REFERENCES rtg_units(id) ON DELETE CASCADE,
  pelapor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tanggal_temuan DATE NOT NULL,
  waktu_temuan TIME NOT NULL,
  jenis_temuan VARCHAR(255) NOT NULL,
  deskripsi_temuan TEXT,
  foto JSONB DEFAULT '[]'::jsonb,
  status_temuan VARCHAR(50) NOT NULL DEFAULT 'DIPERIKSA',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_temuan_rtg_tanggal ON temuan_rtg(tanggal_temuan DESC);
CREATE INDEX IF NOT EXISTS idx_temuan_rtg_status ON temuan_rtg(status_temuan);
CREATE INDEX IF NOT EXISTS idx_temuan_rtg_pelapor ON temuan_rtg(pelapor_id);

-- Add check constraint for status_temuan
ALTER TABLE temuan_rtg ADD CONSTRAINT chk_status_temuan
  CHECK (status_temuan IN ('DIPERIKSA', 'DITINDAKLANJUTI', 'SELESAI', 'DITUTUP'));
