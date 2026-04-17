'use client';

import { useState, useEffect } from 'react';
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
import { StatusKondisiLabels, StatusKondisiColors, type RTGStatusHistoryWithDetails, type RTGUnitWithGroup } from '@/types/rtg';
import { Loader2, Clock, User, FileText } from 'lucide-react';

interface RTGHistoryDrawerProps {
  rtgUnit: RTGUnitWithGroup | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RTGHistoryDrawer({ rtgUnit, open, onOpenChange }: RTGHistoryDrawerProps) {
  const [history, setHistory] = useState<RTGStatusHistoryWithDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && rtgUnit) {
      fetchHistory();
    } else {
      setHistory([]);
      setError(null);
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

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader className="border-b pb-4">
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

        <div className="p-6">
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

          {!loading && !error && history.length > 0 && (
            <ScrollArea className="h-[400px]">
              <div className="space-y-4 pr-4">
                {history.map((item, index) => (
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
                        <div className="text-xs text-muted-foreground">
                          Terkait dengan laporan kerusakan
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        <div className="border-t p-4">
          <DrawerClose asChild>
            <Button variant="outline" className="w-full">
              Tutup
            </Button>
          </DrawerClose>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
