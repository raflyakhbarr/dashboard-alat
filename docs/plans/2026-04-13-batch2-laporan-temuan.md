# Batch 2 - Laporan Temuan Operator Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement fitur laporan temuan untuk Operator melaporkan kerusakan RTG dengan foto, workflow status, dan notifikasi ke Operasional/Admin

**Architecture:** Server Components + Server Actions (Next.js 16) - form sebagai Server Component, Server Actions untuk submit dan upload foto, foto disimpan di local file system (public/uploads/temuan/), path disimpan di PostgreSQL sebagai JSONB array

**Tech Stack:** Next.js 16 (App Router), PostgreSQL, pg library, shadcn/ui components, TypeScript, Server Actions, multipart/form-data untuk file upload

---

## Task 1: Create Database Migration

**Files:**
- Create: `lib/migrations/004_create_temuan_rtg.sql`

**Step 1: Write the migration SQL**

```sql
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
```

**Step 2: Run migration manually in PostgreSQL**

Run: `psql -h localhost -U postgres -d dashboard_alat -f lib/migrations/004_create_temuan_rtg.sql`
Expected: Output showing table created successfully

**Step 3: Verify table creation**

Run in psql: `\d temuan_rtg`
Expected: Table schema displayed with all columns and constraints

**Step 4: Commit**

```bash
git add lib/migrations/004_create_temuan_rtg.sql
git commit -m "feat: create temuan_rtg table with indexes"
```

---

## Task 2: Add TypeScript Types

**Files:**
- Modify: `types/rtg.ts`

**Step 1: Add TemuanRTG types**

Add after DashboardStats interface (around line 75):

```typescript
// ============= TEMUAN RTG TYPES =============

export type StatusTemuan = 'DIPERIKSA' | 'DITINDAKLANJUTI' | 'SELESAI' | 'DITUTUP';

export interface TemuanRTG {
  id: string;
  rtg_unit_id: string;
  pelapor_id: string;
  tanggal_temuan: string;
  waktu_temuan: string;
  jenis_temuan: string;
  deskripsi_temuan: string | null;
  foto: string[];
  status_temuan: StatusTemuan;
  created_at: string;
}

export interface TemuanRTGWithDetails extends TemuanRTG {
  rtg_unit: {
    kode_rtg: string;
    nama_rtg: string;
  };
  pelapor: {
    nama: string;
    email: string;
  };
}

export interface TemuanRTGInput {
  rtg_unit_id: string;
  tanggal_temuan: string;
  waktu_temuan: string;
  jenis_temuan: string;
  deskripsi_temuan?: string;
  foto?: string[];
}
```

**Step 2: Verify TypeScript compilation**

Run: `npm run build`
Expected: Build succeeds without type errors

**Step 3: Commit**

```bash
git add types/rtg.ts
git commit -m "feat: add TemuanRTG TypeScript types"
```

---

## Task 3: Implement Service Layer Functions

**Files:**
- Modify: `lib/rtg.ts`

**Step 1: Add TemuanRTG service functions**

Add at end of file (after getRTGUnitsByStatus function):

