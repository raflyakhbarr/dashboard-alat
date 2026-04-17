import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getAllRTGUnits, getRTGStatusHistoryByUnit } from '@/lib/rtg';
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
import { History, Clock } from 'lucide-react';
import { StatusKondisiLabels, StatusKondisiColors, type StatusKondisiRTG } from '@/types/rtg';
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

const statusColors: Record<StatusKondisiRTG, string> = {
  READY: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  READY_CATATAN_RINGAN: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  READY_CATATAN_BERAT: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  TIDAK_READY: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

export default async function HistoryPage() {
  const session = await getSession();
  if (!session || session.role !== 'operasional') {
    redirect('/login');
  }

  const rtgUnits = await getAllRTGUnits();

  // Get history for all units
  const unitsWithHistory = await Promise.all(
    rtgUnits.map(async (unit) => ({
      ...unit,
      history: await getRTGStatusHistoryByUnit(unit.id, 20),
    }))
  );

  // Filter units that have history
  const unitsWithHistoryData = unitsWithHistory.filter(unit => unit.history.length > 0);

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
                  <BreadcrumbPage>History RTG</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-6">
          <div className="flex items-center gap-2">
            <History className="h-6 w-6" />
            <h1 className="text-2xl font-bold">History RTG</h1>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Log Aktivitas RTG</CardTitle>
              <CardDescription>
                Riwayat lengkap perubahan status dan penindak lanjut RTG per unit
              </CardDescription>
            </CardHeader>
            <CardContent>
              {unitsWithHistoryData.length > 0 ? (
                <div className="space-y-8">
                  {unitsWithHistoryData.map((unit) => (
                    <div key={unit.id} className="space-y-3">
                      <div className="flex items-center gap-3 pb-2 border-b">
                        <h3 className="text-lg font-semibold">{unit.kode_rtg}</h3>
                        <span className="text-sm text-muted-foreground">{unit.nama_rtg}</span>
                        <Badge variant="outline" className="ml-auto">
                          {unit.history.length} perubahan
                        </Badge>
                      </div>

                      <div className="rounded-lg border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[180px]">Waktu</TableHead>
                              <TableHead>Status Sebelumnya</TableHead>
                              <TableHead>Status Baru</TableHead>
                              <TableHead>Alasan</TableHead>
                              <TableHead>Penindak Lanjut</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {unit.history.map((history) => (
                              <TableRow key={history.id}>
                                <TableCell className="text-muted-foreground">
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-3 w-3" />
                                    {new Date(history.created_at).toLocaleString('id-ID', {
                                      day: '2-digit',
                                      month: 'short',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {history.status_kondisi_sebelumnya ? (
                                    <Badge className={statusColors[history.status_kondisi_sebelumnya]}>
                                      {StatusKondisiLabels[history.status_kondisi_sebelumnya]}
                                    </Badge>
                                  ) : (
                                    <span className="text-muted-foreground text-sm">-</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Badge className={statusColors[history.status_kondisi_baru]}>
                                    {StatusKondisiLabels[history.status_kondisi_baru]}
                                  </Badge>
                                </TableCell>
                                <TableCell className="max-w-md">
                                  <div className="text-sm truncate" title={history.alasan_perubahan || '-'}>
                                    {history.alasan_perubahan || '-'}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {history.diubah_oleh_details ? (
                                    <div className="text-sm">
                                      <div className="font-medium">{history.diubah_oleh_details.nama}</div>
                                      <div className="text-xs text-muted-foreground capitalize">
                                        {history.diubah_oleh_details.role.replace(/_/g, ' ')}
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground text-sm">-</span>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  Belum ada history aktivitas RTG.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
