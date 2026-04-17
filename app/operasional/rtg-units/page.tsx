import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import {
  getAllRTGUnits,
  createRTGUnit,
  deleteRTGUnit,
} from '@/lib/rtg';
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
import { Trash2, Wrench } from 'lucide-react';
import { StatusKondisiLabels, type StatusKondisiRTG } from '@/types/rtg';
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

async function createUnit(formData: FormData) {
  'use server';
  const session = await getSession();
  if (!session || session.role !== 'operasional') {
    redirect('/login');
  }

  const kode_rtg = formData.get('kode_rtg') as string;
  const nama_rtg = formData.get('nama_rtg') as string;
  const status_kondisi = formData.get('status_kondisi') as StatusKondisiRTG;

  await createRTGUnit({
    kode_rtg,
    nama_rtg,
    status_kondisi,
  });
  redirect('/operasional/rtg-units');
}

async function deleteUnit(formData: FormData) {
  'use server';
  const session = await getSession();
  if (!session || session.role !== 'operasional') {
    redirect('/login');
  }

  const id = formData.get('id') as string;
  await deleteRTGUnit(id);
  // revalidatePath not available in Next.js 16
}

export default async function RTGUnitsPage() {
  const session = await getSession();
  if (!session || session.role !== 'operasional') {
    redirect('/login');
  }

  const units = await getAllRTGUnits();

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
                  <BreadcrumbPage>RTG Units</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-6">
          <div className="flex items-center gap-2">
            <Wrench className="h-6 w-6" />
            <h1 className="text-2xl font-bold">Master RTG Units</h1>
          </div>

          <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>Tambah RTG Unit</CardTitle>
          <CardDescription>Buat unit RTG baru</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createUnit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="kode_rtg">Kode RTG *</Label>
                <Input type="text" id="kode_rtg" name="kode_rtg" placeholder="RTG-001" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nama_rtg">Nama RTG *</Label>
                <Input type="text" id="nama_rtg" name="nama_rtg" placeholder="RTG A1" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status_kondisi">Status Kondisi *</Label>
                <Select name="status_kondisi" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="READY">Ready</SelectItem>
                    <SelectItem value="READY_CATATAN_RINGAN">Ready Catatan Ringan</SelectItem>
                    <SelectItem value="READY_CATATAN_BERAT">Ready Catatan Berat</SelectItem>
                    <SelectItem value="TIDAK_READY">Tidak Ready</SelectItem>
                  </SelectContent>
                </Select>
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
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {units.map((unit) => (
                  <TableRow key={unit.id}>
                    <TableCell className="font-medium">{unit.kode_rtg}</TableCell>
                    <TableCell>{unit.nama_rtg}</TableCell>
                    <TableCell>{StatusKondisiLabels[unit.status_kondisi]}</TableCell>
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
            <div className="text-center py-12 text-muted-foreground">
              Belum ada RTG unit.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