```typescript
// ============= TEMUAN RTG =============

export async function getAllTemuan(): Promise<TemuanRTGWithDetails[]> {
  const result = await pool.query(`
    SELECT
      t.*,
      u.kode_rtg,
      u.nama_rtg,
      p.nama as pelapor_nama,
      p.email as pelapor_email
    FROM temuan_rtg t
    LEFT JOIN rtg_units u ON t.rtg_unit_id = u.id
    LEFT JOIN users p ON t.pelapor_id = p.id
    ORDER BY t.tanggal_temuan DESC, t.waktu_temuan DESC
  `);

  return result.rows.map((row: any) => ({
    id: row.id,
    rtg_unit_id: row.rtg_unit_id,
    pelapor_id: row.pelapor_id,
    tanggal_temuan: row.tanggal_temuan,
    waktu_temuan: row.waktu_temuan,
    jenis_temuan: row.jenis_temuan,
    deskripsi_temuan: row.deskripsi_temuan,
    foto: row.foto || [],
    status_temuan: row.status_temuan,
    created_at: row.created_at,
    rtg_unit: {
      kode_rtg: row.kode_rtg,
      nama_rtg: row.nama_rtg,
    },
    pelapor: {
      nama: row.pelapor_nama,
      email: row.pelapor_email,
    },
  }));
}

export async function getTemuanById(id: string): Promise<TemuanRTGWithDetails | null> {
  const result = await pool.query(`
    SELECT
      t.*,
      u.kode_rtg,
      u.nama_rtg,
      p.nama as pelapor_nama,
      p.email as pelapor_email
    FROM temuan_rtg t
    LEFT JOIN rtg_units u ON t.rtg_unit_id = u.id
    LEFT JOIN users p ON t.pelapor_id = p.id
    WHERE t.id = $1
  `, [id]);

  if (result.rows.length === 0) return null;

  const row = result.rows[0];
  return {
    id: row.id,
    rtg_unit_id: row.rtg_unit_id,
    pelapor_id: row.pelapor_id,
    tanggal_temuan: row.tanggal_temuan,
    waktu_temuan: row.waktu_temuan,
    jenis_temuan: row.jenis_temuan,
    deskripsi_temuan: row.deskripsi_temuan,
    foto: row.foto || [],
    status_temuan: row.status_temuan,
    created_at: row.created_at,
    rtg_unit: {
      kode_rtg: row.kode_rtg,
      nama_rtg: row.nama_rtg,
    },
    pelapor: {
      nama: row.pelapor_nama,
      email: row.pelapor_email,
    },
  };
}

export async function getTemuanByPelapor(pelaporId: string): Promise<TemuanRTGWithDetails[]> {
  const result = await pool.query(`
    SELECT
      t.*,
      u.kode_rtg,
      u.nama_rtg,
      p.nama as pelapor_nama,
      p.email as pelapor_email
    FROM temuan_rtg t
    LEFT JOIN rtg_units u ON t.rtg_unit_id = u.id
    LEFT JOIN users p ON t.pelapor_id = p.id
    WHERE t.pelapor_id = $1
    ORDER BY t.tanggal_temuan DESC, t.waktu_temuan DESC
  `, [pelaporId]);

  return result.rows.map((row: any) => ({
    id: row.id,
    rtg_unit_id: row.rtg_unit_id,
    pelapor_id: row.pelapor_id,
    tanggal_temuan: row.tanggal_temuan,
    waktu_temuan: row.waktu_temuan,
    jenis_temuan: row.jenis_temuan,
    deskripsi_temuan: row.deskripsi_temuan,
    foto: row.foto || [],
    status_temuan: row.status_temuan,
    created_at: row.created_at,
    rtg_unit: {
      kode_rtg: row.kode_rtg,
      nama_rtg: row.nama_rtg,
    },
    pelapor: {
      nama: row.pelapor_nama,
      email: row.pelapor_email,
    },
  }));
}

export async function getTemuanByStatus(status: StatusTemuan): Promise<TemuanRTGWithDetails[]> {
  const result = await pool.query(`
    SELECT
      t.*,
      u.kode_rtg,
      u.nama_rtg,
      p.nama as pelapor_nama,
      p.email as pelapor_email
    FROM temuan_rtg t
    LEFT JOIN rtg_units u ON t.rtg_unit_id = u.id
    LEFT JOIN users p ON t.pelapor_id = p.id
    WHERE t.status_temuan = $1
    ORDER BY t.tanggal_temuan DESC, t.waktu_temuan DESC
  `, [status]);

  return result.rows.map((row: any) => ({
    id: row.id,
    rtg_unit_id: row.rtg_unit_id,
    pelapor_id: row.pelapor_id,
    tanggal_temuan: row.tanggal_temuan,
    waktu_temuan: row.waktu_temuan,
    jenis_temuan: row.jenis_temuan,
    deskripsi_temuan: row.deskripsi_temuan,
    foto: row.foto || [],
    status_temuan: row.status_temuan,
    created_at: row.created_at,
    rtg_unit: {
      kode_rtg: row.kode_rtg,
      nama_rtg: row.nama_rtg,
    },
    pelapor: {
      nama: row.pelapor_nama,
      email: row.pelapor_email,
    },
  }));
}

export async function createTemuan(input: TemuanRTGInput & { pelapor_id: string }): Promise<TemuanRTG> {
  const {
    rtg_unit_id,
    pelapor_id,
    tanggal_temuan,
    waktu_temuan,
    jenis_temuan,
    deskripsi_temuan,
    foto = [],
  } = input;

  const result = await pool.query(
    `INSERT INTO temuan_rtg (rtg_unit_id, pelapor_id, tanggal_temuan, waktu_temuan, jenis_temuan, deskripsi_temuan, foto)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [rtg_unit_id, pelapor_id, tanggal_temuan, waktu_temuan, jenis_temuan, deskripsi_temuan || null, JSON.stringify(foto)]
  );

  return result.rows[0];
}

