-- Database Backup: dashboard_alat
-- Created: 2026-04-14T02:28:30.874Z
-- Backup before redesign migration
-- 


-- Table: rtg_groups
DROP TABLE IF EXISTS rtg_groups CASCADE;
CREATE TABLE rtg_groups (id uuid NOT NULL DEFAULT gen_random_uuid(), nama_group character varying(255) NOT NULL, deskripsi text, lokasi character varying(255), created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP);

-- Data for rtg_groups: 3 rows
INSERT INTO rtg_groups (id, nama_group, deskripsi, lokasi, created_at) VALUES ('eaae224c-5646-4e17-b799-c209d5500237', 'Group A', 'RTG Group A - Terminal 1', 'Terminal 1, Block A', '2026-04-13T03:41:59.518Z');
INSERT INTO rtg_groups (id, nama_group, deskripsi, lokasi, created_at) VALUES ('ef91f564-97e3-48d2-ae75-5f8462ab3bb9', 'Group B', 'RTG Group B - Terminal 2', 'Terminal 2, Block B', '2026-04-13T03:41:59.518Z');
INSERT INTO rtg_groups (id, nama_group, deskripsi, lokasi, created_at) VALUES ('38633baf-a627-4245-8aa6-afe2a958ff86', 'Group C', 'RTG Group C - Terminal 3', 'Terminal 3, Block C', '2026-04-13T03:41:59.518Z');


-- Table: rtg_units
DROP TABLE IF EXISTS rtg_units CASCADE;
CREATE TABLE rtg_units (id uuid NOT NULL DEFAULT gen_random_uuid(), kode_rtg character varying(255) NOT NULL, nama_rtg character varying(255) NOT NULL, group_rtg_id uuid, kapasitas integer, tahun_pembuatan integer, manufacturer character varying(255), spesifikasi text, status_kondisi character varying(50) NOT NULL DEFAULT 'READY'::character varying, created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP, updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP);

-- Data for rtg_units: 5 rows
INSERT INTO rtg_units (id, kode_rtg, nama_rtg, group_rtg_id, kapasitas, tahun_pembuatan, manufacturer, spesifikasi, status_kondisi, created_at, updated_at) VALUES ('5aac7ece-7f49-4144-92d7-f8748211ab96', 'RTG-001', 'RTG A1', 'eaae224c-5646-4e17-b799-c209d5500237', 40, 2020, 'Konecranes', 'Rubber Tyred Gantry Crane - Single Trolley', 'READY', '2026-04-13T03:41:59.518Z', '2026-04-13T03:41:59.518Z');
INSERT INTO rtg_units (id, kode_rtg, nama_rtg, group_rtg_id, kapasitas, tahun_pembuatan, manufacturer, spesifikasi, status_kondisi, created_at, updated_at) VALUES ('2d2acd83-0764-47c5-aa0f-5e82438457cb', 'RTG-002', 'RTG A2', 'eaae224c-5646-4e17-b799-c209d5500237', 40, 2020, 'Konecranes', 'Rubber Tyred Gantry Crane - Single Trolley', 'READY', '2026-04-13T03:41:59.518Z', '2026-04-13T03:41:59.518Z');
INSERT INTO rtg_units (id, kode_rtg, nama_rtg, group_rtg_id, kapasitas, tahun_pembuatan, manufacturer, spesifikasi, status_kondisi, created_at, updated_at) VALUES ('89b02daf-4765-49f0-aebc-e8e7df9a9c2e', 'RTG-003', 'RTG B1', 'ef91f564-97e3-48d2-ae75-5f8462ab3bb9', 45, 2021, 'Liebherr', 'Rubber Tyred Gantry Crane - Twin Lift', 'READY_CATATAN_RINGAN', '2026-04-13T03:41:59.518Z', '2026-04-13T03:41:59.518Z');
INSERT INTO rtg_units (id, kode_rtg, nama_rtg, group_rtg_id, kapasitas, tahun_pembuatan, manufacturer, spesifikasi, status_kondisi, created_at, updated_at) VALUES ('a9113704-3538-4039-adfb-a197bec3d6d2', 'RTG-004', 'RTG B2', 'ef91f564-97e3-48d2-ae75-5f8462ab3bb9', 45, 2021, 'Liebherr', 'Rubber Tyred Gantry Crane - Twin Lift', 'READY', '2026-04-13T03:41:59.518Z', '2026-04-13T03:41:59.518Z');
INSERT INTO rtg_units (id, kode_rtg, nama_rtg, group_rtg_id, kapasitas, tahun_pembuatan, manufacturer, spesifikasi, status_kondisi, created_at, updated_at) VALUES ('5af21af0-aa27-42c4-8d17-de732ab8797e', 'RTG-005', 'RTG C1', '38633baf-a627-4245-8aa6-afe2a958ff86', 50, 2019, 'Noell', 'Rubber Tyred Gantry Crane - Heavy Duty', 'TIDAK_READY', '2026-04-13T03:41:59.518Z', '2026-04-13T03:41:59.518Z');


-- Table: temuan_rtg
DROP TABLE IF EXISTS temuan_rtg CASCADE;
CREATE TABLE temuan_rtg (id uuid NOT NULL DEFAULT gen_random_uuid(), rtg_unit_id uuid NOT NULL, pelapor_id uuid NOT NULL, tanggal_temuan date NOT NULL, waktu_temuan time without time zone NOT NULL, jenis_temuan character varying(255) NOT NULL, deskripsi_temuan text, foto jsonb DEFAULT '[]'::jsonb, status_temuan character varying(50) NOT NULL DEFAULT 'DIPERIKSA'::character varying, created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP);


-- Table: users
DROP TABLE IF EXISTS users CASCADE;
CREATE TABLE users (id uuid NOT NULL DEFAULT gen_random_uuid(), email character varying(255) NOT NULL, nama character varying(255) NOT NULL, password character varying(255) NOT NULL, role character varying(20) NOT NULL, created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP);

-- Data for users: 4 rows
INSERT INTO users (id, email, nama, password, role, created_at) VALUES ('4ec0563c-7211-4253-a8e1-67dc901e6cfa', 'admin@dashboard.com', 'Administrator', '$2b$10$8xcH3A3KSuz6l4w4yhwkUO4wSJ5yWQU0BxZe.8eWKHfoQDJVejj7y', 'admin', '2026-04-13T03:19:45.385Z');
INSERT INTO users (id, email, nama, password, role, created_at) VALUES ('0e75c2b8-ecf4-4351-8dd7-1bd90d9473a5', 'operasional@dashboard.com', 'Tim Operasional', '$2b$10$uIwtRNw5VRLDxpyT4jKW1emfPePNXvFuMnghE6dFPf3WgeOCwd5JS', 'operasional', '2026-04-13T03:19:45.385Z');
INSERT INTO users (id, email, nama, password, role, created_at) VALUES ('e2a9b513-b4d4-455b-b76a-d6b57122d68a', 'mekanik@dashboard.com', 'Tim Mekanik', '$2b$10$FgWzwQ5Oka7bAGldLonbW.wbdXTRCBRX3PEhkVwVSIXWgmlL2zWiO', 'mekanik', '2026-04-13T03:19:45.385Z');
INSERT INTO users (id, email, nama, password, role, created_at) VALUES ('9e627926-0e7b-4787-bba7-604b28372740', 'operator@dashboard.com', 'Tim Operator', '$2b$10$Yft5trlHGwZxVZXTZS8awOp0KkSOwdYb/0jvBnUQNPxWBGNd1I2v2', 'operator', '2026-04-13T03:19:45.385Z');

