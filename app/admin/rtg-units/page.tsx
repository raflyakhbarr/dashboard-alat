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
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trash2 } from 'lucide-react';
import { redirect } from 'next/navigation';
import {
  getAllRTGUnits,
  getAllRTGGroups,
} from '@/lib/rtg';
import { createUnit, deleteUnit } from './actions';
import {
  type RTGUnitWithGroup,
  type RTGGroup,
  StatusKondisiLabels,
  type StatusKondisiRTG,
} from '@/types/rtg';

async function loadData() {
  const [units, groups] = await Promise.all([
    getAllRTGUnits(),
    getAllRTGGroups(),
  ]);
  return { units, groups };
}

export default async function RTGUnitsPage() {
  const session = await getSession();

  if (!session || session.role !== 'admin') {
    redirect('/dashboard');
  }

  const { units, groups } = await loadData();

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
                  <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>RTG Units</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Manage RTG Units</h1>
              <p className="text-muted-foreground">Kelola unit Rubber Tyred Gantry crane</p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Tambah RTG Unit Baru</CardTitle>
              <CardDescription>Isi data RTG Unit baru</CardDescription>
            </CardHeader>
            <CardContent>
              <form action={createUnit} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="kode_rtg">Kode RTG *</Label>
                    <Input id="kode_rtg" name="kode_rtg" required placeholder="Contoh: RTG-001" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nama_rtg">Nama RTG *</Label>
                    <Input id="nama_rtg" name="nama_rtg" required placeholder="Contoh: RTG A1" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="group_rtg_id">Group RTG</Label>
                    <Select name="group_rtg_id">
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih Group" />
                      </SelectTrigger>
                      <SelectContent>
                        {groups.map((group: RTGGroup) => (
                          <SelectItem key={group.id} value={group.id}>
                            {group.nama_group}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status_kondisi">Status Kondisi</Label>
                    <Select name="status_kondisi" defaultValue="READY">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="READY">Ready</SelectItem>
                        <SelectItem value="READY_CATATAN_RINGAN">Ready dgn Catatan Ringan</SelectItem>
                        <SelectItem value="READY_CATATAN_BERAT">Ready dgn Catatan Berat</SelectItem>
                        <SelectItem value="TIDAK_READY">Tidak Ready</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="kapasitas">Kapasitas (Ton)</Label>
                    <Input id="kapasitas" name="kapasitas" type="number" placeholder="40" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tahun_pembuatan">Tahun Pembuatan</Label>
                    <Input id="tahun_pembuatan" name="tahun_pembuatan" type="number" placeholder="2020" />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="manufacturer">Manufacturer</Label>
                    <Input id="manufacturer" name="manufacturer" placeholder="Konecranes" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="spesifikasi">Spesifikasi</Label>
                    <Input id="spesifikasi" name="spesifikasi" placeholder="Contoh: Rubber Tyred Gantry Crane" />
                  </div>
                </div>
                <Button type="submit">Simpan</Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Daftar RTG Units</CardTitle>
              <CardDescription>Total: {units.length} unit</CardDescription>
            </CardHeader>
            <CardContent>
              {units.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kode</TableHead>
                      <TableHead>Nama</TableHead>
                      <TableHead>Group</TableHead>
                      <TableHead>Kapasitas</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {units.map((unit: RTGUnitWithGroup) => (
                      <TableRow key={unit.id}>
                        <TableCell className="font-medium">{unit.kode_rtg}</TableCell>
                        <TableCell>{unit.nama_rtg}</TableCell>
                        <TableCell>{unit.group_rtg?.nama_group ?? '-'}</TableCell>
                        <TableCell>{unit.kapasitas ? `${unit.kapasitas} Ton` : '-'}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            unit.status_kondisi === 'READY' ? 'bg-green-100 text-green-800' :
                            unit.status_kondisi === 'READY_CATATAN_RINGAN' ? 'bg-yellow-100 text-yellow-800' :
                            unit.status_kondisi === 'READY_CATATAN_BERAT' ? 'bg-orange-100 text-orange-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {StatusKondisiLabels[unit.status_kondisi]}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <form action={deleteUnit}>
                            <input type="hidden" name="id" value={unit.id} />
                            <Button variant="ghost" size="sm" type="submit">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </form>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  Belum ada RTG Unit
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