export async function updateTemuanStatus(id: string, status: StatusTemuan): Promise<TemuanRTG | null> {
  const result = await pool.query(
    'UPDATE temuan_rtg SET status_temuan = $1 WHERE id = $2 RETURNING *',
    [status, id]
  );

  if (result.rows.length === 0) return null;
  return result.rows[0];
}

export async function deleteTemuan(id: string): Promise<boolean> {
  const result = await pool.query('DELETE FROM temuan_rtg WHERE id = $1', [id]);
  return (result.rowCount || 0) > 0;
}

export async function getTemuanCountByStatus(): Promise<Record<StatusTemuan, number>> {
  const result = await pool.query(`
    SELECT
      status_temuan,
      COUNT(*) as count
    FROM temuan_rtg
    GROUP BY status_temuan
  `);

  const counts: Record<string, number> = {
    DIPERIKSA: 0,
    DITINDAKLANJUTI: 0,
    SELESAI: 0,
    DITUTUP: 0,
  };

  result.rows.forEach((row: any) => {
    counts[row.status_temuan] = parseInt(row.count);
  });

  return counts as Record<StatusTemuan, number>;
}
```

**Step 2: Add import for new types**

Add to existing imports at top:
```typescript
import {
  // ... existing imports
  TemuanRTG,
  TemuanRTGWithDetails,
  TemuanRTGInput,
  StatusTemuan,
} from '@/types/rtg';
```

**Step 3: Verify TypeScript compilation**

Run: `npm run build`
Expected: Build succeeds without type errors

**Step 4: Commit**

```bash
git add lib/rtg.ts
git commit -m "feat: add TemuanRTG service layer functions"
```

---

## Task 4: Create Photo Upload Utility

**Files:**
- Create: `lib/upload.ts`

**Step 1: Create photo upload utility**

```typescript
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads', 'temuan');

// Ensure upload directory exists
export async function ensureUploadDir() {
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true });
  }
}

export async function uploadPhotos(files: File[] | FileList): Promise<string[]> {
  await ensureUploadDir();

  const uploadPromises = Array.from(files).slice(0, 3).map(async (file) => {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error(`Invalid file type: ${file.type}. Only JPG, PNG, and WEBP allowed.`);
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      throw new Error(`File too large: ${file.name}. Max size is 5MB.`);
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const ext = file.name.split('.').pop();
    const filename = `temuan-${timestamp}-${randomStr}.${ext}`;

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Write file to disk
    const filepath = join(UPLOAD_DIR, filename);
    await writeFile(filepath, buffer);

    // Return public URL path
    return `/uploads/temuan/${filename}`;
  });

  return Promise.all(uploadPromises);
}

