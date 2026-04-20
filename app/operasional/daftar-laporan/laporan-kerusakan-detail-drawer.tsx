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
import {
  StatusKerusakanLabels,
  StatusKondisiLabels,
  StatusKondisiColors,
  PenindakLanjutLabels,
  type LaporanKerusakanWithDetails,
  type PenindaklanjutKerusakanWithDetails,
} from '@/types/rtg';
import { Loader2, Calendar, Clock, User, FileText, Image as ImageIcon, CheckCircle2, AlertTriangle } from 'lucide-react';
import Image from 'next/image';

interface LaporanKerusakanDetailDrawerProps {
  laporan: LaporanKerusakanWithDetails | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LaporanKerusakanDetailDrawer({
  laporan,
  open,
  onOpenChange,
}: LaporanKerusakanDetailDrawerProps) {
  const [penindaklanjut, setPenindaklanjut] = useState<PenindaklanjutKerusakanWithDetails[]>([]);
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
    if (open && laporan) {
      fetchPenindaklanjut();
    } else {
      setPenindaklanjut([]);
      setError(null);
      setSelectedImage(null);
    }
  }, [open, laporan]);

  const fetchPenindaklanjut = async () => {
    if (!laporan) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/operasional/laporan/${laporan.id}/penindaklanjut`);
      if (!response.ok) {
        throw new Error('Failed to fetch penindaklanjut');
      }
      const data = await response.json();
      setPenindaklanjut(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch penindaklanjut');
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

  if (!laporan) return null;

  return (
    <>
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader className="border-b pb-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <DrawerTitle className="text-2xl">
                  Detail Laporan Kerusakan
                </DrawerTitle>
                <DrawerDescription className="mt-2">
                  {laporan.rtg_unit.kode_rtg} - {laporan.rtg_unit.nama_rtg}
                </DrawerDescription>
              </div>
              <div className="flex flex-col gap-2">
                <Badge className={StatusKondisiColors[laporan.rtg_unit.status_kondisi]}>
                  {StatusKondisiLabels[laporan.rtg_unit.status_kondisi]}
                </Badge>
                <Badge
                  variant={laporan.status_kerusakan === 'SELESAI' ? 'default' : 'secondary'}
                  className={
                    laporan.status_kerusakan === 'SELESAI'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : ''
                  }
                >
                  {StatusKerusakanLabels[laporan.status_kerusakan]}
                </Badge>
              </div>
            </div>
          </DrawerHeader>

          <ScrollArea className="h-[calc(90vh-180px)]">
            <div className="p-6 space-y-6">
              {/* Informasi Laporan */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  <h3 className="text-lg font-semibold">Informasi Laporan</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Tanggal Lapor</p>
                      <p className="font-medium">{laporan.tanggal_laporan}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Waktu Lapor</p>
                      <p className="font-medium">{laporan.waktu_laporan}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <User className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Pelapor</p>
                      <p className="font-medium">{laporan.nama_pelapor}</p>
                      {laporan.email_pelapor && (
                        <p className="text-sm text-muted-foreground">{laporan.email_pelapor}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <FileText className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Penindak Lanjut</p>
                      <Badge variant="outline" className="mt-1">
                        {PenindakLanjutLabels[laporan.penindak_lanjut]}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Jenis Kerusakan</p>
                  <p className="font-medium">{laporan.jenis_kerusakan}</p>
                </div>

                {laporan.deskripsi && (
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-sm font-medium mb-1">Deskripsi Kerusakan</p>
                    <p className="text-sm text-muted-foreground">{laporan.deskripsi}</p>
                  </div>
                )}

                {/* Foto Laporan */}
                {laporan.foto_laporan && laporan.foto_laporan.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <ImageIcon className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm font-medium">Foto Laporan ({laporan.foto_laporan.length})</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {laporan.foto_laporan.map((foto, idx) => (
                        <a
                          key={idx}
                          href={foto}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 rounded-md transition-colors text-blue-600 hover:text-blue-700"
                        >
                          <ImageIcon className="h-3 w-3" />
                          Foto {idx + 1}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Penindaklanjut */}
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <h3 className="text-lg font-semibold">Penindaklanjut</h3>
                </div>

                {loading && (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-sm text-muted-foreground">Memuat data penindaklanjut...</span>
                  </div>
                )}

                {error && (
                  <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
                    <p className="text-sm">{error}</p>
                  </div>
                )}

                {!loading && !error && penindaklanjut.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertTriangle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">Belum ada penindaklanjut</p>
                    <p className="text-xs mt-1">
                      Status: {StatusKerusakanLabels[laporan.status_kerusakan]}
                    </p>
                  </div>
                )}

                {!loading && !error && penindaklanjut.length > 0 && (
                  <div className="space-y-4">
                    {penindaklanjut.map((item) => (
                      <div key={item.id} className="border rounded-lg p-4 space-y-3">
                        {/* Informasi Penangan */}
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-medium">Ditangani oleh</p>
                            <p className="text-sm">{item.ditangani_oleh.nama}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.ditangani_oleh.role.replace(/_/g, ' ').toLowerCase()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Tanggal Selesai</p>
                            <p className="text-sm font-medium">{item.tanggal_selesai}</p>
                          </div>
                        </div>

                        {/* Deskripsi Tindakan */}
                        {item.deskripsi_tindakan && (
                          <div className="bg-muted/50 rounded-lg p-3">
                            <p className="text-sm font-medium mb-1">Tindakan yang Dilakukan</p>
                            <p className="text-sm text-muted-foreground">{item.deskripsi_tindakan}</p>
                          </div>
                        )}

                        {/* Foto Bukti Penindaklanjut */}
                        {item.foto_bukti && item.foto_bukti.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-3">
                              <ImageIcon className="h-4 w-4 text-green-600" />
                              <p className="text-sm font-medium">Foto Bukti Penindaklanjut ({item.foto_bukti.length})</p>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                              {item.foto_bukti.map((foto, idx) => (
                                <div
                                  key={idx}
                                  className="relative aspect-square rounded-lg overflow-hidden border cursor-pointer hover:opacity-80 transition-opacity"
                                  onClick={() => setSelectedImage(foto)}
                                >
                                  <Image
                                    src={foto}
                                    alt={`Foto bukti ${idx + 1}`}
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 768px) 50vw, 33vw"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>

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
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80"
          style={{ pointerEvents: 'auto' }}
          onClick={(e) => {
            // Hanya tutup jika klik background langsung
            if (e.target === e.currentTarget) {
              e.preventDefault();
              e.stopPropagation();
              e.stopImmediatePropagation();
              setSelectedImage(null);
            }
          }}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] w-full bg-transparent pointer-events-auto"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              e.stopImmediatePropagation();
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
                  e.stopImmediatePropagation();
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
