import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getLaporanByPenindakLanjut, createPenindaklanjut, updateRTGUnitStatus, createRTGStatusHistory, getRTGUnitById } from '@/lib/rtg';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle2, FileText } from 'lucide-react';
import { StatusKerusakanLabels, StatusKondisiLabels, StatusKondisiColors, StatusKondisiRTG } from '@/types/rtg';
import Link from 'next/link';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

async function submitPenindaklanjut(formData: FormData) {
  'use server';

  const session = await getSession();
  if (!session || session.role !== 'perencanaan_persediaan') {
    redirect('/login');
  }

  try {
    const laporan_kerusakan_id = formData.get('laporan_kerusakan_id') as string;
    const rtg_unit_id = formData.get('rtg_unit_id') as string;
    const tanggal_selesai = formData.get('tanggal_selesai') as string;
    const deskripsi_tindakan = formData.get('deskripsi_tindakan') as string;
    const status_rtg = formData.get('status_rtg') as StatusKondisiRTG;

    const photoFiles = formData.getAll('foto_bukti') as File[];
    const foto_bukti = photoFiles.length > 0 && photoFiles[0].size > 0
      ? await uploadPhotos(photoFiles)
      : [];

    // Update RTG status if provided
    if (status_rtg && rtg_unit_id) {
      // Get current RTG status before updating
      const currentRTG = await getRTGUnitById(rtg_unit_id);

      await updateRTGUnitStatus(rtg_unit_id, status_rtg);

      // Create status history entry
      await createRTGStatusHistory({
        rtg_unit_id,
        status_kondisi_sebelumnya: currentRTG?.status_kondisi || null,
        status_kondisi_baru: status_rtg,
        alasan_perubahan: `Penindak lanjut laporan ${laporan_kerusakan_id}: ${deskripsi_tindakan}`,
        laporan_kerusakan_id: laporan_kerusakan_id,
        diubah_oleh: session.id,
      });
    }

    await createPenindaklanjut({
      laporan_kerusakan_id,
      ditangani_oleh_id: session.id,
      tanggal_selesai,
      deskripsi_tindakan,
      foto_bukti,
    });

    redirect('/perencanaan_persediaan/penindak-lanjut?success=true');
  } catch (error: any) {
    console.error('Error creating penindaklanjut:', error);
    redirect('/perencanaan_persediaan/penindak-lanjut?error=true');
  }
}