export function isAutoUpdateKeyword(jenisTemuan: string): boolean {
  const keywords = ['berat', 'rusak parah', 'bahaya', 'bocor', 'patah'];
  const lowerJenis = jenisTemuan.toLowerCase();
  return keywords.some(keyword => lowerJenis.includes(keyword));
}
```

**Step 3: Commit**

```bash
git add lib/upload.ts
git commit -m "feat: add photo upload utility with validation"
```

---

## Task 5: Create Operator - Lapor Temuan Page

**Files:**
- Create: `app/operator/lapor-temuan/page.tsx`
- Create: `app/operator/lapor-temuan/actions.ts`

**Step 1: Create server actions file**

```typescript
'use server';

import { redirect, revalidatePath } from 'next/navigation';
import { createTemuan, updateRTGUnitStatus } from '@/lib/rtg';
import { uploadPhotos, isAutoUpdateKeyword } from '@/lib/upload';
import { getSession } from '@/lib/auth';

export async function submitLaporan(formData: FormData) {
  const session = await getSession();

  if (!session || session.role !== 'operator') {
    redirect('/login');
  }

  try {
    // Extract form data
    const rtg_unit_id = formData.get('rtg_unit_id') as string;
    const tanggal_temuan = formData.get('tanggal_temuan') as string;
    const waktu_temuan = formData.get('waktu_temuan') as string;
    const jenis_temuan = formData.get('jenis_temuan') as string;
    const deskripsi_temuan = formData.get('deskripsi_temuan') as string;

    // Handle photo upload
    const photoFiles = formData.getAll('foto') as File[];
    const foto = photoFiles.length > 0 && photoFiles[0].size > 0
      ? await uploadPhotos(photoFiles)
      : [];

    // Create temuan record
    await createTemuan({
      rtg_unit_id,
      pelapor_id: session.id,
      tanggal_temuan,
      waktu_temuan,
      jenis_temuan,
      deskripsi_temuan,
      foto,
    });

    // Auto-update RTG status if keyword detected
    if (isAutoUpdateKeyword(jenis_temuan)) {
      await updateRTGUnitStatus(rtg_unit_id, 'TIDAK_READY');
    }

    revalidatePath('/operator/riwayat-temuan');
    redirect('/operator/riwayat-temuan');
  } catch (error: any) {
    return { error: error.message };
  }
}
```

**Step 2: Create the page component**

```typescript
import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getAllRTGUnits } from '@/lib/rtg';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { submitLaporan } from './actions';
import { Camera } from 'lucide-react';

