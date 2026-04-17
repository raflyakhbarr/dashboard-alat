-- Migration: Create RTG Status History Table
-- Purpose: Track all status changes for RTG units to generate monthly reports

-- Create rtg_status_history table
CREATE TABLE IF NOT EXISTS rtg_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rtg_unit_id UUID NOT NULL REFERENCES rtg_units(id) ON DELETE CASCADE,
    status_kondisi_sebelumnya VARCHAR(50),
    status_kondisi_baru VARCHAR(50) NOT NULL,
    alasan_perubahan TEXT,
    laporan_kerusakan_id UUID REFERENCES laporan_kerusakan(id) ON DELETE SET NULL,
    diubah_oleh VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_rtg_status_history_unit_id ON rtg_status_history(rtg_unit_id);
CREATE INDEX IF NOT EXISTS idx_rtg_status_history_created_at ON rtg_status_history(created_at);
CREATE INDEX IF NOT EXISTS idx_rtg_status_history_unit_date ON rtg_status_history(rtg_unit_id, created_at);

-- Create view for monthly RTG issue statistics
CREATE OR REPLACE VIEW vw_rtg_monthly_stats AS
SELECT
    DATE_TRUNC('month', h.created_at) AS bulan,
    u.kode_rtg,
    u.nama_rtg,
    COUNT(*) FILTER (
        WHERE h.status_kondisi_baru IN ('READY_CATATAN_RINGAN', 'READY_CATATAN_BERAT', 'TIDAK_READY')
    ) AS jumlah_masalah,
    COUNT(*) FILTER (
        WHERE h.status_kondisi_baru = 'READY_CATATAN_RINGAN'
    ) AS jumlah_catatan_ringan,
    COUNT(*) FILTER (
        WHERE h.status_kondisi_baru = 'READY_CATATAN_BERAT'
    ) AS jumlah_catatan_berat,
    COUNT(*) FILTER (
        WHERE h.status_kondisi_baru = 'TIDAK_READY'
    ) AS jumlah_tidak_ready,
    ARRAY_AGG(
        DISTINCT h.laporan_kerusakan_id
    ) FILTER (
        WHERE h.laporan_kerusakan_id IS NOT NULL
    ) AS laporan_terkait
FROM rtg_status_history h
INNER JOIN rtg_units u ON h.rtg_unit_id = u.id
GROUP BY
    DATE_TRUNC('month', h.created_at),
    u.kode_rtg,
    u.nama_rtg
ORDER BY
    DATE_TRUNC('month', h.created_at) DESC,
    u.kode_rtg;

-- Grant permissions (adjust based on your database user)
-- GRANT SELECT, INSERT ON rtg_status_history TO your_app_user;
-- GRANT SELECT ON vw_rtg_monthly_stats TO your_app_user;
-- GRANT USAGE, SELECT ON SEQUENCE rtg_status_history_id_seq TO your_app_user;

COMMENT ON TABLE rtg_status_history IS 'Menyimpan history perubahan status RTG untuk tracking dan reporting';
COMMENT ON VIEW vw_rtg_monthly_stats IS 'View statistik bulanan masalah RTG per unit';