export default async function PenindakLanjutPage({
  searchParams,
}: {
  searchParams: Promise<{ laporan_id?: string }>;
}) {
  const session = await getSession();
  if (!session || session.role !== 'perencanaan_persediaan') {
    redirect('/login');
  }

  // Get all pending reports for this role
  const laporanList = await getLaporanByPenindakLanjut('perencanaan_persediaan');
  const pendingReports = laporanList.filter(laporan => laporan.status_kerusakan === 'DIPERIKSA' || laporan.status_kerusakan === 'DITINDAKLANJUTI');

  // Await searchParams before accessing properties
  const resolvedSearchParams = await searchParams;

  // Get specific report if laporan_id is provided
  const selectedReport = resolvedSearchParams.laporan_id
    ? laporanList.find(l => l.id === resolvedSearchParams.laporan_id)
    : null;

  const today = new Date().toISOString().split('T')[0];

  return (
    <SidebarProvider>
      <AppSidebar user={session} />
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
                  <BreadcrumbPage>Penindak Lanjut</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-6">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-6 w-6" />
            <h1 className="text-2xl font-bold">Penindak Lanjut Laporan</h1>
          </div>

          {!selectedReport ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Laporan Yang Perlu Ditindaklanjuti</CardTitle>
                  <CardDescription>
                    Daftar laporan kerusakan yang ditugaskan ke tim Perencanaan Persediaan
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {pendingReports.length > 0 ? (
                    <div className="space-y-4">
                      {pendingReports.map((laporan) => (
                        <div
                          key={laporan.id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="font-semibold text-lg">
                                {laporan.rtg_unit.kode_rtg} - {laporan.rtg_unit.nama_rtg}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                Status Laporan: {StatusKerusakanLabels[laporan.status_kerusakan]}
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${StatusKondisiColors[laporan.rtg_unit.status_kondisi]}`}>
                                Status RTG: {StatusKondisiLabels[laporan.rtg_unit.status_kondisi]}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <p className="text-muted-foreground">Jenis Kerusakan</p>
                                <p className="font-medium">{laporan.jenis_kerusakan}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Tanggal</p>
                                <p className="font-medium">{laporan.tanggal_laporan}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Waktu</p>
                                <p className="font-medium">{laporan.waktu_laporan}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Pelapor</p>
                                <p className="font-medium">{laporan.nama_pelapor}</p>
                              </div>
                            </div>
                            {laporan.deskripsi && (
                              <div className="mt-2 text-sm">
                                <p className="text-muted-foreground">Deskripsi:</p>
                                <p className="text-sm">{laporan.deskripsi}</p>
                              </div>
                            )}
                            {laporan.foto_laporan && laporan.foto_laporan.length > 0 && (
                              <div className="mt-2">
                                <p className="text-sm text-muted-foreground">Foto: {laporan.foto_laporan.length} lampiran</p>
                              </div>
                            )}
                          </div>
                          <Link href={`/perencanaan_persediaan/penindak-lanjut?laporan_id=${laporan.id}`}>
                            <Button>
                              <FileText className="h-4 w-4 mr-2" />
                              Tangani
                            </Button>
                          </Link>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      Tidak ada laporan yang perlu ditindaklanjuti.
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Form Penindak Lanjut</CardTitle>
                  <CardDescription>
                    {selectedReport.rtg_unit.kode_rtg} - {selectedReport.rtg_unit.nama_rtg}: {selectedReport.jenis_kerusakan}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-6 p-4 bg-muted rounded-lg">
                    <h3 className="font-semibold mb-2">Detail Laporan</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Tanggal Lapor</p>
                        <p className="font-medium">{selectedReport.tanggal_laporan}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Waktu</p>
                        <p className="font-medium">{selectedReport.waktu_laporan}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Pelapor</p>
                        <p className="font-medium">{selectedReport.nama_pelapor}</p>
                      </div>
                    </div>
                    {selectedReport.deskripsi && (
                      <div className="mt-3 text-sm">
                        <p className="text-muted-foreground">Deskripsi Kerusakan:</p>
                        <p>{selectedReport.deskripsi}</p>
                      </div>
                    )}
                    {selectedReport.foto_laporan && selectedReport.foto_laporan.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm text-muted-foreground mb-2">Foto Kerusakan:</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedReport.foto_laporan.map((foto, idx) => (
                            <a
                              key={idx}
                              href={foto}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline text-sm"
                            >
                              Foto {idx + 1}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <form action={submitPenindaklanjut} className="space-y-6">
                    <input type="hidden" name="laporan_kerusakan_id" value={selectedReport.id} />
                    <input type="hidden" name="rtg_unit_id" value={selectedReport.rtg_unit_id} />

                    <div className="space-y-2">
                      <Label htmlFor="tanggal_selesai">Tanggal Selesai *</Label>
                      <Input
                        type="date"
                        id="tanggal_selesai"
                        name="tanggal_selesai"
                        defaultValue={today}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="deskripsi_tindakan">Deskripsi Tindakan *</Label>
                      <Textarea
                        id="deskripsi_tindakan"
                        name="deskripsi_tindakan"
                        placeholder="Jelaskan tindakan yang telah dilakukan..."
                        rows={5}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="status_rtg">Status RTG Setelah Perbaikan *</Label>
                      <Select name="status_rtg" required>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih status RTG" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="READY">Ready</SelectItem>
                          <SelectItem value="READY_CATATAN_RINGAN">Ready dengan Catatan Ringan</SelectItem>
                          <SelectItem value="READY_CATATAN_BERAT">Ready dengan Catatan Berat</SelectItem>
                          <SelectItem value="TIDAK_READY">Tidak Ready</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-muted-foreground">
                        Tentukan status RTG setelah penindak lanjut dilakukan
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="foto_bukti">Foto Bukti Pengerjaan (Opsional)</Label>
                      <Input
                        type="file"
                        id="foto_bukti"
                        name="foto_bukti"
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
                        Submit Penindak Lanjut
                      </Button>
                      <Link href="/perencanaan_persediaan/penindak-lanjut">
                        <Button type="button" variant="outline">
                          Batal
                        </Button>
                      </Link>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
