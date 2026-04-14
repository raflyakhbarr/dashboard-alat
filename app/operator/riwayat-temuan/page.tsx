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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getTemuanByPelapor } from '@/lib/rtg';
import { StatusTemuanLabels, type StatusTemuan } from '@/types/rtg';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default async function RiwayatTemuanPage() {
  const session = await getSession();

  if (!session || session.role !== 'operator') {
    redirect('/login');
  }

  const temuanList = await getTemuanByPelapor(session.id);

  // Status badge colors
  const statusColors: Record<StatusTemuan, string> = {
    DIPERIKSA: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-300',
    DITINDAKLANJUTI: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-300',
    SELESAI: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-300',
    DITUTUP: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200 border-gray-300',
  };

  // Format date to Indonesian locale
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  // Format time to HH:MM format
  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    return `${hours}:${minutes}`;
  };

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
                  <BreadcrumbPage>Riwayat Temuan</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Riwayat Temuan</h1>
              <p className="text-muted-foreground">
                Daftar laporan temuan yang telah Anda submit ({temuanList.length} laporan)
              </p>
            </div>
            <Link href="/operator/lapor-temuan">
              <button className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                + Lapor Temuan Baru
              </button>
            </Link>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Daftar Temuan</CardTitle>
              <CardDescription>Riwayat semua laporan temuan RTG</CardDescription>
            </CardHeader>
            <CardContent>
              {temuanList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="text-center">
                    <p className="text-lg font-medium text-muted-foreground">
                      Belum ada laporan temuan
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Mulai laporkan temuan atau kerusakan pada unit RTG
                    </p>
                    <Link href="/operator/lapor-temuan" className="mt-4 inline-block">
                      <button className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                        Buat Laporan Pertama
                      </button>
                    </Link>
                  </div>
                </div>
              ) : (
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
                        <TableCell>{formatDate(temuan.tanggal_temuan)}</TableCell>
                        <TableCell>{formatTime(temuan.waktu_temuan)}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{temuan.rtg_unit.kode_rtg}</span>
                            <span className="text-xs text-muted-foreground">{temuan.rtg_unit.nama_rtg}</span>
                          </div>
                        </TableCell>
                        <TableCell>{temuan.jenis_temuan}</TableCell>
                        <TableCell>
                          <Badge className={statusColors[temuan.status_temuan]}>
                            {StatusTemuanLabels[temuan.status_temuan]}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
