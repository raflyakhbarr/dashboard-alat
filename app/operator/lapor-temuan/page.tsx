import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getRTGUnits } from '@/lib/rtg';
import { submitLaporan } from './actions';
import AppSidebar from '@/components/app-sidebar';
import {
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Camera } from 'lucide-react';

export default async function LaporTemuanPage() {
  const session = await getSession();

  if (!session || session.role !== 'operator') {
    redirect('/login');
  }

  const rtgUnits = await getRTGUnits();

  // Get current date and time for defaults
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const currentTime = now.toTimeString().slice(0, 5);

  return (
    <SidebarProvider>
      <AppSidebar user={session} />
      <SidebarInset>
        <div className="flex flex-col flex-1 min-h-screen bg-background">
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <div className="flex items-center gap-2 font-semibold text-lg">
              <Camera className="h-5 w-5" />
              <span>Lapor Temuan</span>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {session.nama}
              </span>
            </div>
          </header>

          <Separator />

          <main className="flex-1 p-6">
            <div className="max-w-2xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle>Formulir Laporan Temuan</CardTitle>
                  <CardDescription>
                    Laporkan temuan atau kerusakan pada unit RTG
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form action={submitLaporan} className="space-y-6">
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
                              {unit.kode_unit} - {unit.nama_unit}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Tanggal Temuan */}
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

                    {/* Waktu Temuan */}
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
                        Jika jenis temuan mengandung kata kunci tertentu, status RTG akan otomatis berubah menjadi TIDAK_READY
                      </p>
                    </div>

                    {/* Deskripsi */}
                    <div className="space-y-2">
                      <Label htmlFor="deskripsi_temuan">
                        Deskripsi Temuan
                      </Label>
                      <textarea
                        id="deskripsi_temuan"
                        name="deskripsi_temuan"
                        className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Jelaskan detail temuan secara lengkap..."
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
                        className="cursor-pointer"
                      />
                      <p className="text-xs text-muted-foreground">
                        Anda dapat mengunggah beberapa foto untuk mendokumentasikan temuan
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => redirect('/operator/riwayat-temuan')}
                        className="flex-1"
                      >
                        Batal
                      </Button>
                      <Button type="submit" className="flex-1">
                        Kirim Laporan
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
