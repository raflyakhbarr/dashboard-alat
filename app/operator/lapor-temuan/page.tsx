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
import { getAllRTGUnits } from '@/lib/rtg';
import { redirect } from 'next/navigation';
import { submitLaporan } from './actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Link from 'next/link';

export default async function LaporTemuanPage() {
  const session = await getSession();

  if (!session || session.role !== 'operator') {
    redirect('/login');
  }

  const rtgUnits = await getAllRTGUnits();

  // Get current date and time for defaults (Indonesia timezone)
  const now = new Date();
  const indonesiaTime = new Date(now.getTime() + 7 * 60 * 60 * 1000); // UTC+7
  const today = indonesiaTime.toISOString().split('T')[0];
  const currentTime = indonesiaTime.toTimeString().slice(0, 5);

  return (
    <SidebarProvider>
      <AppSidebar user={session} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/operator">Operator</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Lapor Temuan</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Lapor Temuan</h1>
              <p className="text-muted-foreground">Laporkan temuan atau kerusakan pada unit RTG</p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Formulir Laporan Temuan</CardTitle>
              <CardDescription>Isi data temuan secara lengkap</CardDescription>
            </CardHeader>
            <CardContent>
              <form action={submitLaporan} className="space-y-4">
                {/* RTG Unit Selection */}
                <div className="space-y-2">
                  <Label htmlFor="rtg_unit_id">
                    Unit RTG <span className="text-destructive">*</span>
                  </Label>
                  <Select name="rtg_unit_id" required>
                    <SelectTrigger id="rtg_unit_id">
                      <SelectValue placeholder="Pilih unit RTG" />
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

                {/* Tanggal dan Waktu Temuan */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="tanggal_temuan">
                      Tanggal Temuan <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="tanggal_temuan"
                      name="tanggal_temuan"
                      type="date"
                      defaultValue={today}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="waktu_temuan">
                      Waktu Temuan <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="waktu_temuan"
                      name="waktu_temuan"
                      type="time"
                      defaultValue={currentTime}
                      required
                    />
                  </div>
                </div>

                {/* Jenis Temuan */}
                <div className="space-y-2">
                  <Label htmlFor="jenis_temuan">
                    Jenis Temuan <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="jenis_temuan"
                    name="jenis_temuan"
                    type="text"
                    placeholder="Contoh: Ban bocor, Rem tidak berfungsi, dll."
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Jika jenis temuan mengandung kata kunci tertentu (berat, rusak parah, bahaya, bocor, patah), status RTG akan otomatis berubah menjadi TIDAK_READY
                  </p>
                </div>

                {/* Deskripsi */}
                <div className="space-y-2">
                  <Label htmlFor="deskripsi_temuan">
                    Deskripsi Temuan
                  </Label>
                  <Textarea
                    id="deskripsi_temuan"
                    name="deskripsi_temuan"
                    placeholder="Jelaskan detail temuan secara lengkap..."
                    className="min-h-[120px]"
                  />
                </div>

                {/* Foto */}
                <div className="space-y-2">
                  <Label htmlFor="foto">
                    Foto Temuan
                  </Label>
                  <Input
                    id="foto"
                    name="foto"
                    type="file"
                    accept="image/*"
                    multiple
                  />
                  <p className="text-xs text-muted-foreground">
                    Anda dapat mengunggah hingga 3 foto (JPG, PNG, WEBP, maks 5MB per file)
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 pt-4">
                  <Link href="/operator/riwayat-temuan" className="flex-1">
                    <Button type="button" variant="outline" className="w-full">
                      Batal
                    </Button>
                  </Link>
                  <Button type="submit" className="flex-1">
                    Kirim Laporan
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
