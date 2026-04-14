import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getAllLaporan, updateLaporanStatus } from '@/lib/rtg';
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
import { StatusKerusakan, StatusKerusakanLabels, DitugaskanKeLabels } from '@/types/rtg';
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

const statusColors: Record<StatusKerusakan, string> = {
  DIPERIKSA: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  DITINDAKLANJUTI: 'bg-blue-100 text-blue-800 border-blue-200',
  SELESAI: 'bg-green-100 text-green-800 border-green-200',
};

async function updateStatus(formData: FormData) {
  'use server';
  const id = formData.get('id') as string;
  const status = formData.get('status') as StatusKerusakan;
  await updateLaporanStatus(id, status);
  // revalidatePath not available in Next.js 16
}

export default async function DaftarLaporanPage() {
  const session = await getSession();
  if (!session || session.role !== 'operasional') {
    redirect('/login');
  }

  const laporanList = await getAllLaporan();

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
                  <BreadcrumbPage>Daftar Laporan</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-6">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-6 w-6" />
            <h1 className="text-2xl font-bold">Daftar Semua Laporan</h1>
          </div>

      <Card>
        <CardHeader>
          <CardTitle>Semua Laporan Kerusakan</CardTitle>
          <CardDescription>
            Total: {laporanList.length} laporan
          </CardDescription>
        </CardHeader>
        <CardContent>
          {laporanList.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Waktu</TableHead>
                  <TableHead>RTG</TableHead>
                  <TableHead>Jenis Kerusakan</TableHead>
                  <TableHead>Pelapor</TableHead>
                  <TableHead>Ditugaskan Ke</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {laporanList.map((laporan) => (
                  <TableRow key={laporan.id}>
                    <TableCell>{laporan.tanggal_laporan}</TableCell>
                    <TableCell>{laporan.waktu_laporan}</TableCell>
                    <TableCell>
                      {laporan.rtg_unit.kode_rtg} - {laporan.rtg_unit.nama_rtg}
                    </TableCell>
                    <TableCell>{laporan.jenis_kerusakan}</TableCell>
                    <TableCell>{laporan.nama_pelapor}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {DitugaskanKeLabels[laporan.ditugaskan_ke]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[laporan.status_kerusakan]}>
                        {StatusKerusakanLabels[laporan.status_kerusakan]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {laporan.status_kerusakan === 'DIPERIKSA' && (
                        <form action={updateStatus}>
                          <input type="hidden" name="id" value={laporan.id} />
                          <input type="hidden" name="status" value="DITINDAKLANJUTI" />
                          <Button size="sm" variant="outline">
                            Proses
                          </Button>
                        </form>
                      )}
                      {laporan.status_kerusakan === 'DITINDAKLANJUTI' && (
                        <form action={updateStatus}>
                          <input type="hidden" name="id" value={laporan.id} />
                          <input type="hidden" name="status" value="SELESAI" />
                          <Button size="sm" variant="outline">
                            Selesai
                          </Button>
                        </form>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              Belum ada laporan kerusakan.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
