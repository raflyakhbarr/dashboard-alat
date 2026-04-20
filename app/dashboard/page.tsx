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
import { logout } from '@/app/dashboard/actions';
import { Button } from '@/components/ui/button';
import { getDashboardStats, getAllRTGUnits } from '@/lib/rtg';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, AlertCircle, AlertTriangle, XCircle, Wrench } from 'lucide-react';
import { RTGUnitsTable } from './rtg-units-table';
import { StatusPieChart } from './status-pie-chart';

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-4">
            Unauthorized
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">Silakan login terlebih dahulu</p>
        </div>
      </div>
    );
  }

  const roleDisplayNames: Record<string, string> = {
    operasional: 'Tim Operasional',
    peralatan_terminal: 'Tim Peralatan Terminal',
    perencanaan_persediaan: 'Tim Perencanaan Persediaan',
    fasilitas: 'Tim Fasilitas',
  };

  // Get RTG statistics
  const stats = await getDashboardStats();
  const rtgUnits = await getAllRTGUnits();

  // Calculate percentages for progress bars
  const totalUnits = stats.total_rtg || 1; // Avoid division by zero
  const readyPercent = Math.round((stats.ready / totalUnits) * 100);
  const catatanRinganPercent = Math.round((stats.ready_catatan_ringan / totalUnits) * 100);
  const catatanBeratPercent = Math.round((stats.ready_catatan_berat / totalUnits) * 100);
  const tidakReadyPercent = Math.round((stats.tidak_ready / totalUnits) * 100);

  return (
    <SidebarProvider>
      <AppSidebar user={session} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-vertical:h-4 data-vertical:self-auto"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="#">
                    Dashboard
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>{roleDisplayNames[session.role] || session.role}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="ml-auto flex items-center gap-4 px-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                {session.nama}
              </p>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                {roleDisplayNames[session.role] || session.role}
              </p>
            </div>
            <form action={logout}>
              <Button type="submit" variant="outline" size="sm">
                Logout
              </Button>
            </form>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {/* RTG Statistics Cards */}
          <div className="grid auto-rows-min gap-4 md:grid-cols-5">
            <Card className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-green-900 dark:text-green-100 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Ready
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-900 dark:text-green-100">{stats.ready}</div>
                <p className="text-xs text-green-700 dark:text-green-300">Unit siap operasi</p>
              </CardContent>
            </Card>

            <Card className="bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-yellow-900 dark:text-yellow-100 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Catatan Ringan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">{stats.ready_catatan_ringan}</div>
                <p className="text-xs text-yellow-700 dark:text-yellow-300">Perlu perhatian</p>
              </CardContent>
            </Card>

            <Card className="bg-orange-50 border-orange-200 dark:bg-orange-950 dark:border-orange-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-orange-900 dark:text-orange-100 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Catatan Berat
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">{stats.ready_catatan_berat}</div>
                <p className="text-xs text-orange-700 dark:text-orange-300">Perlu pengawasan</p>
              </CardContent>
            </Card>

            <Card className="bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-red-900 dark:text-red-100 flex items-center gap-2">
                  <XCircle className="h-4 w-4" />
                  Tidak Ready
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-900 dark:text-red-100">{stats.tidak_ready}</div>
                <p className="text-xs text-red-700 dark:text-red-300">Perlu perbaikan</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Wrench className="h-4 w-4" />
                  Total RTG
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_rtg}</div>
                <p className="text-xs text-muted-foreground">Total unit</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts and Progress Section */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Progress Bars */}
            <Card>
              <CardHeader>
                <CardTitle>Distribusi Status RTG</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Ready */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="font-medium">Ready</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">{stats.ready} unit</span>
                      <span className="font-bold text-green-600">{readyPercent}%</span>
                    </div>
                  </div>
                  <Progress value={readyPercent} className="h-2" />
                </div>

                {/* Catatan Ringan */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      <span className="font-medium">Catatan Ringan</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">{stats.ready_catatan_ringan} unit</span>
                      <span className="font-bold text-yellow-600">{catatanRinganPercent}%</span>
                    </div>
                  </div>
                  <Progress value={catatanRinganPercent} className="h-2 [&>div]:bg-yellow-500" />
                </div>

                {/* Catatan Berat */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                      <span className="font-medium">Catatan Berat</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">{stats.ready_catatan_berat} unit</span>
                      <span className="font-bold text-orange-600">{catatanBeratPercent}%</span>
                    </div>
                  </div>
                  <Progress value={catatanBeratPercent} className="h-2 [&>div]:bg-orange-500" />
                </div>

                {/* Tidak Ready */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-600" />
                      <span className="font-medium">Tidak Ready</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">{stats.tidak_ready} unit</span>
                      <span className="font-bold text-red-600">{tidakReadyPercent}%</span>
                    </div>
                  </div>
                  <Progress value={tidakReadyPercent} className="h-2 [&>div]:bg-red-500" />
                </div>

                {/* Total Summary */}
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Total Unit</span>
                    <span className="text-lg font-bold">{stats.total_rtg}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pie Chart */}
            <StatusPieChart
              ready={stats.ready}
              ready_catatan_ringan={stats.ready_catatan_ringan}
              ready_catatan_berat={stats.ready_catatan_berat}
              tidak_ready={stats.tidak_ready}
              total_rtg={stats.total_rtg}
            />
          </div>

          {/* RTG Units Table */}
          <div className="rounded-xl bg-muted/50 p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">
                Status RTG Units
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Monitor kondisi semua unit Rubber Tyred Gantry crane
              </p>
            </div>

            <RTGUnitsTable rtgUnits={rtgUnits} />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
