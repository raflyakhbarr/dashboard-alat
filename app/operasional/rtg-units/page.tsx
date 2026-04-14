import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import {
  getAllRTGUnits,
  getAllRTGGroups,
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
import { Trash2 } from 'lucide-react';
import { StatusKondisiLabels, type StatusKondisiRTG } from '@/types/rtg';
import { revalidatePath } from 'next/navigation';

async function createUnit(formData: FormData) {
  'use server';
  const session = await getSession();
  if (!session || session.role !== 'operasional') {
    redirect('/login');
  }

  const kode_rtg = formData.get('kode_rtg') as string;
  const nama_rtg = formData.get('nama_rtg') as string;
  const group_rtg_id = formData.get('group_rtg_id') as string;
  const kapasitas = formData.get('kapasitas') as string;
  const tahun_pembuatan = formData.get('tahun_pembuatan') as string;
  const manufacturer = formData.get('manufacturer') as string;
  const spesifikasi = formData.get('spesifikasi') as string;
  const status_kondisi = formData.get('status_kondisi') as StatusKondisiRTG;

  await createRTGUnit({
    kode_rtg,
    nama_rtg,
    group_rtg_id: group_rtg_id || undefined,
    kapasitas: kapasitas ? parseInt(kapasitas) : undefined,
    tahun_pembuatan: tahun_pembuatan ? parseInt(tahun_pembuatan) : undefined,
    manufacturer,
    spesifikasi,
    status_kondisi,
  });
  revalidatePath('/operasional/rtg-units');
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
  revalidatePath('/operasional/rtg-units');
}

export default async function RTGUnitsPage() {
  const session = await getSession();
  if (!session || session.role !== 'operasional') {
    redirect('/login');
  }

  const [units, groups] = await Promise.all([getAllRTGUnits(), getAllRTGGroups()]);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-6">
      <h1 className="text-2xl font-bold">Master RTG Units</h1>

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>Tambah RTG Unit</CardTitle>
          <CardDescription>Buat unit RTG baru</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createUnit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="kode_rtg">Kode RTG *</Label>
              <Input type="text" id="kode_rtg" name="kode_rtg" placeholder="RTG-001" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nama_rtg">Nama RTG *</Label>
              <Input type="text" id="nama_rtg" name="nama_rtg" placeholder="RTG A1" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="group_rtg_id">Group RTG</Label>
              <Select name="group_rtg_id">
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Group" />
                </SelectTrigger>
                <SelectContent>
                  {groups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.nama_group}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="kapasitas">Kapasitas (Ton)</Label>
              <Input type="number" id="kapasitas" name="kapasitas" placeholder="50" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tahun_pembuatan">Tahun Pembuatan</Label>
              <Input type="number" id="tahun_pembuatan" name="tahun_pembuatan" placeholder="2020" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="manufacturer">Manufacturer</Label>
              <Input type="text" id="manufacturer" name="manufacturer" placeholder="Konecranes" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="spesifikasi">Spesifikasi</Label>
              <Input type="text" id="spesifikasi" name="spesifikasi" placeholder="Spesifikasi teknis" />
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
                {units.map((unit) => (
                  <TableRow key={unit.id}>
                    <TableCell className="font-medium">{unit.kode_rtg}</TableCell>
                    <TableCell>{unit.nama_rtg}</TableCell>
                    <TableCell>{unit.group_rtg?.nama_group || '-'}</TableCell>
                    <TableCell>{unit.kapasitas ? `${unit.kapasitas} Ton` : '-'}</TableCell>
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
  );
}
