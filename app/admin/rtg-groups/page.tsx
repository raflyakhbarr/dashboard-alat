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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Trash2 } from 'lucide-react';
import { redirect } from 'next/navigation';
import { getAllRTGGroups } from '@/lib/rtg';
import { createGroup, deleteGroup } from './actions';
import { type RTGGroup } from '@/types/rtg';

async function loadGroups() {
  return await getAllRTGGroups();
}

export default async function RTGGroupsPage() {
  const session = await getSession();

  if (!session || session.role !== 'admin') {
    redirect('/dashboard');
  }

  const groups = await loadGroups();

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
                  <BreadcrumbPage>RTG Groups</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Manage RTG Groups</h1>
              <p className="text-muted-foreground">Kelola group RTG di terminal</p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Tambah RTG Group Baru</CardTitle>
              <CardDescription>Isi data RTG Group baru</CardDescription>
            </CardHeader>
            <CardContent>
              <form action={createGroup} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="nama_group">Nama Group *</Label>
                    <Input id="nama_group" name="nama_group" required placeholder="Contoh: Group A" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lokasi">Lokasi</Label>
                    <Input id="lokasi" name="lokasi" placeholder="Contoh: Terminal 1, Block A" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deskripsi">Deskripsi</Label>
                  <Input id="deskripsi" name="deskripsi" placeholder="Deskripsi group" />
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
                          <div className="flex justify-end gap-2">
                            <form action={deleteGroup}>
                              <input type="hidden" name="id" value={group.id} />
                              <Button variant="ghost" size="sm" type="submit">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </form>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  Belum ada RTG Group
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