export default async function LaporTemuanPage() {
  const session = await getSession();

  if (!session || session.role !== 'operator') {
    redirect('/login');
  }

  const rtgUnits = await getAllRTGUnits();

  // Get current date and time in Indonesia timezone
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const currentTime = now.toTimeString().slice(0, 5);

  return (
    <SidebarProvider>
      <AppSidebar user={{ nama: session.nama, email: session.email, role: session.role }} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2">
          <div className="flex items-center gap-2 px-4 w-full">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Buat Laporan Temuan</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-6">
          <div className="flex items-center gap-2">
            <Camera className="h-6 w-6" />
            <h1 className="text-2xl font-bold">Buat Laporan Temuan</h1>
          </div>

          <Card className="max-w-3xl">
            <CardHeader>
              <CardTitle>Form Laporan Temuan</CardTitle>
              <CardDescription>
                Laporkan kerusakan atau masalah pada RTG. Foto bersifat opsional.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form action={submitLaporan} className="space-y-6">
                {/* Pilih RTG Unit */}
                <div className="space-y-2">
                  <Label htmlFor="rtg_unit_id">RTG Unit *</Label>
                  <Select name="rtg_unit_id" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih RTG Unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {rtgUnits.map((unit) => (
                        <SelectItem key={unit.id} value={unit.id}>
                          {unit.kode_rtg} - {unit.nama_rtg}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Tanggal Temuan */}
                <div className="space-y-2">
                  <Label htmlFor="tanggal_temuan">Tanggal Temuan *</Label>
                  <Input
                    type="date"
                    id="tanggal_temuan"
                    name="tanggal_temuan"
                    defaultValue={today}
                    required
                  />
                </div>

                {/* Waktu Temuan */}
                <div className="space-y-2">
                  <Label htmlFor="waktu_temuan">Waktu Temuan *</Label>
                  <Input
                    type="time"
                    id="waktu_temuan"
                    name="waktu_temuan"
                    defaultValue={currentTime}
                    required
                  />
                </div>

                {/* Jenis Temuan */}
                <div className="space-y-2">
                  <Label htmlFor="jenis_temuan">Jenis Temuan *</Label>
                  <Input
                    type="text"
                    id="jenis_temuan"
                    name="jenis_temuan"
                    placeholder="Contoh: Kursi rusak, Kaca retak, Ban bocor"
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    Jelaskan jenis kerusakan atau masalah yang ditemukan
                  </p>
                </div>

                {/* Deskripsi Temuan */}
                <div className="space-y-2">
                  <Label htmlFor="deskripsi_temuan">Deskripsi</Label>
                  <Textarea
                    id="deskripsi_temuan"
                    name="deskripsi_temuan"
                    placeholder="Jelaskan detail masalah..."
                    rows={4}
                  />
                </div>

                {/* Upload Foto */}
                <div className="space-y-2">
                  <Label htmlFor="foto">Foto (Opsional)</Label>
                  <Input
                    type="file"
                    id="foto"
                    name="foto"
                    accept="image/*"
                    multiple
                    className="cursor-pointer"
                  />
                  <p className="text-sm text-muted-foreground">
                    Maksimal 3 foto, format JPG/PNG/WEBP, max 5MB per file
                  </p>
                </div>

                {/* Submit Button */}
                <div className="flex gap-4">
                  <Button type="submit" className="flex-1">
                    Submit Laporan
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => window.history.back()}
                  >
                    Batal
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
```

**Step 3: Create uploads directory**

Run: `mkdir -p public/uploads/temuan`

**Step 4: Test the page**

Run: `npm run dev`
Visit: `http://localhost:3000/operator/lapor-temuan`
Expected: Form renders correctly with RTG units in dropdown

**Step 5: Commit**

```bash
git add app/operator/lapor-temuan/ public/uploads/
git commit -m "feat: add operator lapor temuan page with form"
```

---

## Task 6: Create Operator - Riwayat Temuan Page

**Files:**
- Create: `app/operator/riwayat-temuan/page.tsx`

**Step 1: Create the page component**

```typescript
import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getTemuanByPelapor } from '@/lib/rtg';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { History } from 'lucide-react';
import { type StatusTemuan, StatusTemuanLabels } from '@/types/rtg';

const statusColors: Record<StatusTemuan, string> = {
  DIPERIKSA: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  DITINDAKLANJUTI: 'bg-blue-100 text-blue-800 border-blue-200',
  SELESAI: 'bg-green-100 text-green-800 border-green-200',
  DITUTUP: 'bg-gray-100 text-gray-800 border-gray-200',
};

export default async function RiwayatTemuanPage() {
  const session = await getSession();

  if (!session || session.role !== 'operator') {
    redirect('/login');
  }

  const temuanList = await getTemuanByPelapor(session.id);

  return (
    <SidebarProvider>
      <AppSidebar user={{ nama: session.nama, email: session.email, role: session.role }} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2">
          <div className="flex items-center gap-2 px-4 w-full">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Riwayat Laporan</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-6">
          <div className="flex items-center gap-2">
            <History className="h-6 w-6" />
            <h1 className="text-2xl font-bold">Riwayat Laporan Temuan</h1>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Semua Laporan Anda</CardTitle>
              <CardDescription>
                Total: {temuanList.length} laporan
              </CardDescription>
            </CardHeader>
            <CardContent>
              {temuanList.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Waktu</TableHead>
                      <TableHead>RTG</TableHead>
                      <TableHead>Jenis Temuan</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {temuanList.map((temuan) => (
                      <TableRow key={temuan.id}>
                        <TableCell>{temuan.tanggal_temuan}</TableCell>
                        <TableCell>{temuan.waktu_temuan}</TableCell>
                        <TableCell>
                          {temuan.rtg_unit.kode_rtg} - {temuan.rtg_unit.nama_rtg}
                        </TableCell>
                        <TableCell>{temuan.jenis_temuan}</TableCell>
                        <TableCell>
                          <Badge className={statusColors[temuan.status_temuan]}>
                            {StatusTemuanLabels[temuan.status_temuan] || temuan.status_temuan}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  Belum ada laporan temuan.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
```

**Step 2: Add StatusTemuanLabels to types**

Add to `types/rtg.ts`:
```typescript
export const StatusTemuanLabels: Record<StatusTemuan, string> = {
  DIPERIKSA: 'Diperiksa',
  DITINDAKLANJUTI: 'Ditindaklanjuti',
  SELESAI: 'Selesai',
  DITUTUP: 'Ditutup',
};
```

**Step 3: Test the page**

Visit: `http://localhost:3000/operator/riwayat-temuan`
Expected: Shows list of temuan (empty initially)

**Step 4: Commit**

```bash
git add app/operator/riwayat-temuan/ types/rtg.ts
git commit -m "feat: add operator riwayat temuan page"
```

---

## Task 7: Create Operasional - Daftar Temuan Page

**Files:**
- Create: `app/operasional/daftar-temuan/page.tsx`
- Create: `app/operasional/daftar-temuan/actions.ts`

**Step 1: Create server actions for status update**

```typescript
'use server';

import { revalidatePath } from 'next/navigation';
import { updateTemuanStatus } from '@/lib/rtg';

export async function updateStatus(formData: FormData) {
  const id = formData.get('id') as string;
  const status = formData.get('status') as any;

  await updateTemuanStatus(id, status);
  revalidatePath('/operasional/daftar-temuan');
}
```

**Step 2: Create the page component**

```typescript
import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getAllTemuan } from '@/lib/rtg';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { type StatusTemuan, StatusTemuanLabels } from '@/types/rtg';
import { updateStatus } from './actions';

const statusColors: Record<StatusTemuan, string> = {
  DIPERIKSA: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  DITINDAKLANJUTI: 'bg-blue-100 text-blue-800 border-blue-200',
  SELESAI: 'bg-green-100 text-green-800 border-green-200',
  DITUTUP: 'bg-gray-100 text-gray-800 border-gray-200',
};

export default async function DaftarTemuanPage() {
  const session = await getSession();

  if (!session || (session.role !== 'operasional' && session.role !== 'admin')) {
    redirect('/login');
  }

  const temuanList = await getAllTemuan();

  return (
    <SidebarProvider>
      <AppSidebar user={{ nama: session.nama, email: session.email, role: session.role }} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2">
          <div className="flex items-center gap-2 px-4 w-full">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Daftar Temuan</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-6">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-6 w-6" />
            <h1 className="text-2xl font-bold">Daftar Semua Temuan</h1>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Semua Laporan Temuan</CardTitle>
              <CardDescription>
                Total: {temuanList.length} laporan
              </CardDescription>
            </CardHeader>
            <CardContent>
              {temuanList.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Waktu</TableHead>
                      <TableHead>RTG</TableHead>
                      <TableHead>Jenis Temuan</TableHead>
                      <TableHead>Pelapor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {temuanList.map((temuan) => (
                      <TableRow key={temuan.id}>
                        <TableCell>{temuan.tanggal_temuan}</TableCell>
                        <TableCell>{temuan.waktu_temuan}</TableCell>
                        <TableCell>
                          {temuan.rtg_unit.kode_rtg} - {temuan.rtg_unit.nama_rtg}
                        </TableCell>
                        <TableCell>{temuan.jenis_temuan}</TableCell>
                        <TableCell>{temuan.pelapor.nama}</TableCell>
                        <TableCell>
                          <Badge className={statusColors[temuan.status_temuan]}>
                            {StatusTemuanLabels[temuan.status_temuan] || temuan.status_temuan}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {temuan.status_temuan === 'DIPERIKSA' && (
                            <form action={updateStatus}>
                              <input type="hidden" name="id" value={temuan.id} />
                              <input type="hidden" name="status" value="DITINDAKLANJUTI" />
                              <Button size="sm" variant="outline">
                                Proses
                              </Button>
                            </form>
                          )}
                          {temuan.status_temuan === 'DITINDAKLANJUTI' && (
                            <div className="flex gap-2 justify-end">
                              <form action={updateStatus}>
                                <input type="hidden" name="id" value={temuan.id} />
                                <input type="hidden" name="status" value="SELESAI" />
                                <Button size="sm" variant="outline">
                                  Selesai
                                </Button>
                              </form>
                              <form action={updateStatus}>
                                <input type="hidden" name="id" value={temuan.id} />
                                <input type="hidden" name="status" value="DITUTUP" />
                                <Button size="sm" variant="outline">
                                  Tutup
                                </Button>
                              </form>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  Belum ada laporan temuan.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
```

**Step 3: Test the page**

Visit: `http://localhost:3000/operasional/daftar-temuan`
Expected: Shows list of all temuan with action buttons

**Step 4: Commit**

```bash
git add app/operasional/daftar-temuan/
git commit -m "feat: add operasional daftar temuan page with status updates"
```

---

## Task 8: Update App Sidebar with Operator and Operasional Menus

**Files:**
- Modify: `components/app-sidebar.tsx`

**Step 1: Add operator and operasional menu items**

Add new menu items in the menuItems array (after admin menu items):

```typescript
// For operator role
if (user?.role === 'operator') {
  menuItems.push({
    title: 'Laporan Temuan',
    items: [
      {
        title: 'Buat Laporan',
        url: '/operator/lapor-temuan',
      },
      {
        title: 'Riwayat Laporan',
        url: '/operator/riwayat-temuan',
      },
    ],
  });
}

// For operasional role
if (user?.role === 'operasional' || user?.role === 'admin') {
  const diperiksaCount = await getTemuanCountByStatus().then(counts => counts.DIPERIKSA);

  menuItems.push({
    title: 'Temuan Masuk',
    items: [
      {
        title: 'Daftar Temuan',
        url: '/operasional/daftar-temuan',
        badge: diperiksaCount > 0 ? `${diperiksaCount}` : undefined,
      },
    ],
  });
}
```

**Step 2: Add import for getTemuanCountByStatus**

Add to imports:
```typescript
import { getTemuanCountByStatus } from '@/lib/rtg';
```

**Step 3: Test sidebar**

Login as operator, check if "Laporan Temuan" menu appears
Login as operasional/admin, check if "Temuan Masuk" menu appears with badge

**Step 4: Commit**

```bash
git add components/app-sidebar.tsx
git commit -m "feat: add operator and operasional menus to sidebar with badge"
```

---

## Task 9: Add Textarea Component

**Files:**
- Add shadcn textarea component

**Step 1: Install shadcn textarea**

Run: `npx shadcn@latest add textarea`
Expected: Component installed successfully

**Step 2: Commit**

```bash
git add components/ui/textarea.tsx
git commit -m "feat: add shadcn textarea component"
```

---

## Task 10: Add Badge Component

**Files:**
- Add shadcn badge component

**Step 1: Install shadcn badge**

Run: `npx shadcn@latest add badge`
Expected: Component installed successfully

**Step 2: Commit**

```bash
git add components/ui/badge.tsx
git commit -m "feat: add shadcn badge component"
```

---

## Task 11: End-to-End Testing

**Step 1: Test operator flow**

1. Login as operator (operator@tps.com / operator123)
2. Visit "Buat Laporan" menu
3. Fill form with test data
4. Submit form
5. Verify redirect to "Riwayat Laporan"
6. Verify new report appears in table

**Step 2: Test operasional flow**

1. Login as operasional (operasional@tps.com / operasional123)
2. Check sidebar badge shows count
3. Visit "Daftar Temuan"
4. Verify new report appears
5. Click "Proses" button
6. Verify status changes to "DITINDAKLANJUTI"
7. Click "Selesai" button
8. Verify status changes to "SELESAI"

**Step 3: Test auto-update RTG status**

1. Login as operator
2. Create report with jenis_temuan containing "berat" or "bocor"
3. Check RTG units page as admin
4. Verify RTG status changed to "TIDAK_READY"

**Step 4: Test photo upload**

1. Create report with photos
2. Check public/uploads/temuan/ directory
3. Verify files are saved
4. Check database foto column contains paths

**Step 5: Final build verification**

Run: `npm run build`
Expected: Build succeeds without errors

**Step 6: Commit any fixes**

```bash
git add -A
git commit -m "fix: address issues found during E2E testing"
```

---

## Task 12: Documentation Update

**Files:**
- Modify: `docs/database-schema-rtg.md`

**Step 1: Update database schema documentation**

Add to existing documentation (temuan_rtg section already exists, just verify it's correct)

**Step 2: Create feature summary**

Create: `docs/features/batch2-laporan-temuan.md`

```markdown
# Batch 2: Laporan Temuan (Operator)

## Summary
Implementasi fitur pelaporan temuan kerusakan RTG oleh operator dengan upload foto, workflow status, dan notifikasi ke operasional/admin.

## Features
- Form laporan temuan untuk operator dengan upload foto (opsional, max 3)
- Riwayat laporan untuk operator
- Daftar temuan untuk operasional/admin dengan action update status
- Auto-update RTG status ke TIDAK_READY jika jenis temuan mengandung keyword tertentu
- Badge counter di sidebar untuk operasional/admin

## Routes
- `/operator/lapor-temuan` - Form buat laporan
- `/operator/riwayat-temuan` - Riwayat laporan operator
- `/operasional/daftar-temuan` - Daftar semua temuan (operasional/admin)

## Database
- Table: `temuan_rtg`
- Foto disimpan sebagai JSONB array di database
- File fisik di `public/uploads/temuan/`

## Status Workflow
1. DIPERIKSA (default)
2. DITINDAKLANJUTI
3. SELESAI / DITUTUP

## Testing
Login credentials for testing:
- Operator: operator@tps.com / operator123
- Operasional: operasional@tps.com / operasional123
- Admin: admin@tps.com / admin123
```

**Step 3: Commit documentation**

```bash
git add docs/
git commit -m "docs: add Batch 2 feature documentation"
```

---

## Final Verification

**Step 1: Full build**

Run: `npm run build`
Expected: Clean build with no errors

**Step 2: Check all pages load**

- `/operator/lapor-temuan` ✓
- `/operator/riwayat-temuan` ✓
- `/operasional/daftar-temuan` ✓

**Step 3: Check all roles have correct access**

- Operator can access lapor-temuan and riwayat-temuan ✓
- Operasional can access daftar-temuan ✓
- Admin can access all pages ✓

**Step 4: Create final tag**

```bash
git tag -a batch2-laporan-temuan -m "Batch 2: Laporan Temuan complete"
git push origin batch2-laporan-temuan
```

---

## Notes for Implementation

1. **Photo Upload Security**: Validation di server side sudah dilakukan, pastikan file type dan size valid
2. **Auto-update Keywords**: Keywords ada di lib/upload.ts function isAutoUpdateKeyword(), bisa ditambah jika perlu
3. **Date/Time Format**: Menggunakan format ISO (YYYY-MM-DD untuk date, HH:MM untuk time)
4. **Status Labels**: StatusTemuanLabels ditambahkan ke types/rtg.ts untuk consistent label di UI
5. **Permission Checks**: Setiap page cek role di server component untuk security
6. **Error Handling**: Server actions return { error: message } jika terjadi error, bisa ditampilkan di UI dengan toast

## Next Steps (Batch 3)

Setelah Batch 2 selesai, lanjut ke:
- Batch 3: Input Status Harian (Operasional)
- Batch 4: Perbaikan (Mekanik)