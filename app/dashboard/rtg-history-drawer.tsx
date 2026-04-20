'use client';

import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { StatusKondisiLabels, StatusKondisiColors, type RTGStatusHistoryWithDetails, type RTGUnitWithGroup, StatusKondisiRTG } from '@/types/rtg';
import { Loader2, Clock, User, FileText, ImageIcon, CheckCircle2, Filter, Calendar, TrendingUp, AlertCircle } from 'lucide-react';
import Image from 'next/image';

interface RTGHistoryDrawerProps {
  rtgUnit: RTGUnitWithGroup | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type FilterPeriod = 'all' | 'week' | 'month' | '3months' | '6months' | 'year';

export function RTGHistoryDrawer({ rtgUnit, open, onOpenChange }: RTGHistoryDrawerProps) {
  const [history, setHistory] = useState<RTGStatusHistoryWithDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Filter states
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>('all');
  const [filterStatus, setFilterStatus] = useState<StatusKondisiRTG | 'all'>('all');
  const [filterUser, setFilterUser] = useState<string>('all');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Mencegah drawer menutup ketika modal aktif
  useEffect(() => {
    if (selectedImage) {
      // Disable scroll on body
      const originalOverflow = document.body.style.overflow;
      const originalPointerEvents = document.body.style.pointerEvents;
      document.body.style.overflow = 'hidden';
      document.body.style.pointerEvents = 'none'; // Mencegah klik ke drawer overlay

      // Force disable drawer overlay interaction
      const drawerOverlays = document.querySelectorAll('[data-slot="drawer-overlay"]');
      drawerOverlays.forEach(overlay => {
        (overlay as HTMLElement).style.pointerEvents = 'none';
      });

      // Add event listener untuk mencegah ESC key menutup drawer
      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          setSelectedImage(null);
        }
      };
      document.addEventListener('keydown', handleEsc, true); // Use capture phase

      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.pointerEvents = originalPointerEvents;
        drawerOverlays.forEach(overlay => {
          (overlay as HTMLElement).style.pointerEvents = '';
        });
        document.removeEventListener('keydown', handleEsc, true);
      };
    }
  }, [selectedImage]);

  useEffect(() => {
    if (open && rtgUnit) {
      fetchHistory();
    } else {
      setHistory([]);
      setError(null);
      setSelectedImage(null);
    }
  }, [open, rtgUnit]);

  const fetchHistory = async () => {
    if (!rtgUnit) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/rtg/${rtgUnit.id}/history`);
      if (!response.ok) {
        throw new Error('Failed to fetch history');
      }
      const data = await response.json();
      setHistory(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch history');
    } finally {
      setLoading(false);
    }
  };

  // Mencegah drawer menutup ketika gambar sedang dipreview
  const handleDrawerOpenChange = (open: boolean) => {
    if (selectedImage && !open) {
      // Jangan tutup drawer jika ada gambar yang sedang dipreview
      return;
    }
    onOpenChange(open);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Filter history data based on selected filters
  const filteredHistory = useMemo(() => {
    let filtered = [...history];

    // Filter by period
    if (filterPeriod !== 'all') {
      const now = new Date();
      const cutoffDate = new Date();

      switch (filterPeriod) {
        case 'week':
          cutoffDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          cutoffDate.setMonth(now.getMonth() - 1);
          break;
        case '3months':
          cutoffDate.setMonth(now.getMonth() - 3);
          break;
        case '6months':
          cutoffDate.setMonth(now.getMonth() - 6);
          break;
        case 'year':
          cutoffDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      filtered = filtered.filter(item => {
        const itemDate = new Date(item.created_at);
        return itemDate >= cutoffDate;
      });
    }

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(item => item.status_kondisi_baru === filterStatus);
    }

    // Filter by user
    if (filterUser !== 'all') {
      filtered = filtered.filter(item =>
        item.diubah_oleh === filterUser ||
        item.diubah_oleh_details?.nama === filterUser
      );
    }

    return filtered;
  }, [history, filterPeriod, filterStatus, filterUser]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = filteredHistory.length;

    // Count by status
    const statusCounts: Record<StatusKondisiRTG, number> = {
      READY: 0,
      READY_CATATAN_RINGAN: 0,
      READY_CATATAN_BERAT: 0,
      TIDAK_READY: 0,
    };

    // Count issues (non-ready statuses)
    let issueCount = 0;

    filteredHistory.forEach(item => {
      statusCounts[item.status_kondisi_baru]++;

      if (item.status_kondisi_baru !== 'READY') {
        issueCount++;
      }
    });

    // Get unique users who made changes
    const uniqueUsers = new Set(
      filteredHistory
        .filter(item => item.diubah_oleh_details?.nama)
        .map(item => item.diubah_oleh_details?.nama)
    );

    // Count reports with evidence
    const reportsWithEvidence = filteredHistory.filter(
      item => item.penindaklanjut_foto_bukti && item.penindaklanjut_foto_bukti.length > 0
    ).length;

    return {
      total,
      statusCounts,
      issueCount,
      uniqueUsersCount: uniqueUsers.size,
      reportsWithEvidence,
    };
  }, [filteredHistory]);

  // Get unique users for filter dropdown
  const uniqueUsers = useMemo(() => {
    const users = new Set(
      history
        .filter(item => item.diubah_oleh_details?.nama)
        .map(item => item.diubah_oleh_details?.nama)
    );
    return Array.from(users).sort();
  }, [history]);

  // Reset filters when drawer closes
  useEffect(() => {
    if (!open) {
      setFilterPeriod('all');
      setFilterStatus('all');
      setFilterUser('all');
    }
  }, [open]);

  return (
    <>
    <Drawer open={open} onOpenChange={handleDrawerOpenChange}>
      <DrawerContent
        className="!mt-24 !max-h-[100dvh] rounded-none data-[vaul-drawer-direction=bottom]:!mt-0 data-[vaul-drawer-direction=bottom]:!max-h-[100dvh] data-[vaul-drawer-direction=bottom]:!rounded-none"
        style={{ height: '100dvh', maxHeight: '100dvh' }}
      >
        <div className="flex flex-col h-full [&>div:first-child]:hidden">
          <DrawerHeader className="border-b pb-4 shrink-0 px-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <DrawerTitle className="text-2xl">
                  {rtgUnit?.kode_rtg} - {rtgUnit?.nama_rtg}
                </DrawerTitle>
                <DrawerDescription className="mt-2">
                  Riwayat perubahan status kondisi RTG
                </DrawerDescription>
              </div>
              <Badge className={StatusKondisiColors[rtgUnit?.status_kondisi || 'READY']}>
                {StatusKondisiLabels[rtgUnit?.status_kondisi || 'READY']}
              </Badge>
            </div>
          </DrawerHeader>

          <div className="flex flex-col flex-1 min-h-0 px-6 py-4 overflow-hidden">
          {/* Filter Section */}
          {!loading && !error && history.length > 0 && (
            <div className="mb-3 space-y-2 shrink-0 overflow-y-auto max-h-[30vh] pr-2">
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Filter className="h-3 w-3" />
                <span>Filter Riwayat</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {/* Period Filter */}
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-muted-foreground">Periode</label>
                  <Select value={filterPeriod} onValueChange={(value) => setFilterPeriod(value as FilterPeriod)}>
                    <SelectTrigger className="w-full h-8 text-xs">
                      <SelectValue placeholder="Pilih periode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Waktu</SelectItem>
                      <SelectItem value="week">7 Hari Terakhir</SelectItem>
                      <SelectItem value="month">30 Hari Terakhir</SelectItem>
                      <SelectItem value="3months">3 Bulan Terakhir</SelectItem>
                      <SelectItem value="6months">6 Bulan Terakhir</SelectItem>
                      <SelectItem value="year">1 Tahun Terakhir</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Status Filter */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Status</label>
                  <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as StatusKondisiRTG | 'all')}>
                    <SelectTrigger className="w-full h-8 text-xs">
                      <SelectValue placeholder="Filter status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Status</SelectItem>
                      <SelectItem value="READY">Ready</SelectItem>
                      <SelectItem value="READY_CATATAN_RINGAN">Ready Catatan Ringan</SelectItem>
                      <SelectItem value="READY_CATATAN_BERAT">Ready Catatan Berat</SelectItem>
                      <SelectItem value="TIDAK_READY">Tidak Ready</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* User Filter */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Diubah Oleh</label>
                  <Select value={filterUser} onValueChange={setFilterUser}>
                    <SelectTrigger className="w-full h-8 text-xs">
                      <SelectValue placeholder="Filter user" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua User</SelectItem>
                      {uniqueUsers.map((user) => (
                        <SelectItem key={user} value={user}>{user}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Statistics Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="bg-muted/50 rounded-lg p-2">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-0.5">
                    <Calendar className="h-2.5 w-2.5" />
                    <span className="text-[10px]">Total</span>
                  </div>
                  <p className="text-xl font-bold">{stats.total}</p>
                </div>

                <div className="bg-muted/50 rounded-lg p-2">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-0.5">
                    <AlertCircle className="h-2.5 w-2.5" />
                    <span className="text-[10px]">Issue</span>
                  </div>
                  <p className="text-xl font-bold text-orange-600">{stats.issueCount}</p>
                </div>

                <div className="bg-muted/50 rounded-lg p-2">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-0.5">
                    <User className="h-2.5 w-2.5" />
                    <span className="text-[10px]">User</span>
                  </div>
                  <p className="text-xl font-bold">{stats.uniqueUsersCount}</p>
                </div>

                <div className="bg-muted/50 rounded-lg p-2">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-0.5">
                    <CheckCircle2 className="h-2.5 w-2.5" />
                    <span className="text-[10px]">Bukti</span>
                  </div>
                  <p className="text-xl font-bold text-green-600">{stats.reportsWithEvidence}</p>
                </div>
              </div>

              {/* Status Breakdown */}
              <div className="bg-muted/30 rounded-lg p-2">
                <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground mb-1.5">
                  <TrendingUp className="h-2.5 w-2.5" />
                  <span className="text-[10px]">Breakdown Status</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {Object.entries(stats.statusCounts).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between">
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${StatusKondisiColors[status as StatusKondisiRTG]}`}>
                        {StatusKondisiLabels[status as StatusKondisiRTG]}
                      </Badge>
                      <span className="text-xs font-medium ml-1">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Active Filters Display */}
              {(filterPeriod !== 'all' || filterStatus !== 'all' || filterUser !== 'all') && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-muted-foreground">Filter aktif:</span>
                  {filterPeriod !== 'all' && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      {filterPeriod === 'week' ? '7 hari' :
                       filterPeriod === 'month' ? '30 hari' :
                       filterPeriod === '3months' ? '3 bulan' :
                       filterPeriod === '6months' ? '6 bulan' :
                       filterPeriod === 'year' ? '1 tahun' : filterPeriod}
                    </Badge>
                  )}
                  {filterStatus !== 'all' && (
                    <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 ${StatusKondisiColors[filterStatus]}`}>
                      {StatusKondisiLabels[filterStatus]}
                    </Badge>
                  )}
                  {filterUser !== 'all' && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      {filterUser}
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 px-1.5 text-[10px]"
                    onClick={() => {
                      setFilterPeriod('all');
                      setFilterStatus('all');
                      setFilterUser('all');
                    }}
                  >
                    Reset
                  </Button>
                </div>
              )}
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}

          {error && (
            <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
              <p className="text-sm">{error}</p>
            </div>
          )}

          {!loading && !error && history.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Belum ada riwayat perubahan status</p>
            </div>
          )}

          {!loading && !error && filteredHistory.length === 0 && history.length > 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Filter className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Tidak ada riwayat yang sesuai dengan filter</p>
            </div>
          )}

          {!loading && !error && filteredHistory.length > 0 && (
            <ScrollArea className="flex-1 min-h-0">
              <div className="space-y-4 pr-4">
                {filteredHistory.map((item, index) => (
                  <div
                    key={item.id}
                    className="relative pl-6 pb-6 border-l-2 border-muted last:pb-0"
                  >
                    {/* Timeline dot */}
                    <div className="absolute -left-2 top-0 h-4 w-4 rounded-full bg-primary border-2 border-background" />

                    <div className="space-y-3">
                      {/* Date and Time */}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{formatDate(item.created_at)}</span>
                      </div>

                      {/* Status Change */}
                      <div className="flex items-center gap-3 flex-wrap">
                        {item.status_kondisi_sebelumnya && (
                          <>
                            <Badge
                              variant="outline"
                              className={StatusKondisiColors[item.status_kondisi_sebelumnya]}
                            >
                              {StatusKondisiLabels[item.status_kondisi_sebelumnya]}
                            </Badge>
                            <span className="text-muted-foreground">→</span>
                          </>
                        )}
                        <Badge className={StatusKondisiColors[item.status_kondisi_baru]}>
                          {StatusKondisiLabels[item.status_kondisi_baru]}
                        </Badge>
                      </div>

                      {/* Reason */}
                      {item.alasan_perubahan && (
                        <div className="bg-muted/50 rounded-lg p-3">
                          <div className="flex items-start gap-2">
                            <FileText className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                            <div className="flex-1">
                              <p className="text-sm font-medium mb-1">Alasan Perubahan:</p>
                              <p className="text-sm text-muted-foreground">{item.alasan_perubahan}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Changed By */}
                      {item.diubah_oleh_details && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User className="h-3 w-3" />
                          <span>
                            Diubah oleh: {item.diubah_oleh_details.nama} (
                            {item.diubah_oleh_details.role})
                          </span>
                        </div>
                      )}

                      {/* Related Laporan */}
                      {item.laporan_kerusakan_id && (
                        <div className="space-y-3">
                          <div className="text-xs font-medium text-muted-foreground">
                            Terkait dengan laporan kerusakan
                          </div>

                          {/* Jenis Kerusakan */}
                          {item.jenis_kerusakan && (
                            <div className="text-sm">
                              <span className="text-muted-foreground">Jenis: </span>
                              <span className="font-medium">{item.jenis_kerusakan}</span>
                            </div>
                          )}

                          {/* Foto Laporan */}
                          {item.foto_laporan && item.foto_laporan.length > 0 && (
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <ImageIcon className="h-3 w-3 text-muted-foreground" />
                                <p className="text-xs font-medium">Foto Laporan ({item.foto_laporan.length})</p>
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {item.foto_laporan.map((foto, idx) => (
                                  <a
                                    key={idx}
                                    href={foto}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-muted hover:bg-muted/80 rounded-md transition-colors text-blue-600 hover:text-blue-700"
                                  >
                                    <ImageIcon className="h-2.5 w-2.5" />
                                    Foto {idx + 1}
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Foto Bukti Penindaklanjut */}
                          {item.penindaklanjut_foto_bukti && item.penindaklanjut_foto_bukti.length > 0 && (
                            <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-2 border border-green-200 dark:border-green-900">
                              <div className="flex items-center gap-2 mb-2">
                                <CheckCircle2 className="h-3 w-3 text-green-600" />
                                <p className="text-xs font-medium text-green-700 dark:text-green-400">
                                  Foto Bukti Penindaklanjut ({item.penindaklanjut_foto_bukti.length})
                                </p>
                              </div>
                              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                                {item.penindaklanjut_foto_bukti.map((foto, idx) => (
                                  <div
                                    key={idx}
                                    className="relative aspect-square rounded-md overflow-hidden border cursor-pointer hover:opacity-80 transition-opacity"
                                    onClick={() => setSelectedImage(foto)}
                                  >
                                    <Image
                                      src={foto}
                                      alt={`Foto bukti ${idx + 1}`}
                                      fill
                                      className="object-cover"
                                      sizes="(max-width: 768px) 20vw, 80px"
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        <div className="border-t p-4 shrink-0">
          <DrawerClose asChild>
            <Button
              variant="outline"
              className="w-full"
              onClick={(e) => {
                if (selectedImage) {
                  e.preventDefault();
                  e.stopPropagation();
                }
              }}
            >
              Tutup
            </Button>
          </DrawerClose>
        </div>
        </div>
      </DrawerContent>
    </Drawer>

    {/* Image Preview Modal */}
    {mounted && selectedImage && createPortal(
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80"
        style={{ pointerEvents: 'auto' }}
        onClick={(e) => {
          // Hanya tutup jika klik background langsung
          if (e.target === e.currentTarget) {
            e.preventDefault();
            e.stopPropagation();
            setSelectedImage(null);
          }
        }}
      >
        <div
          className="relative max-w-4xl max-h-[90vh] w-full bg-transparent pointer-events-auto"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <div className="relative bg-transparent">
            <Image
              src={selectedImage}
              alt="Preview"
              width={800}
              height={600}
              className="w-full h-auto object-contain rounded-lg"
            />
            <Button
              variant="secondary"
              size="sm"
              className="absolute top-2 right-2"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setSelectedImage(null);
              }}
            >
              Tutup
            </Button>
          </div>
        </div>
      </div>,
      document.body
    )}
  </>
  );
}
