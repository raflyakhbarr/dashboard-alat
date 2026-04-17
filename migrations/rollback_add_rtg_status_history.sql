-- Rollback: Drop RTG Status History Table

-- Drop view first
DROP VIEW IF EXISTS vw_rtg_monthly_stats;

-- Drop indexes
DROP INDEX IF EXISTS idx_rtg_status_history_unit_date;
DROP INDEX IF EXISTS idx_rtg_status_history_created_at;
DROP INDEX IF EXISTS idx_rtg_status_history_unit_id;

-- Drop table
DROP TABLE IF EXISTS rtg_status_history;
