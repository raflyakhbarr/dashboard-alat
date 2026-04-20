'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { StatusKerusakan, StatusKerusakanLabels, PenindakLanjutLabels, StatusKondisiLabels, StatusKondisiColors } from '@/types/rtg';
import { AppSidebar } from "@/components/app-sidebar";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ImportExcelButton } from '@/components/import-excel-button';
import { ImportExcelForm } from '@/components/import-excel-form';
import { updateStatus as updateStatusAction } from './update-status';
import { LaporanKerusakanDetailDrawer } from './laporan-kerusakan-detail-drawer';
import { FileText } from 'lucide-react';

const statusColors: Record<StatusKerusakan, string> = {
  DIPERIKSA: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  DITINDAKLANJUTI: 'bg-blue-100 text-blue-800 border-blue-200',
  SELESAI: 'bg-green-100 text-green-800 border-green-200',
};

export function DaftarLaporanClient({
  session,
  initialLaporan
}: {
  session: any;
  initialLaporan: any[];
}) {
  const router = useRouter();
  const [laporanList, setLaporanList] = useState(initialLaporan);
  const [loading, setLoading] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [selectedLaporan, setSelectedLaporan] = useState<any | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/operasional/laporan');
      const data = await response.json();
      setLaporanList(data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = (laporan: any) => {
    setSelectedLaporan(laporan);
    setDrawerOpen(true);
  };

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
          {/* Header */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-6 w-6" />
              <h1 className="text-2xl font-bold">Daftar Semua Laporan</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
                {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowImport(!showImport)}>
                {showImport ? 'Tutup Import' : 'Import Excel'}
              </Button>
            </div>
          </div>

          {/* Import Section */}
          {showImport && (
            <Card>
              <CardHeader>
                <CardTitle>Import Data Laporan Operator</CardTitle>
                <CardDescription>
                  Upload file Excel berisi data laporan operator dari form FORM KESIAPAN ALAT RTG
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ImportExcelForm onImportComplete={() => {
                  handleRefresh();
                  setShowImport(false);
                }} />
              </CardContent>
            </Card>
          )}

          {/* Laporan List */}
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
                      <TableHead>Status RTG</TableHead>
                      <TableHead>Jenis Kerusakan</TableHead>
                      <TableHead>Pelapor</TableHead>
                      <TableHead>Penindak Lanjut</TableHead>
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
                        <TableCell>
                          <Badge className={StatusKondisiColors[laporan.rtg_unit.status_kondisi]}>
                            {StatusKondisiLabels[laporan.rtg_unit.status_kondisi]}
                          </Badge>
                        </TableCell>
                        <TableCell>{laporan.jenis_kerusakan}</TableCell>
                        <TableCell>{laporan.nama_pelapor}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {PenindakLanjutLabels[laporan.penindak_lanjut]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColors[laporan.status_kerusakan]}>
                            {StatusKerusakanLabels[laporan.status_kerusakan]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="inline"
                              onClick={() => handleViewDetail(laporan)}
                            >
                              <FileText className="h-4 w-4 mr-1" />
                              Detail
                            </Button>
                            {laporan.status_kerusakan === 'DIPERIKSA' && (
                              <form action={updateStatusAction}>
                                <input type="hidden" name="id" value={laporan.id} />
                                <input type="hidden" name="status" value="DITINDAKLANJUTI" />
                                <Button type="submit" size="sm" variant="outline" className="inline">
                                  Proses
                                </Button>
                              </form>
                            )}
                            {laporan.status_kerusakan === 'DITINDAKLANJUTI' && (
                              <form action={updateStatusAction}>
                                <input type="hidden" name="id" value={laporan.id} />
                                <input type="hidden" name="status" value="SELESAI" />
                                <Button type="submit" size="sm" variant="outline" className="inline">
                                  Selesai
                                </Button>
                              </form>
                            )}
                          </div>
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

        {/* Laporan Detail Drawer */}
        <LaporanKerusakanDetailDrawer
          laporan={selectedLaporan}
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
        />
      </SidebarInset>
    </SidebarProvider>
  );
}
