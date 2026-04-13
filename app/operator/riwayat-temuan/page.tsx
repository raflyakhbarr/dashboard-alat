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
import { History } from 'lucide-react';
import { getTemuanByPelapor } from '@/lib/rtg';
import { StatusTemuanLabels, type TemuanRTGWithDetails } from '@/types/rtg';

export default async function RiwayatTemuanPage() {
  const session = await getSession();

  if (!session || session.role !== 'operator') {
    redirect('/login');
  }

  const temuanList = await getTemuanByPelapor(session.id);

  // Status colors for badge styling
  const statusColors: Record<string, string> = {
    DIPERIKSA: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    DITINDAKLANJUTI: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    SELESAI: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    DITUTUP: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
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
              <p className="text-muted-foreground">Daftar laporan temuan yang telah Anda laporkan</p>
            </div>
            <History className="h-6 w-6 text-muted-foreground" />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Daftar Laporan Temuan</CardTitle>
              <CardDescription>Total: {temuanList.length} laporan</CardDescription>
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
                    {temuanList.map((temuan: TemuanRTGWithDetails) => (
                      <TableRow key={temuan.id}>
                        <TableCell>
                          {new Date(temuan.tanggal_temuan).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </TableCell>
                        <TableCell>{temuan.waktu_temuan}</TableCell>
                        <TableCell className="font-medium">
                          {temuan.rtg_unit.kode_rtg} - {temuan.rtg_unit.nama_rtg}
                        </TableCell>
                        <TableCell>{temuan.jenis_temuan}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[temuan.status_temuan]}`}>
                            {StatusTemuanLabels[temuan.status_temuan]}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  Belum ada laporan temuan
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
