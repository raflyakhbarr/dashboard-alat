'use client';

import { useState, useEffect } from 'react';
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
import { StatusKondisiLabels, StatusKondisiColors, type RTGStatusHistoryWithDetails, type RTGUnitWithGroup } from '@/types/rtg';
import { Loader2, Clock, User, FileText, ImageIcon, CheckCircle2 } from 'lucide-react';
import Image from 'next/image';

interface RTGHistoryDrawerProps {
  rtgUnit: RTGUnitWithGroup | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RTGHistoryDrawer({ rtgUnit, open, onOpenChange }: RTGHistoryDrawerProps) {
  const [history, setHistory] = useState<RTGStatusHistoryWithDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Mencegah drawer menutup ketika modal aktif
  useEffect(() => {
    if (selectedImage) {
      // Disable scroll on body
      document.body.style.overflow = 'hidden';
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
        document.body.style.overflow = '';
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
    <>
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

        <div className="border-t p-4">
          <DrawerClose asChild>
            <Button variant="outline" className="w-full">
              Tutup
            </Button>
          </DrawerClose>
        </div>
      </DrawerContent>
    </Drawer>

    {/* Image Preview Modal */}
    {mounted && selectedImage && createPortal(
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4"
        onPointerDown={(e) => {
          // Hanya tutup jika klik di background, bukan di image container
          if (e.target === e.currentTarget) {
            e.preventDefault();
            e.stopPropagation();
            setSelectedImage(null);
          }
        }}
      >
        <div
          className="relative max-w-4xl max-h-[90vh] w-full bg-transparent"
          onPointerDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
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
      </div>,
      document.body
    )}
  </>
  );
}
