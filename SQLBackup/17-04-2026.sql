--
-- PostgreSQL database dump
--

\restrict Xs2btzlsF2wfQfHPizniwZKkJdRsRyoA1s2QJvTxiePZsAC0FvHRI11lDzXemJ2

-- Dumped from database version 18.1
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

DROP DATABASE dashboard_alat;
--
-- Name: dashboard_alat; Type: DATABASE; Schema: -; Owner: -
--

CREATE DATABASE dashboard_alat WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'Indonesian_Indonesia.1252';


\unrestrict Xs2btzlsF2wfQfHPizniwZKkJdRsRyoA1s2QJvTxiePZsAC0FvHRI11lDzXemJ2
\connect dashboard_alat
\restrict Xs2btzlsF2wfQfHPizniwZKkJdRsRyoA1s2QJvTxiePZsAC0FvHRI11lDzXemJ2

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


SET default_table_access_method = heap;

--
-- Name: laporan_kerusakan; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.laporan_kerusakan (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    rtg_unit_id uuid NOT NULL,
    dilaporkan_oleh character varying(255) NOT NULL,
    nama_pelapor character varying(255) NOT NULL,
    email_pelapor character varying(255),
    penindak_lanjut character varying(50) CONSTRAINT laporan_kerusakan_ditugaskan_ke_not_null NOT NULL,
    tanggal_laporan date NOT NULL,
    waktu_laporan time without time zone NOT NULL,
    jenis_kerusakan character varying(255) NOT NULL,
    deskripsi text,
    foto_laporan jsonb DEFAULT '[]'::jsonb,
    status_kerusakan character varying(50) DEFAULT 'DIPERIKSA'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_ditugaskan_ke CHECK (((penindak_lanjut)::text = ANY ((ARRAY['peralatan_terminal'::character varying, 'perencanaan_persediaan'::character varying, 'fasilitas'::character varying])::text[]))),
    CONSTRAINT chk_status_kerusakan CHECK (((status_kerusakan)::text = ANY ((ARRAY['DIPERIKSA'::character varying, 'DITINDAKLANJUTI'::character varying, 'SELESAI'::character varying])::text[])))
);


