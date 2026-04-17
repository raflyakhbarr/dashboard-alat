-- Rollback: Rename penindak_lanjut back to ditugaskan_ke

ALTER TABLE laporan_kerusakan
RENAME COLUMN penindak_lanjut TO ditugaskan_ke;
