-- Migration: Rename ditugaskan_ke to penindak_lanjut
-- Purpose: Update column name from ditugaskan_ke to penindak_lanjut in laporan_kerusakan table

-- Rename column
ALTER TABLE laporan_kerusakan
RENAME COLUMN ditugaskan_ke TO penindak_lanjut;

-- Update comments (if any)
COMMENT ON COLUMN laporan_kerusakan.penindak_lanjut IS 'Tim yang bertanggung jawab untuk penindak lanjut kerusakan';
