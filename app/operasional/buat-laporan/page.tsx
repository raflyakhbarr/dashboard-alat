import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
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
import { Camera } from 'lucide-react';
import { DitugaskanKeLabels, type DitugaskanKe } from '@/types/rtg';
import Link from 'next/link';
import { createLaporan } from '@/lib/rtg';
import { uploadPhotos } from '@/lib/upload';
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

async function submitLaporan(formData: FormData) {
  'use server';

  const session = await getSession();
  if (!session || session.role !== 'operasional') {
    redirect('/login');
  }

  try {
    const rtg_unit_id = formData.get('rtg_unit_id') as string;
    const dilaporkan_oleh = session.nama;
    const nama_pelapor = formData.get('nama_pelapor') as string;
    const email_pelapor = formData.get('email_pelapor') as string;
    const ditugaskan_ke = formData.get('ditugaskan_ke') as DitugaskanKe;
    const tanggal_laporan = formData.get('tanggal_laporan') as string;
    const waktu_laporan = formData.get('waktu_laporan') as string;
    const jenis_kerusakan = formData.get('jenis_kerusakan') as string;
    const deskripsi = formData.get('deskripsi') as string;

    const photoFiles = formData.getAll('foto_laporan') as File[];
    const foto_laporan = photoFiles.length > 0 && photoFiles[0].size > 0
      ? await uploadPhotos(photoFiles)
      : [];

    await createLaporan({
      rtg_unit_id,
      dilaporkan_oleh,
      nama_pelapor,
      email_pelapor,
      ditugaskan_ke,
      tanggal_laporan,
      waktu_laporan,
      jenis_kerusakan,
      deskripsi,
      foto_laporan,
    });

    // revalidatePath not available in Next.js 16
    redirect('/operasional/daftar-laporan');
  } catch (error: any) {
    console.error('Error creating laporan:', error);
    redirect('/operasional/daftar-laporan?error=true');
  }
}

export default async function BuatLaporanPage() {
  const session = await getSession();
  if (!session || session.role !== 'operasional') {
    redirect('/login');
  }

  const rtgUnits = await getAllRTGUnits();
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
                  <BreadcrumbPage>Buat Laporan</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-6">
          <div className="flex items-center gap-2">
            <Camera className="h-6 w-6" />
            <h1 className="text-2xl font-bold">Buat Laporan Kerusakan</h1>
          </div>

      <Card>
        <CardHeader>
          <CardTitle>Form Laporan Kerusakan</CardTitle>
          <CardDescription>
            Laporkan kerusakan atau masalah pada RTG dan tugaskan ke tim terkait.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={submitLaporan} className="space-y-6">
            {/* Row 1: RTG Unit & Ditugaskan Ke */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              <div className="space-y-2">
                <Label htmlFor="ditugaskan_ke">Ditugaskan Ke *</Label>
                <Select name="ditugaskan_ke" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Tim" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="peralatan_terminal">Peralatan Terminal</SelectItem>
                    <SelectItem value="perencanaan_persediaan">Perencanaan Persediaan</SelectItem>
                    <SelectItem value="fasilitas">Fasilitas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row 2: Nama Pelapor & Email Pelapor */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nama_pelapor">Nama Pelapor *</Label>
                <Input
                  type="text"
                  id="nama_pelapor"
                  name="nama_pelapor"
                  placeholder="Nama pelapor"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email_pelapor">Email Pelapor</Label>
                <Input
                  type="email"
                  id="email_pelapor"
                  name="email_pelapor"
                  placeholder="email@contoh.com"
                />
              </div>
            </div>

            {/* Row 3: Tanggal & Waktu Laporan */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tanggal_laporan">Tanggal Laporan *</Label>
                <Input
                  type="date"
                  id="tanggal_laporan"
                  name="tanggal_laporan"
                  defaultValue={today}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="waktu_laporan">Waktu Laporan *</Label>
                <Input
                  type="time"
                  id="waktu_laporan"
                  name="waktu_laporan"
                  defaultValue={currentTime}
                  required
                />
              </div>
            </div>

            {/* Row 4: Jenis Kerusakan & Deskripsi */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="jenis_kerusakan">Jenis Kerusakan *</Label>
                <Input
                  type="text"
                  id="jenis_kerusakan"
                  name="jenis_kerusakan"
                  placeholder="Contoh: Ban bocor, Kaca retak, Kursi rusak"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="deskripsi">Deskripsi</Label>
                <Textarea
                  id="deskripsi"
                  name="deskripsi"
                  placeholder="Jelaskan detail kerusakan..."
                  rows={3}
                />
              </div>
            </div>

            {/* Row 5: Foto */}
            <div className="space-y-2">
              <Label htmlFor="foto_laporan">Foto (Opsional)</Label>
              <Input
                type="file"
                id="foto_laporan"
                name="foto_laporan"
                accept="image/*"
                multiple
                className="cursor-pointer"
              />
              <p className="text-sm text-muted-foreground">
                Maksimal 3 foto, format JPG/PNG/WEBP, max 5MB per file
              </p>
            </div>

            <div className="flex gap-4">
              <Button type="submit" className="flex-1">
                Submit Laporan
              </Button>
              <Link href="/operasional/daftar-laporan">
                <Button type="button" variant="outline">
                  Batal
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