--
-- Name: penindaklanjut_kerusakan; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.penindaklanjut_kerusakan (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    laporan_kerusakan_id uuid NOT NULL,
    ditangani_oleh_id uuid NOT NULL,
    tanggal_selesai date NOT NULL,
    deskripsi_tindakan text NOT NULL,
    foto_bukti jsonb NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: rtg_groups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rtg_groups (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nama_group character varying(255) NOT NULL,
    deskripsi text,
    lokasi character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: rtg_status_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rtg_status_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    rtg_unit_id uuid NOT NULL,
    status_kondisi_sebelumnya character varying(50),
    status_kondisi_baru character varying(50) NOT NULL,
    alasan_perubahan text,
    laporan_kerusakan_id uuid,
    diubah_oleh character varying(255),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: rtg_units; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rtg_units (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    kode_rtg character varying(255) NOT NULL,
    nama_rtg character varying(255) NOT NULL,
    group_rtg_id uuid,
    kapasitas integer,
    tahun_pembuatan integer,
    manufacturer character varying(255),
    spesifikasi text,
    status_kondisi character varying(50) DEFAULT 'READY'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT rtg_units_status_kondisi_check CHECK (((status_kondisi)::text = ANY ((ARRAY['READY'::character varying, 'READY_CATATAN_RINGAN'::character varying, 'READY_CATATAN_BERAT'::character varying, 'TIDAK_READY'::character varying])::text[])))
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email character varying(255) NOT NULL,
    nama character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    role character varying(50) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_role CHECK (((role)::text = ANY ((ARRAY['operasional'::character varying, 'peralatan_terminal'::character varying, 'perencanaan_persediaan'::character varying, 'fasilitas'::character varying])::text[])))
);


--
-- Name: vw_rtg_monthly_stats; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.vw_rtg_monthly_stats AS
 SELECT date_trunc('month'::text, h.created_at) AS bulan,
    u.kode_rtg,
    u.nama_rtg,
    count(*) FILTER (WHERE ((h.status_kondisi_baru)::text = ANY ((ARRAY['READY_CATATAN_RINGAN'::character varying, 'READY_CATATAN_BERAT'::character varying, 'TIDAK_READY'::character varying])::text[]))) AS jumlah_masalah,
    count(*) FILTER (WHERE ((h.status_kondisi_baru)::text = 'READY_CATATAN_RINGAN'::text)) AS jumlah_catatan_ringan,
    count(*) FILTER (WHERE ((h.status_kondisi_baru)::text = 'READY_CATATAN_BERAT'::text)) AS jumlah_catatan_berat,
    count(*) FILTER (WHERE ((h.status_kondisi_baru)::text = 'TIDAK_READY'::text)) AS jumlah_tidak_ready,
    array_agg(DISTINCT h.laporan_kerusakan_id) FILTER (WHERE (h.laporan_kerusakan_id IS NOT NULL)) AS laporan_terkait
   FROM (public.rtg_status_history h
     JOIN public.rtg_units u ON ((h.rtg_unit_id = u.id)))
  GROUP BY (date_trunc('month'::text, h.created_at)), u.kode_rtg, u.nama_rtg
  ORDER BY (date_trunc('month'::text, h.created_at)) DESC, u.kode_rtg;


--
-- Data for Name: laporan_kerusakan; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.laporan_kerusakan (id, rtg_unit_id, dilaporkan_oleh, nama_pelapor, email_pelapor, penindak_lanjut, tanggal_laporan, waktu_laporan, jenis_kerusakan, deskripsi, foto_laporan, status_kerusakan, created_at) VALUES ('6fe63055-4a5e-43bc-99d8-4fa7734917b1', 'cc89f02d-97c3-44e4-9077-7137ee05a436', 'd7ef7183-640b-41d3-9803-9dc37f626b15', 'Herry Tampubolon', 'Herry.Tampubolon@tpssby.onmicrosoft.com', 'perencanaan_persediaan', '2026-03-27', '10:17:00', 'Cctv mati ', 'Cctv mati ', '["https://tpssby-my.sharepoint.com/personal/andre_cahyo_tps_co_id/Documents/Apps/Microsoft%20Forms/Untitled%20form/Question%202/IMG20260327050050_Herry%20Tampubolon.jpg", "https://tpssby-my.sharepoint.com/personal/andre_cahyo_tps_co_id/Documents/Apps/Microsoft%20Forms/Untitled%20form/Question%203/IMG20260327050050_Herry%20Tampubolon.jpg"]', 'DIPERIKSA', '2026-04-15 10:17:10.792037') ON CONFLICT DO NOTHING;
INSERT INTO public.laporan_kerusakan (id, rtg_unit_id, dilaporkan_oleh, nama_pelapor, email_pelapor, penindak_lanjut, tanggal_laporan, waktu_laporan, jenis_kerusakan, deskripsi, foto_laporan, status_kerusakan, created_at) VALUES ('c6878647-ce09-4ace-8b74-ddde8411efc4', '44f1a1f1-5762-4143-804c-370de03b07d8', 'd7ef7183-640b-41d3-9803-9dc37f626b15', 'Herry Tampubolon', 'Herry.Tampubolon@tpssby.onmicrosoft.com', 'peralatan_terminal', '2026-03-14', '10:17:00', 'Wuilguard sedikit peyok bogie 8 farside', 'Wuilguard sedikit peyok sisi farside bogie 8', '["https://tpssby-my.sharepoint.com/personal/andre_cahyo_tps_co_id/Documents/Apps/Microsoft%20Forms/Untitled%20form/Question%202/17734503395915634738027016665496_Herry%20Tampubolon.jpg", "https://tpssby-my.sharepoint.com/personal/andre_cahyo_tps_co_id/Documents/Apps/Microsoft%20Forms/Untitled%20form/Question%203/IMG20260314080647_Herry%20Tampubolon.jpg"]', 'DIPERIKSA', '2026-04-15 10:17:10.69264') ON CONFLICT DO NOTHING;
INSERT INTO public.laporan_kerusakan (id, rtg_unit_id, dilaporkan_oleh, nama_pelapor, email_pelapor, penindak_lanjut, tanggal_laporan, waktu_laporan, jenis_kerusakan, deskripsi, foto_laporan, status_kerusakan, created_at) VALUES ('626b4c86-1703-43f1-82ae-5df960b59850', 'a512ce7d-2254-488c-8ee5-7140acfcb544', 'd7ef7183-640b-41d3-9803-9dc37f626b15', 'Edi Susanto', 'EDI.SUSANTO@tpssby.onmicrosoft.com', 'perencanaan_persediaan', '2026-03-14', '10:17:00', 'Normal', 'Engine ngedrop ,sempat ganti filter solar', '[]', 'DIPERIKSA', '2026-04-15 10:17:10.715339') ON CONFLICT DO NOTHING;
INSERT INTO public.laporan_kerusakan (id, rtg_unit_id, dilaporkan_oleh, nama_pelapor, email_pelapor, penindak_lanjut, tanggal_laporan, waktu_laporan, jenis_kerusakan, deskripsi, foto_laporan, status_kerusakan, created_at) VALUES ('9a77cb57-5399-4ec7-8144-8ffb0533e252', 'f5765dd0-e573-4d23-8954-1bbf51a5c9df', 'd7ef7183-640b-41d3-9803-9dc37f626b15', 'Rendra Saputra', 'RENDRA.SAPUTRA@tpssby.onmicrosoft.com', 'perencanaan_persediaan', '2026-03-14', '10:17:00', 'Kaca cabin burem depan', NULL, '[]', 'DIPERIKSA', '2026-04-15 10:17:10.721632') ON CONFLICT DO NOTHING;
INSERT INTO public.laporan_kerusakan (id, rtg_unit_id, dilaporkan_oleh, nama_pelapor, email_pelapor, penindak_lanjut, tanggal_laporan, waktu_laporan, jenis_kerusakan, deskripsi, foto_laporan, status_kerusakan, created_at) VALUES ('8990c108-f062-46f9-af99-13570d91cf66', '477a75f2-69bb-4dc5-a709-a6d79d3f428b', 'd7ef7183-640b-41d3-9803-9dc37f626b15', 'Arief Kusuma', 'ARIEF.KUSUMA@tpssby.onmicrosoft.com', 'perencanaan_persediaan', '2026-03-14', '10:17:00', 'Nihil', 'Nihil', '[]', 'DIPERIKSA', '2026-04-15 10:17:10.726086') ON CONFLICT DO NOTHING;
INSERT INTO public.laporan_kerusakan (id, rtg_unit_id, dilaporkan_oleh, nama_pelapor, email_pelapor, penindak_lanjut, tanggal_laporan, waktu_laporan, jenis_kerusakan, deskripsi, foto_laporan, status_kerusakan, created_at) VALUES ('9a085d49-b87e-4482-9cf3-cf75cff3d3f9', 'a27fe24e-1891-4082-89cc-19513f7f8b08', 'd7ef7183-640b-41d3-9803-9dc37f626b15', 'Arief Kusuma', 'ARIEF.KUSUMA@tpssby.onmicrosoft.com', 'perencanaan_persediaan', '2026-03-15', '10:17:00', 'Vmt tidak bisa auto', NULL, '["https://tpssby-my.sharepoint.com/personal/andre_cahyo_tps_co_id/Documents/Apps/Microsoft%20Forms/Untitled%20form/Question%202/image_Arief%20Kusuma.jpg"]', 'DIPERIKSA', '2026-04-15 10:17:10.739641') ON CONFLICT DO NOTHING;
INSERT INTO public.laporan_kerusakan (id, rtg_unit_id, dilaporkan_oleh, nama_pelapor, email_pelapor, penindak_lanjut, tanggal_laporan, waktu_laporan, jenis_kerusakan, deskripsi, foto_laporan, status_kerusakan, created_at) VALUES ('c12ac7f7-68ff-4da1-a4d3-d152ca99f9c6', '0a058b78-046a-4e5a-80ee-360d8f1d06c3', 'd7ef7183-640b-41d3-9803-9dc37f626b15', 'Herry Tampubolon', 'Herry.Tampubolon@tpssby.onmicrosoft.com', 'perencanaan_persediaan', '2026-03-15', '10:17:00', 'Cctv mati 1 ', 'Cctv mati 1', '["https://tpssby-my.sharepoint.com/personal/andre_cahyo_tps_co_id/Documents/Apps/Microsoft%20Forms/Untitled%20form/Question%202/17735589744077384541258875124606_Herry%20Tampubolon.jpg", "https://tpssby-my.sharepoint.com/personal/andre_cahyo_tps_co_id/Documents/Apps/Microsoft%20Forms/Untitled%20form/Question%203/1773559000219152119660290159307_Herry%20Tampubolon.jpg"]', 'DIPERIKSA', '2026-04-15 10:17:10.746691') ON CONFLICT DO NOTHING;
INSERT INTO public.laporan_kerusakan (id, rtg_unit_id, dilaporkan_oleh, nama_pelapor, email_pelapor, penindak_lanjut, tanggal_laporan, waktu_laporan, jenis_kerusakan, deskripsi, foto_laporan, status_kerusakan, created_at) VALUES ('b4078c73-25f9-4786-8d9e-7f5fd9972d47', '0a058b78-046a-4e5a-80ee-360d8f1d06c3', 'd7ef7183-640b-41d3-9803-9dc37f626b15', 'Herry Tampubolon', 'Herry.Tampubolon@tpssby.onmicrosoft.com', 'perencanaan_persediaan', '2026-03-15', '10:17:00', 'Rtg AGGS stering mleyot padahal auto ', NULL, '["https://tpssby-my.sharepoint.com/personal/andre_cahyo_tps_co_id/Documents/Apps/Microsoft%20Forms/Untitled%20form/Question%202/IMG20260315154314_Herry%20Tampubolon.jpg"]', 'DIPERIKSA', '2026-04-15 10:17:10.750703') ON CONFLICT DO NOTHING;
INSERT INTO public.laporan_kerusakan (id, rtg_unit_id, dilaporkan_oleh, nama_pelapor, email_pelapor, penindak_lanjut, tanggal_laporan, waktu_laporan, jenis_kerusakan, deskripsi, foto_laporan, status_kerusakan, created_at) VALUES ('fc4d35eb-dbc4-4b15-9648-eba68cd91ff9', '9e098934-f78d-40f1-8322-aa6c77a15117', 'd7ef7183-640b-41d3-9803-9dc37f626b15', 'Taufan Hariono', 'TAUFAN.HARIONO@tpssby.onmicrosoft.com', 'perencanaan_persediaan', '2026-03-15', '10:17:00', 'kursi miring', 'kursi miring. menyebabkan sakit pinggang', '[]', 'DIPERIKSA', '2026-04-15 10:17:10.75674') ON CONFLICT DO NOTHING;
INSERT INTO public.laporan_kerusakan (id, rtg_unit_id, dilaporkan_oleh, nama_pelapor, email_pelapor, penindak_lanjut, tanggal_laporan, waktu_laporan, jenis_kerusakan, deskripsi, foto_laporan, status_kerusakan, created_at) VALUES ('1a5749fa-c7ce-44ee-a38e-6b958ac78153', '196941fc-583b-46ed-8c24-2ac5fa72d1e4', 'd7ef7183-640b-41d3-9803-9dc37f626b15', 'Herry Tampubolon', 'Herry.Tampubolon@tpssby.onmicrosoft.com', 'peralatan_terminal', '2026-03-16', '10:17:00', 'Wuilguard farside dan kamera cctv mati ', 'Wuilguard dan kamera cctv mati ', '["https://tpssby-my.sharepoint.com/personal/andre_cahyo_tps_co_id/Documents/Apps/Microsoft%20Forms/Untitled%20form/Question%202/17736675711704503554937957313930_Herry%20Tampubolon.jpg", "https://tpssby-my.sharepoint.com/personal/andre_cahyo_tps_co_id/Documents/Apps/Microsoft%20Forms/Untitled%20form/Question%203/17736675993775015494813474131480_Herry%20Tampubolon.jpg"]', 'DIPERIKSA', '2026-04-15 10:17:10.760734') ON CONFLICT DO NOTHING;
INSERT INTO public.laporan_kerusakan (id, rtg_unit_id, dilaporkan_oleh, nama_pelapor, email_pelapor, penindak_lanjut, tanggal_laporan, waktu_laporan, jenis_kerusakan, deskripsi, foto_laporan, status_kerusakan, created_at) VALUES ('5f0ddcfd-51e9-4049-9c50-92bc3d809a45', 'f5765dd0-e573-4d23-8954-1bbf51a5c9df', 'd7ef7183-640b-41d3-9803-9dc37f626b15', 'Herry Tampubolon', 'Herry.Tampubolon@tpssby.onmicrosoft.com', 'perencanaan_persediaan', '2026-03-17', '10:17:00', '1. Trolley Serat/ bergelombang/ tidak lancar 

2. Wiper Mati 
', NULL, '["https://tpssby-my.sharepoint.com/personal/andre_cahyo_tps_co_id/Documents/Apps/Microsoft%20Forms/Untitled%20form/Question%202/IMG20260317170040_Herry%20Tampubolon.jpg"]', 'DIPERIKSA', '2026-04-15 10:17:10.767787') ON CONFLICT DO NOTHING;
INSERT INTO public.laporan_kerusakan (id, rtg_unit_id, dilaporkan_oleh, nama_pelapor, email_pelapor, penindak_lanjut, tanggal_laporan, waktu_laporan, jenis_kerusakan, deskripsi, foto_laporan, status_kerusakan, created_at) VALUES ('7668ab1b-02f4-434e-b6fb-6d21c75f32ef', '77b73ffc-5695-4ce3-9984-a874e94c5ba8', 'd7ef7183-640b-41d3-9803-9dc37f626b15', 'Taufan Hariono', 'TAUFAN.HARIONO@tpssby.onmicrosoft.com', 'perencanaan_persediaan', '2026-03-22', '10:17:00', 'ac rusak', 'blower ac macet. 
ac nyala tetapi tidak keluar anngin', '["https://tpssby-my.sharepoint.com/personal/andre_cahyo_tps_co_id/Documents/Apps/Microsoft%20Forms/Untitled%20form/Question%202/IMG-20260322-WA0010_Taufan%20Hariono.jpeg", "https://tpssby-my.sharepoint.com/personal/andre_cahyo_tps_co_id/Documents/Apps/Microsoft%20Forms/Untitled%20form/Question%203/IMG-20260322-WA0010_Taufan%20Hariono.jpeg"]', 'DIPERIKSA', '2026-04-15 10:17:10.780617') ON CONFLICT DO NOTHING;
INSERT INTO public.laporan_kerusakan (id, rtg_unit_id, dilaporkan_oleh, nama_pelapor, email_pelapor, penindak_lanjut, tanggal_laporan, waktu_laporan, jenis_kerusakan, deskripsi, foto_laporan, status_kerusakan, created_at) VALUES ('3a0ba01d-5330-4549-83e0-2d90e05dda80', 'fcb51c41-1ff6-43c3-b509-69a54b136fc9', 'd7ef7183-640b-41d3-9803-9dc37f626b15', 'Taufan Hariono', 'TAUFAN.HARIONO@tpssby.onmicrosoft.com', 'perencanaan_persediaan', '2026-03-30', '10:17:00', 'cabin keropos', 'gantry sangat lambat jika agss ON', '["https://tpssby-my.sharepoint.com/personal/andre_cahyo_tps_co_id/Documents/Apps/Microsoft%20Forms/Untitled%20form/Question%202/20260330_153334_Taufan%20Hariono.jpg"]', 'DIPERIKSA', '2026-04-15 10:17:10.796635') ON CONFLICT DO NOTHING;
INSERT INTO public.laporan_kerusakan (id, rtg_unit_id, dilaporkan_oleh, nama_pelapor, email_pelapor, penindak_lanjut, tanggal_laporan, waktu_laporan, jenis_kerusakan, deskripsi, foto_laporan, status_kerusakan, created_at) VALUES ('26f17251-cc30-4be2-b98b-b491495b3a0f', 'a27fe24e-1891-4082-89cc-19513f7f8b08', 'd7ef7183-640b-41d3-9803-9dc37f626b15', 'Herry Tampubolon', 'Herry.Tampubolon@tpssby.onmicrosoft.com', 'peralatan_terminal', '2026-03-24', '10:17:00', 'Ban Bogie 7 nearseat sobek , wuilguard peyok farside nearside, lampu sorot speader putus ', 'Ban sobek bogie 7 , wuilguard peyok farside nearside, lampu sorot speader putus ', '["https://tpssby-my.sharepoint.com/personal/andre_cahyo_tps_co_id/Documents/Apps/Microsoft%20Forms/Untitled%20form/Question%202/IMG-20260324-WA0006_Herry%20Tampubolon.jpeg", "https://tpssby-my.sharepoint.com/personal/andre_cahyo_tps_co_id/Documents/Apps/Microsoft%20Forms/Untitled%20form/Question%203/17743477487294047095407760190971_Herry%20Tampubolon.jpg"]', 'SELESAI', '2026-04-15 10:17:10.784212') ON CONFLICT DO NOTHING;


--
-- Data for Name: penindaklanjut_kerusakan; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.penindaklanjut_kerusakan (id, laporan_kerusakan_id, ditangani_oleh_id, tanggal_selesai, deskripsi_tindakan, foto_bukti, created_at) VALUES ('2e78a575-9e16-4cd1-8ea8-2f7128ccff87', '26f17251-cc30-4be2-b98b-b491495b3a0f', 'e070afa9-777c-4170-a92a-2d4475bf6380', '2026-04-15', 'sudah di fix', '[]', '2026-04-15 10:23:54.691154') ON CONFLICT DO NOTHING;


--
-- Data for Name: rtg_groups; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.rtg_groups (id, nama_group, deskripsi, lokasi, created_at) VALUES ('37af9d51-1a00-450e-9e8e-e7f5feb142f5', 'RTG B', 'Group RTG B - dibuat otomatis dari import Excel', NULL, '2026-04-15 10:13:07.295261') ON CONFLICT DO NOTHING;
INSERT INTO public.rtg_groups (id, nama_group, deskripsi, lokasi, created_at) VALUES ('08802c4e-8852-4985-a6b5-600f1c1ae965', 'RTG C', 'Group RTG C - dibuat otomatis dari import Excel', NULL, '2026-04-15 10:13:07.322726') ON CONFLICT DO NOTHING;


--
-- Data for Name: rtg_status_history; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.rtg_status_history (id, rtg_unit_id, status_kondisi_sebelumnya, status_kondisi_baru, alasan_perubahan, laporan_kerusakan_id, diubah_oleh, created_at) VALUES ('45de7d0d-74f0-4be3-9ca8-2fe2177d0859', 'f5765dd0-e573-4d23-8954-1bbf51a5c9df', 'READY', 'READY', 'Import laporan operator: Andre Cahyo', NULL, 'd7ef7183-640b-41d3-9803-9dc37f626b15', '2026-04-15 10:13:07.317717+07') ON CONFLICT DO NOTHING;
INSERT INTO public.rtg_status_history (id, rtg_unit_id, status_kondisi_sebelumnya, status_kondisi_baru, alasan_perubahan, laporan_kerusakan_id, diubah_oleh, created_at) VALUES ('b237d2f7-a098-4586-9a21-85a56e839549', '9e098934-f78d-40f1-8322-aa6c77a15117', 'READY', 'READY', 'Import laporan operator: Tri Nuryanto', NULL, 'd7ef7183-640b-41d3-9803-9dc37f626b15', '2026-04-15 10:13:07.617382+07') ON CONFLICT DO NOTHING;
INSERT INTO public.rtg_status_history (id, rtg_unit_id, status_kondisi_sebelumnya, status_kondisi_baru, alasan_perubahan, laporan_kerusakan_id, diubah_oleh, created_at) VALUES ('e5f1a84a-59c2-4e2a-9fcf-ad6236281a75', '196941fc-583b-46ed-8c24-2ac5fa72d1e4', 'READY', 'READY', 'Import laporan operator: Dwi Purnomo', NULL, 'd7ef7183-640b-41d3-9803-9dc37f626b15', '2026-04-15 10:13:07.622991+07') ON CONFLICT DO NOTHING;
INSERT INTO public.rtg_status_history (id, rtg_unit_id, status_kondisi_sebelumnya, status_kondisi_baru, alasan_perubahan, laporan_kerusakan_id, diubah_oleh, created_at) VALUES ('bd1a2ba4-b1da-4627-9d61-de8b77f87840', '9280d5fe-984f-4f2a-bc7c-73ca1018b9d3', 'READY', 'READY', 'Import laporan operator: Hari Subagio', NULL, 'd7ef7183-640b-41d3-9803-9dc37f626b15', '2026-04-15 10:13:07.627252+07') ON CONFLICT DO NOTHING;
INSERT INTO public.rtg_status_history (id, rtg_unit_id, status_kondisi_sebelumnya, status_kondisi_baru, alasan_perubahan, laporan_kerusakan_id, diubah_oleh, created_at) VALUES ('5576d34e-cd5e-4691-ad85-20fa13ee4f88', 'febcb464-0b10-4d37-8f39-01821df02634', 'READY', 'READY', 'Import laporan operator: Taufan Hariono', NULL, 'd7ef7183-640b-41d3-9803-9dc37f626b15', '2026-04-15 10:13:07.798746+07') ON CONFLICT DO NOTHING;
INSERT INTO public.rtg_status_history (id, rtg_unit_id, status_kondisi_sebelumnya, status_kondisi_baru, alasan_perubahan, laporan_kerusakan_id, diubah_oleh, created_at) VALUES ('68ecef40-5bc8-436e-a7e2-b08bfd223084', 'f5765dd0-e573-4d23-8954-1bbf51a5c9df', 'READY', 'READY', 'Import laporan operator: Hari Subagio', NULL, 'd7ef7183-640b-41d3-9803-9dc37f626b15', '2026-04-15 10:13:07.803269+07') ON CONFLICT DO NOTHING;
INSERT INTO public.rtg_status_history (id, rtg_unit_id, status_kondisi_sebelumnya, status_kondisi_baru, alasan_perubahan, laporan_kerusakan_id, diubah_oleh, created_at) VALUES ('6ec22707-fb00-4009-a010-a4b5c984a34f', 'cd82992c-6eb5-4ec2-8fbc-669fc3d99670', 'READY', 'READY', 'Import laporan operator: Syaiful Huda', NULL, 'd7ef7183-640b-41d3-9803-9dc37f626b15', '2026-04-15 10:13:07.86222+07') ON CONFLICT DO NOTHING;
INSERT INTO public.rtg_status_history (id, rtg_unit_id, status_kondisi_sebelumnya, status_kondisi_baru, alasan_perubahan, laporan_kerusakan_id, diubah_oleh, created_at) VALUES ('ed373ddc-1a28-4e74-9f84-bcc87f6ffa99', '477a75f2-69bb-4dc5-a709-a6d79d3f428b', 'READY', 'READY', 'Import laporan operator: Taufan Hariono', NULL, 'd7ef7183-640b-41d3-9803-9dc37f626b15', '2026-04-15 10:13:08.082585+07') ON CONFLICT DO NOTHING;
INSERT INTO public.rtg_status_history (id, rtg_unit_id, status_kondisi_sebelumnya, status_kondisi_baru, alasan_perubahan, laporan_kerusakan_id, diubah_oleh, created_at) VALUES ('47b7d898-75e0-42c2-aef3-110171d39691', '477a75f2-69bb-4dc5-a709-a6d79d3f428b', 'READY', 'READY', 'Import laporan operator: Syaiful Huda', NULL, 'd7ef7183-640b-41d3-9803-9dc37f626b15', '2026-04-15 10:13:08.148194+07') ON CONFLICT DO NOTHING;
INSERT INTO public.rtg_status_history (id, rtg_unit_id, status_kondisi_sebelumnya, status_kondisi_baru, alasan_perubahan, laporan_kerusakan_id, diubah_oleh, created_at) VALUES ('bfbb7ece-3c8d-4ca0-a7b3-3895ffc0be3f', '9e098934-f78d-40f1-8322-aa6c77a15117', 'READY', 'READY', 'Import laporan operator: Herry Tampubolon', NULL, 'd7ef7183-640b-41d3-9803-9dc37f626b15', '2026-04-15 10:13:08.254473+07') ON CONFLICT DO NOTHING;
INSERT INTO public.rtg_status_history (id, rtg_unit_id, status_kondisi_sebelumnya, status_kondisi_baru, alasan_perubahan, laporan_kerusakan_id, diubah_oleh, created_at) VALUES ('01a98fed-08be-4eee-99d4-4a0482f08905', 'f5765dd0-e573-4d23-8954-1bbf51a5c9df', 'READY', 'READY', 'Import laporan operator: Andre Cahyo', NULL, 'd7ef7183-640b-41d3-9803-9dc37f626b15', '2026-04-15 10:14:17.331261+07') ON CONFLICT DO NOTHING;
INSERT INTO public.rtg_status_history (id, rtg_unit_id, status_kondisi_sebelumnya, status_kondisi_baru, alasan_perubahan, laporan_kerusakan_id, diubah_oleh, created_at) VALUES ('2836608f-a765-47d6-b600-dd4de68cc2a8', '9e098934-f78d-40f1-8322-aa6c77a15117', 'READY', 'READY', 'Import laporan operator: Tri Nuryanto', NULL, 'd7ef7183-640b-41d3-9803-9dc37f626b15', '2026-04-15 10:14:17.417154+07') ON CONFLICT DO NOTHING;
INSERT INTO public.rtg_status_history (id, rtg_unit_id, status_kondisi_sebelumnya, status_kondisi_baru, alasan_perubahan, laporan_kerusakan_id, diubah_oleh, created_at) VALUES ('ae09b981-46a1-474e-be1f-705df14789a9', '196941fc-583b-46ed-8c24-2ac5fa72d1e4', 'READY', 'READY', 'Import laporan operator: Dwi Purnomo', NULL, 'd7ef7183-640b-41d3-9803-9dc37f626b15', '2026-04-15 10:14:17.421642+07') ON CONFLICT DO NOTHING;
INSERT INTO public.rtg_status_history (id, rtg_unit_id, status_kondisi_sebelumnya, status_kondisi_baru, alasan_perubahan, laporan_kerusakan_id, diubah_oleh, created_at) VALUES ('f056ec81-2c6d-401f-aea4-2cc969e1ec93', '9280d5fe-984f-4f2a-bc7c-73ca1018b9d3', 'READY', 'READY', 'Import laporan operator: Hari Subagio', NULL, 'd7ef7183-640b-41d3-9803-9dc37f626b15', '2026-04-15 10:14:17.425038+07') ON CONFLICT DO NOTHING;
INSERT INTO public.rtg_status_history (id, rtg_unit_id, status_kondisi_sebelumnya, status_kondisi_baru, alasan_perubahan, laporan_kerusakan_id, diubah_oleh, created_at) VALUES ('97148999-88d0-4897-9c6b-6a72b35ebf17', 'febcb464-0b10-4d37-8f39-01821df02634', 'READY', 'READY', 'Import laporan operator: Taufan Hariono', NULL, 'd7ef7183-640b-41d3-9803-9dc37f626b15', '2026-04-15 10:14:17.584383+07') ON CONFLICT DO NOTHING;
INSERT INTO public.rtg_status_history (id, rtg_unit_id, status_kondisi_sebelumnya, status_kondisi_baru, alasan_perubahan, laporan_kerusakan_id, diubah_oleh, created_at) VALUES ('fdba1b79-a4c2-4502-971e-487e0a9ba80e', 'f5765dd0-e573-4d23-8954-1bbf51a5c9df', 'READY', 'READY', 'Import laporan operator: Hari Subagio', NULL, 'd7ef7183-640b-41d3-9803-9dc37f626b15', '2026-04-15 10:14:17.587854+07') ON CONFLICT DO NOTHING;
INSERT INTO public.rtg_status_history (id, rtg_unit_id, status_kondisi_sebelumnya, status_kondisi_baru, alasan_perubahan, laporan_kerusakan_id, diubah_oleh, created_at) VALUES ('90477b09-3748-46bd-84ae-0c845b32c99a', 'cd82992c-6eb5-4ec2-8fbc-669fc3d99670', 'READY', 'READY', 'Import laporan operator: Syaiful Huda', NULL, 'd7ef7183-640b-41d3-9803-9dc37f626b15', '2026-04-15 10:14:17.642071+07') ON CONFLICT DO NOTHING;
INSERT INTO public.rtg_status_history (id, rtg_unit_id, status_kondisi_sebelumnya, status_kondisi_baru, alasan_perubahan, laporan_kerusakan_id, diubah_oleh, created_at) VALUES ('30cbef8b-0e3c-471b-85a1-6da287ee00e8', '477a75f2-69bb-4dc5-a709-a6d79d3f428b', 'READY', 'READY', 'Import laporan operator: Taufan Hariono', NULL, 'd7ef7183-640b-41d3-9803-9dc37f626b15', '2026-04-15 10:14:17.994027+07') ON CONFLICT DO NOTHING;
INSERT INTO public.rtg_status_history (id, rtg_unit_id, status_kondisi_sebelumnya, status_kondisi_baru, alasan_perubahan, laporan_kerusakan_id, diubah_oleh, created_at) VALUES ('b5ed0dce-2d2b-4c1e-8baa-f7eb747bb123', '477a75f2-69bb-4dc5-a709-a6d79d3f428b', 'READY', 'READY', 'Import laporan operator: Syaiful Huda', NULL, 'd7ef7183-640b-41d3-9803-9dc37f626b15', '2026-04-15 10:14:18.047414+07') ON CONFLICT DO NOTHING;
INSERT INTO public.rtg_status_history (id, rtg_unit_id, status_kondisi_sebelumnya, status_kondisi_baru, alasan_perubahan, laporan_kerusakan_id, diubah_oleh, created_at) VALUES ('ca98037b-3173-460b-9993-2174f37826f9', '9e098934-f78d-40f1-8322-aa6c77a15117', 'READY', 'READY', 'Import laporan operator: Herry Tampubolon', NULL, 'd7ef7183-640b-41d3-9803-9dc37f626b15', '2026-04-15 10:14:18.14965+07') ON CONFLICT DO NOTHING;
INSERT INTO public.rtg_status_history (id, rtg_unit_id, status_kondisi_sebelumnya, status_kondisi_baru, alasan_perubahan, laporan_kerusakan_id, diubah_oleh, created_at) VALUES ('b0076555-3b38-45cd-8686-0187ee3d05b1', 'f5765dd0-e573-4d23-8954-1bbf51a5c9df', 'READY', 'READY', 'Import laporan operator: Andre Cahyo', NULL, 'd7ef7183-640b-41d3-9803-9dc37f626b15', '2026-04-15 10:17:10.689283+07') ON CONFLICT DO NOTHING;
INSERT INTO public.rtg_status_history (id, rtg_unit_id, status_kondisi_sebelumnya, status_kondisi_baru, alasan_perubahan, laporan_kerusakan_id, diubah_oleh, created_at) VALUES ('42c96fb3-7796-4659-8aa6-29e5c00accf7', '44f1a1f1-5762-4143-804c-370de03b07d8', 'READY_CATATAN_BERAT', 'READY_CATATAN_BERAT', 'Import laporan operator: Herry Tampubolon - Wuilguard sedikit peyok bogie 8 farside', 'c6878647-ce09-4ace-8b74-ddde8411efc4', 'd7ef7183-640b-41d3-9803-9dc37f626b15', '2026-04-15 10:17:10.701248+07') ON CONFLICT DO NOTHING;
INSERT INTO public.rtg_status_history (id, rtg_unit_id, status_kondisi_sebelumnya, status_kondisi_baru, alasan_perubahan, laporan_kerusakan_id, diubah_oleh, created_at) VALUES ('8d2e12fe-339d-462b-aff3-2710952804b9', '9e098934-f78d-40f1-8322-aa6c77a15117', 'READY', 'READY', 'Import laporan operator: Tri Nuryanto', NULL, 'd7ef7183-640b-41d3-9803-9dc37f626b15', '2026-04-15 10:17:10.707197+07') ON CONFLICT DO NOTHING;
INSERT INTO public.rtg_status_history (id, rtg_unit_id, status_kondisi_sebelumnya, status_kondisi_baru, alasan_perubahan, laporan_kerusakan_id, diubah_oleh, created_at) VALUES ('1aebca2b-48b4-47f4-a502-277ac02cd387', '196941fc-583b-46ed-8c24-2ac5fa72d1e4', 'READY', 'READY', 'Import laporan operator: Dwi Purnomo', NULL, 'd7ef7183-640b-41d3-9803-9dc37f626b15', '2026-04-15 10:17:10.710257+07') ON CONFLICT DO NOTHING;
INSERT INTO public.rtg_status_history (id, rtg_unit_id, status_kondisi_sebelumnya, status_kondisi_baru, alasan_perubahan, laporan_kerusakan_id, diubah_oleh, created_at) VALUES ('5a7cf07a-5878-4130-86ac-b45d7bdf380b', '9280d5fe-984f-4f2a-bc7c-73ca1018b9d3', 'READY', 'READY', 'Import laporan operator: Hari Subagio', NULL, 'd7ef7183-640b-41d3-9803-9dc37f626b15', '2026-04-15 10:17:10.713209+07') ON CONFLICT DO NOTHING;
INSERT INTO public.rtg_status_history (id, rtg_unit_id, status_kondisi_sebelumnya, status_kondisi_baru, alasan_perubahan, laporan_kerusakan_id, diubah_oleh, created_at) VALUES ('bed906fb-953e-48ff-b92a-e30dc5b0cf4c', 'a512ce7d-2254-488c-8ee5-7140acfcb544', 'READY_CATATAN_RINGAN', 'READY_CATATAN_RINGAN', 'Import laporan operator: Edi Susanto - Normal', '626b4c86-1703-43f1-82ae-5df960b59850', 'd7ef7183-640b-41d3-9803-9dc37f626b15', '2026-04-15 10:17:10.718106+07') ON CONFLICT DO NOTHING;
INSERT INTO public.rtg_status_history (id, rtg_unit_id, status_kondisi_sebelumnya, status_kondisi_baru, alasan_perubahan, laporan_kerusakan_id, diubah_oleh, created_at) VALUES ('a203393b-eac0-49ba-a65f-9d8a15b4af1d', 'f5765dd0-e573-4d23-8954-1bbf51a5c9df', 'READY', 'READY_CATATAN_RINGAN', 'Import laporan operator: Rendra Saputra - Kaca cabin burem depan', '9a77cb57-5399-4ec7-8144-8ffb0533e252', 'd7ef7183-640b-41d3-9803-9dc37f626b15', '2026-04-15 10:17:10.724006+07') ON CONFLICT DO NOTHING;
INSERT INTO public.rtg_status_history (id, rtg_unit_id, status_kondisi_sebelumnya, status_kondisi_baru, alasan_perubahan, laporan_kerusakan_id, diubah_oleh, created_at) VALUES ('f4118fa5-0269-410f-b10c-cdbcef881110', '477a75f2-69bb-4dc5-a709-a6d79d3f428b', 'READY', 'READY', 'Import laporan operator: Arief Kusuma - Nihil', '8990c108-f062-46f9-af99-13570d91cf66', 'd7ef7183-640b-41d3-9803-9dc37f626b15', '2026-04-15 10:17:10.728307+07') ON CONFLICT DO NOTHING;
INSERT INTO public.rtg_status_history (id, rtg_unit_id, status_kondisi_sebelumnya, status_kondisi_baru, alasan_perubahan, laporan_kerusakan_id, diubah_oleh, created_at) VALUES ('880a8e5b-2053-43c4-a91e-f9ffc0b78e59', 'febcb464-0b10-4d37-8f39-01821df02634', 'READY', 'READY', 'Import laporan operator: Taufan Hariono', NULL, 'd7ef7183-640b-41d3-9803-9dc37f626b15', '2026-04-15 10:17:10.731713+07') ON CONFLICT DO NOTHING;
INSERT INTO public.rtg_status_history (id, rtg_unit_id, status_kondisi_sebelumnya, status_kondisi_baru, alasan_perubahan, laporan_kerusakan_id, diubah_oleh, created_at) VALUES ('d6e4b9bf-1596-4dbe-a39a-6fdd8372397d', 'f5765dd0-e573-4d23-8954-1bbf51a5c9df', 'READY_CATATAN_RINGAN', 'READY', 'Import laporan operator: Hari Subagio', NULL, 'd7ef7183-640b-41d3-9803-9dc37f626b15', '2026-04-15 10:17:10.735567+07') ON CONFLICT DO NOTHING;
INSERT INTO public.rtg_status_history (id, rtg_unit_id, status_kondisi_sebelumnya, status_kondisi_baru, alasan_perubahan, laporan_kerusakan_id, diubah_oleh, created_at) VALUES ('2a2eaa7d-12ef-4fcb-9ee8-4fe23713c7c3', 'a27fe24e-1891-4082-89cc-19513f7f8b08', 'READY', 'READY', 'Import laporan operator: Arief Kusuma - Vmt tidak bisa auto', '9a085d49-b87e-4482-9cf3-cf75cff3d3f9', 'd7ef7183-640b-41d3-9803-9dc37f626b15', '2026-04-15 10:17:10.741873+07') ON CONFLICT DO NOTHING;
INSERT INTO public.rtg_status_history (id, rtg_unit_id, status_kondisi_sebelumnya, status_kondisi_baru, alasan_perubahan, laporan_kerusakan_id, diubah_oleh, created_at) VALUES ('23caac2b-30f4-49ca-8265-e9bb13ac85ea', 'cd82992c-6eb5-4ec2-8fbc-669fc3d99670', 'READY', 'READY', 'Import laporan operator: Syaiful Huda', NULL, 'd7ef7183-640b-41d3-9803-9dc37f626b15', '2026-04-15 10:17:10.744792+07') ON CONFLICT DO NOTHING;
INSERT INTO public.rtg_status_history (id, rtg_unit_id, status_kondisi_sebelumnya, status_kondisi_baru, alasan_perubahan, laporan_kerusakan_id, diubah_oleh, created_at) VALUES ('d218922d-e078-4f29-9a13-9d495c0b4f49', '0a058b78-046a-4e5a-80ee-360d8f1d06c3', 'READY_CATATAN_BERAT', 'READY_CATATAN_BERAT', 'Import laporan operator: Herry Tampubolon - Cctv mati 1 ', 'c12ac7f7-68ff-4da1-a4d3-d152ca99f9c6', 'd7ef7183-640b-41d3-9803-9dc37f626b15', '2026-04-15 10:17:10.748784+07') ON CONFLICT DO NOTHING;
INSERT INTO public.rtg_status_history (id, rtg_unit_id, status_kondisi_sebelumnya, status_kondisi_baru, alasan_perubahan, laporan_kerusakan_id, diubah_oleh, created_at) VALUES ('8e1ee7cd-f306-4aba-a214-4a779fe4d3e8', '0a058b78-046a-4e5a-80ee-360d8f1d06c3', 'READY_CATATAN_BERAT', 'READY_CATATAN_BERAT', 'Import laporan operator: Herry Tampubolon - Rtg AGGS stering mleyot padahal auto ', 'b4078c73-25f9-4786-8d9e-7f5fd9972d47', 'd7ef7183-640b-41d3-9803-9dc37f626b15', '2026-04-15 10:17:10.753994+07') ON CONFLICT DO NOTHING;
INSERT INTO public.rtg_status_history (id, rtg_unit_id, status_kondisi_sebelumnya, status_kondisi_baru, alasan_perubahan, laporan_kerusakan_id, diubah_oleh, created_at) VALUES ('42e72c61-d727-418c-aa32-0c1333c3586e', '9e098934-f78d-40f1-8322-aa6c77a15117', 'READY', 'READY', 'Import laporan operator: Taufan Hariono - kursi miring', 'fc4d35eb-dbc4-4b15-9648-eba68cd91ff9', 'd7ef7183-640b-41d3-9803-9dc37f626b15', '2026-04-15 10:17:10.758987+07') ON CONFLICT DO NOTHING;
INSERT INTO public.rtg_status_history (id, rtg_unit_id, status_kondisi_sebelumnya, status_kondisi_baru, alasan_perubahan, laporan_kerusakan_id, diubah_oleh, created_at) VALUES ('4759ab23-4886-47aa-8316-165fd1a3a49a', '196941fc-583b-46ed-8c24-2ac5fa72d1e4', 'READY', 'READY_CATATAN_RINGAN', 'Import laporan operator: Herry Tampubolon - Wuilguard farside dan kamera cctv mati ', '1a5749fa-c7ce-44ee-a38e-6b958ac78153', 'd7ef7183-640b-41d3-9803-9dc37f626b15', '2026-04-15 10:17:10.762945+07') ON CONFLICT DO NOTHING;
INSERT INTO public.rtg_status_history (id, rtg_unit_id, status_kondisi_sebelumnya, status_kondisi_baru, alasan_perubahan, laporan_kerusakan_id, diubah_oleh, created_at) VALUES ('bb211f43-47e7-4a33-896d-b90ebe003174', '477a75f2-69bb-4dc5-a709-a6d79d3f428b', 'READY', 'READY', 'Import laporan operator: Taufan Hariono', NULL, 'd7ef7183-640b-41d3-9803-9dc37f626b15', '2026-04-15 10:17:10.765913+07') ON CONFLICT DO NOTHING;
INSERT INTO public.rtg_status_history (id, rtg_unit_id, status_kondisi_sebelumnya, status_kondisi_baru, alasan_perubahan, laporan_kerusakan_id, diubah_oleh, created_at) VALUES ('9845c5c4-06d1-4342-b975-82e555c7b3d2', 'f5765dd0-e573-4d23-8954-1bbf51a5c9df', 'READY', 'READY_CATATAN_RINGAN', 'Import laporan operator: Herry Tampubolon - 1. Trolley Serat/ bergelombang/ tidak lancar 

2. Wiper Mati 
', '5f0ddcfd-51e9-4049-9c50-92bc3d809a45', 'd7ef7183-640b-41d3-9803-9dc37f626b15', '2026-04-15 10:17:10.771263+07') ON CONFLICT DO NOTHING;
INSERT INTO public.rtg_status_history (id, rtg_unit_id, status_kondisi_sebelumnya, status_kondisi_baru, alasan_perubahan, laporan_kerusakan_id, diubah_oleh, created_at) VALUES ('3841a257-1cc2-4393-a29b-2958b9f8f23d', '477a75f2-69bb-4dc5-a709-a6d79d3f428b', 'READY', 'READY', 'Import laporan operator: Syaiful Huda', NULL, 'd7ef7183-640b-41d3-9803-9dc37f626b15', '2026-04-15 10:17:10.777045+07') ON CONFLICT DO NOTHING;
INSERT INTO public.rtg_status_history (id, rtg_unit_id, status_kondisi_sebelumnya, status_kondisi_baru, alasan_perubahan, laporan_kerusakan_id, diubah_oleh, created_at) VALUES ('6993a3c3-8a0f-4929-b4e0-dc907e66855a', '77b73ffc-5695-4ce3-9984-a874e94c5ba8', 'READY_CATATAN_BERAT', 'READY_CATATAN_BERAT', 'Import laporan operator: Taufan Hariono - ac rusak', '7668ab1b-02f4-434e-b6fb-6d21c75f32ef', 'd7ef7183-640b-41d3-9803-9dc37f626b15', '2026-04-15 10:17:10.782466+07') ON CONFLICT DO NOTHING;
INSERT INTO public.rtg_status_history (id, rtg_unit_id, status_kondisi_sebelumnya, status_kondisi_baru, alasan_perubahan, laporan_kerusakan_id, diubah_oleh, created_at) VALUES ('e0cb1f12-16c3-4372-91b4-e6842fdf9567', 'a27fe24e-1891-4082-89cc-19513f7f8b08', 'READY', 'READY_CATATAN_RINGAN', 'Import laporan operator: Herry Tampubolon - Ban Bogie 7 nearseat sobek , wuilguard peyok farside nearside, lampu sorot speader putus ', '26f17251-cc30-4be2-b98b-b491495b3a0f', 'd7ef7183-640b-41d3-9803-9dc37f626b15', '2026-04-15 10:17:10.786446+07') ON CONFLICT DO NOTHING;
INSERT INTO public.rtg_status_history (id, rtg_unit_id, status_kondisi_sebelumnya, status_kondisi_baru, alasan_perubahan, laporan_kerusakan_id, diubah_oleh, created_at) VALUES ('5f99634b-25db-4e9e-a6f8-1adb0ec1acd5', '9e098934-f78d-40f1-8322-aa6c77a15117', 'READY', 'READY', 'Import laporan operator: Herry Tampubolon', NULL, 'd7ef7183-640b-41d3-9803-9dc37f626b15', '2026-04-15 10:17:10.790152+07') ON CONFLICT DO NOTHING;
INSERT INTO public.rtg_status_history (id, rtg_unit_id, status_kondisi_sebelumnya, status_kondisi_baru, alasan_perubahan, laporan_kerusakan_id, diubah_oleh, created_at) VALUES ('e156aa0a-72a0-49a9-96b5-c2aef1a00f36', 'cc89f02d-97c3-44e4-9077-7137ee05a436', 'READY_CATATAN_RINGAN', 'READY_CATATAN_RINGAN', 'Import laporan operator: Herry Tampubolon - Cctv mati ', '6fe63055-4a5e-43bc-99d8-4fa7734917b1', 'd7ef7183-640b-41d3-9803-9dc37f626b15', '2026-04-15 10:17:10.79411+07') ON CONFLICT DO NOTHING;
INSERT INTO public.rtg_status_history (id, rtg_unit_id, status_kondisi_sebelumnya, status_kondisi_baru, alasan_perubahan, laporan_kerusakan_id, diubah_oleh, created_at) VALUES ('ee189101-998d-4dac-8e3d-52d1bf2b689f', 'fcb51c41-1ff6-43c3-b509-69a54b136fc9', 'READY_CATATAN_RINGAN', 'READY_CATATAN_RINGAN', 'Import laporan operator: Taufan Hariono - cabin keropos', '3a0ba01d-5330-4549-83e0-2d90e05dda80', 'd7ef7183-640b-41d3-9803-9dc37f626b15', '2026-04-15 10:17:10.798896+07') ON CONFLICT DO NOTHING;
INSERT INTO public.rtg_status_history (id, rtg_unit_id, status_kondisi_sebelumnya, status_kondisi_baru, alasan_perubahan, laporan_kerusakan_id, diubah_oleh, created_at) VALUES ('6721f8c0-f168-4df1-a445-8e7f7b3f30de', 'a27fe24e-1891-4082-89cc-19513f7f8b08', 'READY_CATATAN_RINGAN', 'READY', 'Penindak lanjut laporan 26f17251-cc30-4be2-b98b-b491495b3a0f: sudah di fix', '26f17251-cc30-4be2-b98b-b491495b3a0f', 'e070afa9-777c-4170-a92a-2d4475bf6380', '2026-04-15 10:23:54.687666+07') ON CONFLICT DO NOTHING;


--
-- Data for Name: rtg_units; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.rtg_units (id, kode_rtg, nama_rtg, group_rtg_id, kapasitas, tahun_pembuatan, manufacturer, spesifikasi, status_kondisi, created_at, updated_at) VALUES ('9e098934-f78d-40f1-8322-aa6c77a15117', '42', 'RTG 42', '08802c4e-8852-4985-a6b5-600f1c1ae965', NULL, NULL, NULL, NULL, 'READY', '2026-04-15 10:13:07.611973', '2026-04-15 10:17:10.788945') ON CONFLICT DO NOTHING;
INSERT INTO public.rtg_units (id, kode_rtg, nama_rtg, group_rtg_id, kapasitas, tahun_pembuatan, manufacturer, spesifikasi, status_kondisi, created_at, updated_at) VALUES ('cc89f02d-97c3-44e4-9077-7137ee05a436', '56', 'Rtg 56', '08802c4e-8852-4985-a6b5-600f1c1ae965', NULL, NULL, NULL, NULL, 'READY_CATATAN_RINGAN', '2026-04-15 10:13:08.257977', '2026-04-15 10:17:10.793096') ON CONFLICT DO NOTHING;
INSERT INTO public.rtg_units (id, kode_rtg, nama_rtg, group_rtg_id, kapasitas, tahun_pembuatan, manufacturer, spesifikasi, status_kondisi, created_at, updated_at) VALUES ('fcb51c41-1ff6-43c3-b509-69a54b136fc9', '43', 'rtg 43', '08802c4e-8852-4985-a6b5-600f1c1ae965', NULL, NULL, NULL, NULL, 'READY_CATATAN_RINGAN', '2026-04-15 10:13:08.308527', '2026-04-15 10:17:10.797891') ON CONFLICT DO NOTHING;
INSERT INTO public.rtg_units (id, kode_rtg, nama_rtg, group_rtg_id, kapasitas, tahun_pembuatan, manufacturer, spesifikasi, status_kondisi, created_at, updated_at) VALUES ('a27fe24e-1891-4082-89cc-19513f7f8b08', '55', 'RTG 55', '08802c4e-8852-4985-a6b5-600f1c1ae965', NULL, NULL, NULL, NULL, 'READY', '2026-04-15 10:13:07.805259', '2026-04-15 10:23:54.68562') ON CONFLICT DO NOTHING;
INSERT INTO public.rtg_units (id, kode_rtg, nama_rtg, group_rtg_id, kapasitas, tahun_pembuatan, manufacturer, spesifikasi, status_kondisi, created_at, updated_at) VALUES ('44f1a1f1-5762-4143-804c-370de03b07d8', '61', 'RTG 61', '08802c4e-8852-4985-a6b5-600f1c1ae965', NULL, NULL, NULL, NULL, 'READY_CATATAN_BERAT', '2026-04-15 10:13:07.323381', '2026-04-15 10:17:10.700063') ON CONFLICT DO NOTHING;
INSERT INTO public.rtg_units (id, kode_rtg, nama_rtg, group_rtg_id, kapasitas, tahun_pembuatan, manufacturer, spesifikasi, status_kondisi, created_at, updated_at) VALUES ('9280d5fe-984f-4f2a-bc7c-73ca1018b9d3', '52', 'RTG 52', '08802c4e-8852-4985-a6b5-600f1c1ae965', NULL, NULL, NULL, NULL, 'READY', '2026-04-15 10:13:07.62504', '2026-04-15 10:17:10.712178') ON CONFLICT DO NOTHING;
INSERT INTO public.rtg_units (id, kode_rtg, nama_rtg, group_rtg_id, kapasitas, tahun_pembuatan, manufacturer, spesifikasi, status_kondisi, created_at, updated_at) VALUES ('a512ce7d-2254-488c-8ee5-7140acfcb544', '38', 'RTG 38', '08802c4e-8852-4985-a6b5-600f1c1ae965', NULL, NULL, NULL, NULL, 'READY_CATATAN_RINGAN', '2026-04-15 10:13:07.629392', '2026-04-15 10:17:10.717006') ON CONFLICT DO NOTHING;
INSERT INTO public.rtg_units (id, kode_rtg, nama_rtg, group_rtg_id, kapasitas, tahun_pembuatan, manufacturer, spesifikasi, status_kondisi, created_at, updated_at) VALUES ('febcb464-0b10-4d37-8f39-01821df02634', '59', 'RTG 59', '08802c4e-8852-4985-a6b5-600f1c1ae965', NULL, NULL, NULL, NULL, 'READY', '2026-04-15 10:13:07.794488', '2026-04-15 10:17:10.730573') ON CONFLICT DO NOTHING;
INSERT INTO public.rtg_units (id, kode_rtg, nama_rtg, group_rtg_id, kapasitas, tahun_pembuatan, manufacturer, spesifikasi, status_kondisi, created_at, updated_at) VALUES ('cd82992c-6eb5-4ec2-8fbc-669fc3d99670', '53', 'RTG 53', '08802c4e-8852-4985-a6b5-600f1c1ae965', NULL, NULL, NULL, NULL, 'READY', '2026-04-15 10:13:07.859516', '2026-04-15 10:17:10.743802') ON CONFLICT DO NOTHING;
INSERT INTO public.rtg_units (id, kode_rtg, nama_rtg, group_rtg_id, kapasitas, tahun_pembuatan, manufacturer, spesifikasi, status_kondisi, created_at, updated_at) VALUES ('0a058b78-046a-4e5a-80ee-360d8f1d06c3', '64', 'Rtg 64', '08802c4e-8852-4985-a6b5-600f1c1ae965', NULL, NULL, NULL, NULL, 'READY_CATATAN_BERAT', '2026-04-15 10:13:07.866868', '2026-04-15 10:17:10.751874') ON CONFLICT DO NOTHING;
INSERT INTO public.rtg_units (id, kode_rtg, nama_rtg, group_rtg_id, kapasitas, tahun_pembuatan, manufacturer, spesifikasi, status_kondisi, created_at, updated_at) VALUES ('196941fc-583b-46ed-8c24-2ac5fa72d1e4', '57', 'RTG 57', '08802c4e-8852-4985-a6b5-600f1c1ae965', NULL, NULL, NULL, NULL, 'READY_CATATAN_RINGAN', '2026-04-15 10:13:07.621247', '2026-04-15 10:17:10.761749') ON CONFLICT DO NOTHING;
INSERT INTO public.rtg_units (id, kode_rtg, nama_rtg, group_rtg_id, kapasitas, tahun_pembuatan, manufacturer, spesifikasi, status_kondisi, created_at, updated_at) VALUES ('f5765dd0-e573-4d23-8954-1bbf51a5c9df', '45', 'RTG 45', '37af9d51-1a00-450e-9e8e-e7f5feb142f5', NULL, NULL, NULL, NULL, 'READY_CATATAN_RINGAN', '2026-04-15 10:13:07.30576', '2026-04-15 10:17:10.768904') ON CONFLICT DO NOTHING;
INSERT INTO public.rtg_units (id, kode_rtg, nama_rtg, group_rtg_id, kapasitas, tahun_pembuatan, manufacturer, spesifikasi, status_kondisi, created_at, updated_at) VALUES ('477a75f2-69bb-4dc5-a709-a6d79d3f428b', '49', 'RTG 49', '08802c4e-8852-4985-a6b5-600f1c1ae965', NULL, NULL, NULL, NULL, 'READY', '2026-04-15 10:13:07.738649', '2026-04-15 10:17:10.775738') ON CONFLICT DO NOTHING;
INSERT INTO public.rtg_units (id, kode_rtg, nama_rtg, group_rtg_id, kapasitas, tahun_pembuatan, manufacturer, spesifikasi, status_kondisi, created_at, updated_at) VALUES ('77b73ffc-5695-4ce3-9984-a874e94c5ba8', '48', 'rtg 48', '08802c4e-8852-4985-a6b5-600f1c1ae965', NULL, NULL, NULL, NULL, 'READY_CATATAN_BERAT', '2026-04-15 10:13:08.153233', '2026-04-15 10:17:10.781576') ON CONFLICT DO NOTHING;


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.users (id, email, nama, password, role, created_at) VALUES ('d7ef7183-640b-41d3-9803-9dc37f626b15', 'operasional@tps.com', 'Operasional Team', '$2b$10$jqs7krW7r2aKO2Qt4lb93exuuTXUl0ejWy2hh/dyQadao4wWS8LGq', 'operasional', '2026-04-14 09:45:37.68004') ON CONFLICT DO NOTHING;
INSERT INTO public.users (id, email, nama, password, role, created_at) VALUES ('e070afa9-777c-4170-a92a-2d4475bf6380', 'peralatan@tps.com', 'Tim Peralatan Terminal', '$2b$10$jqs7krW7r2aKO2Qt4lb93exuuTXUl0ejWy2hh/dyQadao4wWS8LGq', 'peralatan_terminal', '2026-04-14 09:45:37.68004') ON CONFLICT DO NOTHING;
INSERT INTO public.users (id, email, nama, password, role, created_at) VALUES ('bc491772-0b81-4fbd-acb4-bae7cb10bcec', 'perencanaan@tps.com', 'Tim Perencanaan Persediaan', '$2b$10$jqs7krW7r2aKO2Qt4lb93exuuTXUl0ejWy2hh/dyQadao4wWS8LGq', 'perencanaan_persediaan', '2026-04-14 09:45:37.68004') ON CONFLICT DO NOTHING;
INSERT INTO public.users (id, email, nama, password, role, created_at) VALUES ('e0552b99-15e5-4798-9650-882a7d608814', 'fasilitas@tps.com', 'Tim Fasilitas', '$2b$10$jqs7krW7r2aKO2Qt4lb93exuuTXUl0ejWy2hh/dyQadao4wWS8LGq', 'fasilitas', '2026-04-14 09:45:37.68004') ON CONFLICT DO NOTHING;


--
-- Name: laporan_kerusakan laporan_kerusakan_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.laporan_kerusakan
    ADD CONSTRAINT laporan_kerusakan_pkey PRIMARY KEY (id);


--
-- Name: penindaklanjut_kerusakan penindaklanjut_kerusakan_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.penindaklanjut_kerusakan
    ADD CONSTRAINT penindaklanjut_kerusakan_pkey PRIMARY KEY (id);


--
-- Name: rtg_groups rtg_groups_nama_group_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rtg_groups
    ADD CONSTRAINT rtg_groups_nama_group_key UNIQUE (nama_group);


--
-- Name: rtg_groups rtg_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rtg_groups
    ADD CONSTRAINT rtg_groups_pkey PRIMARY KEY (id);


--
-- Name: rtg_status_history rtg_status_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rtg_status_history
    ADD CONSTRAINT rtg_status_history_pkey PRIMARY KEY (id);


--
-- Name: rtg_units rtg_units_kode_rtg_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rtg_units
    ADD CONSTRAINT rtg_units_kode_rtg_key UNIQUE (kode_rtg);


--
-- Name: rtg_units rtg_units_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rtg_units
    ADD CONSTRAINT rtg_units_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_laporan_kerusakan_ditugaskan; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_laporan_kerusakan_ditugaskan ON public.laporan_kerusakan USING btree (penindak_lanjut);


--
-- Name: idx_laporan_kerusakan_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_laporan_kerusakan_status ON public.laporan_kerusakan USING btree (status_kerusakan);


--
-- Name: idx_laporan_kerusakan_tanggal; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_laporan_kerusakan_tanggal ON public.laporan_kerusakan USING btree (tanggal_laporan DESC);


--
-- Name: idx_penindaklanjut_laporan; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_penindaklanjut_laporan ON public.penindaklanjut_kerusakan USING btree (laporan_kerusakan_id);


--
-- Name: idx_penindaklanjut_penangan; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_penindaklanjut_penangan ON public.penindaklanjut_kerusakan USING btree (ditangani_oleh_id);


--
-- Name: idx_rtg_status_history_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rtg_status_history_created_at ON public.rtg_status_history USING btree (created_at);


--
-- Name: idx_rtg_status_history_unit_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rtg_status_history_unit_date ON public.rtg_status_history USING btree (rtg_unit_id, created_at);


--
-- Name: idx_rtg_status_history_unit_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rtg_status_history_unit_id ON public.rtg_status_history USING btree (rtg_unit_id);


--
-- Name: idx_rtg_units_group; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rtg_units_group ON public.rtg_units USING btree (group_rtg_id);


--
-- Name: idx_rtg_units_kode; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rtg_units_kode ON public.rtg_units USING btree (kode_rtg);


--
-- Name: idx_rtg_units_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rtg_units_status ON public.rtg_units USING btree (status_kondisi);


--
-- Name: laporan_kerusakan laporan_kerusakan_rtg_unit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.laporan_kerusakan
    ADD CONSTRAINT laporan_kerusakan_rtg_unit_id_fkey FOREIGN KEY (rtg_unit_id) REFERENCES public.rtg_units(id) ON DELETE CASCADE;


--
-- Name: penindaklanjut_kerusakan penindaklanjut_kerusakan_ditangani_oleh_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.penindaklanjut_kerusakan
    ADD CONSTRAINT penindaklanjut_kerusakan_ditangani_oleh_id_fkey FOREIGN KEY (ditangani_oleh_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: penindaklanjut_kerusakan penindaklanjut_kerusakan_laporan_kerusakan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.penindaklanjut_kerusakan
    ADD CONSTRAINT penindaklanjut_kerusakan_laporan_kerusakan_id_fkey FOREIGN KEY (laporan_kerusakan_id) REFERENCES public.laporan_kerusakan(id) ON DELETE CASCADE;


--
-- Name: rtg_status_history rtg_status_history_laporan_kerusakan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rtg_status_history
    ADD CONSTRAINT rtg_status_history_laporan_kerusakan_id_fkey FOREIGN KEY (laporan_kerusakan_id) REFERENCES public.laporan_kerusakan(id) ON DELETE SET NULL;


--
-- Name: rtg_status_history rtg_status_history_rtg_unit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rtg_status_history
    ADD CONSTRAINT rtg_status_history_rtg_unit_id_fkey FOREIGN KEY (rtg_unit_id) REFERENCES public.rtg_units(id) ON DELETE CASCADE;


--
-- Name: rtg_units rtg_units_group_rtg_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rtg_units
    ADD CONSTRAINT rtg_units_group_rtg_id_fkey FOREIGN KEY (group_rtg_id) REFERENCES public.rtg_groups(id) ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict Xs2btzlsF2wfQfHPizniwZKkJdRsRyoA1s2QJvTxiePZsAC0FvHRI11lDzXemJ2

