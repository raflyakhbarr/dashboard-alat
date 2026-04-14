import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getAllRTGGroups, createRTGGroup, deleteRTGGroup } from '@/lib/rtg';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2 } from 'lucide-react';
import { type RTGGroup } from '@/types/rtg';
import { revalidatePath } from 'next/navigation';

async function createGroup(formData: FormData) {
  'use server';
  const session = await getSession();
  if (!session || session.role !== 'operasional') {
    redirect('/login');
  }

  const nama_group = formData.get('nama_group') as string;
  const deskripsi = formData.get('deskripsi') as string;
  const lokasi = formData.get('lokasi') as string;

  await createRTGGroup({ nama_group, deskripsi, lokasi });
  revalidatePath('/operasional/rtg-groups');
  redirect('/operasional/rtg-groups');
}

async function deleteGroup(formData: FormData) {
  'use server';
  const session = await getSession();
  if (!session || session.role !== 'operasional') {
    redirect('/login');
  }

  const id = formData.get('id') as string;
  await deleteRTGGroup(id);
  revalidatePath('/operasional/rtg-groups');
}

export default async function RTGGroupsPage() {
  const session = await getSession();
  if (!session || session.role !== 'operasional') {
    redirect('/login');
  }

  const groups = await getAllRTGGroups();

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-6">
      <h1 className="text-2xl font-bold">Master RTG Groups</h1>

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>Tambah RTG Group</CardTitle>
          <CardDescription>Buat group baru untuk mengelola RTG units</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createGroup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nama_group">Nama Group *</Label>
              <Input type="text" id="nama_group" name="nama_group" placeholder="Group A" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lokasi">Lokasi</Label>
              <Input type="text" id="lokasi" name="lokasi" placeholder="Area/Block" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deskripsi">Deskripsi</Label>
              <Input type="text" id="deskripsi" name="deskripsi" placeholder="Keterangan group" />
            </div>
            <Button type="submit">Simpan</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daftar RTG Groups</CardTitle>
          <CardDescription>Total: {groups.length} group</CardDescription>
        </CardHeader>
        <CardContent>
          {groups.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Group</TableHead>
                  <TableHead>Lokasi</TableHead>
                  <TableHead>Deskripsi</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groups.map((group: RTGGroup) => (
                  <TableRow key={group.id}>
                    <TableCell className="font-medium">{group.nama_group}</TableCell>
                    <TableCell>{group.lokasi || '-'}</TableCell>
                    <TableCell>{group.deskripsi || '-'}</TableCell>
                    <TableCell className="text-right">
                      <form action={deleteGroup}>
                        <input type="hidden" name="id" value={group.id} />
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
              Belum ada RTG group.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
