'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { StatusKondisiLabels, StatusKondisiRTG, PenindakLanjut, PenindakLanjutLabels } from '@/types/rtg';
import { parseExcelDate, extractRTGCode, collectPhotoURLs, suggestStatusAwal, suggestPenindakLanjut } from '@/lib/import-excel';
import { ChevronLeft, ChevronRight, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { importLaporanOperator } from '@/app/operasional/daftar-laporan/actions';

interface ImportPreviewProps {
  data: any[];
  onBack: () => void;
  onNext: () => void;
  determineStatus?: boolean;
}

export function ImportPreview({ data, onBack, onNext, determineStatus = false }: ImportPreviewProps) {
  const router = useRouter();
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set(data.map((_, i) => i)));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [statuses, setStatuses] = useState<Record<number, StatusKondisiRTG>>({});
  const [penindakLanjuts, setPenindakLanjuts] = useState<Record<number, PenindakLanjut>>({});
  const [catatan, setCatatan] = useState<Record<number, string>>({});
  const [isPending, startTransition] = useTransition();
  const [importResult, setImportResult] = useState<any>(null);

  const currentRow = data[currentIndex];
  const hasTemuan = currentRow['Temuan Pra-Penggunaan'] &&
    !currentRow['Temuan Pra-Penggunaan'].toString().toLowerCase().includes('tidak ada');

  const handleSelectAll = () => {
    if (selectedRows.size === data.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(data.map((_, i) => i)));
    }
  };

  const handleRowSelect = (index: number) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedRows(newSelected);
  };

  const handleNext = () => {
    if (determineStatus) {
      // Perform import
      startTransition(async () => {
        const importData = Array.from(selectedRows).map((index) => ({
          row: data[index],
          status: statuses[index] || suggestStatusAwal(data[index]),
          penindakLanjut: penindakLanjuts[index] || suggestPenindakLanjut(data[index]['Temuan Pra-Penggunaan'] || ''),
          catatan: catatan[index] || '',
        }));

        const result = await importLaporanOperator(importData);
        setImportResult(result);
      });
    } else {
      onNext();
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const applyToAllSimilar = () => {
    const currentStatus = statuses[currentIndex];
    const currentPenindak = penindakLanjuts[currentIndex];

    data.forEach((row, i) => {
      const rowHasTemuan = row['Temuan Pra-Penggunaan'] &&
        !row['Temuan Pra-Penggunaan'].toString().toLowerCase().includes('tidak ada');

      if (rowHasTemuan === hasTemuan) {
        if (currentStatus) {
          setStatuses(prev => ({ ...prev, [i]: currentStatus }));
        }
        if (currentPenindak) {
          setPenindakLanjuts(prev => ({ ...prev, [i]: currentPenindak }));
        }
      }
    });
  };

  const getAutoStatus = () => {
    if (!statuses[currentIndex]) {
      return suggestStatusAwal(currentRow);
    }
    return statuses[currentIndex];
  };

  const getAutoPenindakLanjut = () => {
    if (!penindakLanjuts[currentIndex]) {
      return suggestPenindakLanjut(currentRow['Temuan Pra-Penggunaan'] || '');
    }
    return penindakLanjuts[currentIndex];
  };

  return (
    <div className="space-y-4">
      {/* Selection Summary */}
      <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
        <div className="flex items-center gap-2">
          <Checkbox
            checked={selectedRows.size === data.length && data.length > 0}
            onCheckedChange={handleSelectAll}
          />
          <span className="text-sm">
            {selectedRows.size} dari {data.length} data dipilih
          </span>
        </div>
        <Button variant="outline" size="sm" onClick={onBack}>
          Ganti File
        </Button>
      </div>

      {determineStatus ? (
        <>
          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevious}
              disabled={currentIndex === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              {currentIndex + 1} / {data.length}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentIndex(Math.min(currentIndex + 1, data.length - 1))}
              disabled={currentIndex === data.length - 1}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>

          {/* Current Row Data */}
          <ScrollArea className="h-[500px] rounded-lg border">
            <div className="p-6 space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold">
                    {currentRow['Name']} - {extractRTGCode(currentRow['Jenis dan Nomor Alat yang anda operasikan contoh : RTG 51'])}
                  </h3>
                  <p className="text-sm text-muted-foreground">{currentRow['Email']}</p>
                </div>
                <Badge variant={hasTemuan ? 'destructive' : 'default'}>
                  {hasTemuan ? 'Ada Temuan' : 'Tidak Ada Temuan'}
                </Badge>
              </div>

              {/* Temuan Details */}
              {hasTemuan && (
                <div className="space-y-4">
                  <div className="p-4 bg-destructive/10 rounded-lg">
                    <h4 className="font-semibold mb-2">Temuan Pra-Penggunaan:</h4>
                    <p className="text-sm">{currentRow['Temuan Pra-Penggunaan']}</p>
                  </div>

                  {currentRow['Temuan Pasca Pengoprasian Alat'] && (
                    <div className="p-4 bg-muted rounded-lg">
                      <h4 className="font-semibold mb-2">Temuan Pasca-Penggunaan:</h4>
                      <p className="text-sm">{currentRow['Temuan Pasca Pengoprasian Alat']}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Performance Rating:</Label>
                      <p className="text-2xl font-bold">
                        {currentRow['Dari 0-10 menurut anda berapa nilai Performance Alat yang anda operasikan'] || 0}/10
                      </p>
                    </div>
                    <div>
                      <Label>Tanggal:</Label>
                      <p className="text-sm">{parseExcelDate(currentRow['Tanggal Pengoprasian'])}</p>
                    </div>
                  </div>

                  {/* Photos */}
                  {collectPhotoURLs(currentRow).length > 0 && (
                    <div>
                      <Label>Foto Bukti:</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {collectPhotoURLs(currentRow).map((url, i) => (
                          <a
                            key={i}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline"
                          >
                            Foto {i + 1}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Saran */}
                  {currentRow['Saran dan perbaikan apa saja yang perlu untuk segera ditindak lanjuti.  '] && (
                    <div>
                      <Label>Saran & Perbaikan:</Label>
                      <p className="text-sm mt-1">
                        {currentRow['Saran dan perbaikan apa saja yang perlu untuk segera ditindak lanjuti.  ']}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Status Determination */}
              <div className="space-y-4 pt-4 border-t">
                <h4 className="font-semibold">Tentukan Status Awal & Penugasan:</h4>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Status Awal RTG *</Label>
                    <Select
                      value={statuses[currentIndex] || getAutoStatus()}
                      onValueChange={(value) => setStatuses(prev => ({ ...prev, [currentIndex]: value as StatusKondisiRTG }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih status" />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(StatusKondisiLabels) as StatusKondisiRTG[]).map((status) => (
                          <SelectItem key={status} value={status}>
                            {StatusKondisiLabels[status]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Recommended: {StatusKondisiLabels[getAutoStatus()]}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Ditugaskan Ke *</Label>
                    <Select
                      value={penindakLanjuts[currentIndex] || getAutoPenindakLanjut()}
                      onValueChange={(value) => setPenindakLanjuts(prev => ({ ...prev, [currentIndex]: value as PenindakLanjut }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih tim" />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(PenindakLanjutLabels) as PenindakLanjut[]).map((role) => (
                          <SelectItem key={role} value={role}>
                            {PenindakLanjutLabels[role]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Based on jenis kerusakan
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Catatan Tambahan (Opsional)</Label>
                  <Textarea
                    placeholder="Catatan untuk tim penindak lanjut..."
                    value={catatan[currentIndex] || ''}
                    onChange={(e) => setCatatan(prev => ({ ...prev, [currentIndex]: e.target.value }))}
                    rows={3}
                  />
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={applyToAllSimilar}
                  className="w-full"
                >
                  Apply to All Similar Cases
                </Button>
              </div>
            </div>
          </ScrollArea>

          {/* Action Buttons */}
          {importResult ? (
            <Alert className={importResult.success > 0 ? "border-green-500" : "border-destructive"}>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-semibold">Import Selesai!</p>
                  <div className="text-sm">
                    <p>✅ Berhasil: {importResult.success}</p>
                    <p>❌ Gagal: {importResult.failed}</p>
                    {importResult.errors.length > 0 && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-destructive">Lihat Error</summary>
                        <ul className="mt-2 space-y-1 pl-4">
                          {importResult.errors.map((err: any, i: number) => (
                            <li key={i} className="text-xs">
                              {err.row}: {err.error}
                            </li>
                          ))}
                        </ul>
                      </details>
                    )}
                  </div>
                  <Button onClick={() => router.refresh()} className="mt-2">
                    Close & Refresh
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          ) : (
            <div className="flex justify-between">
              <Button variant="outline" onClick={onBack}>
                Back to Preview
              </Button>
              <Button onClick={handleNext} disabled={isPending || selectedRows.size === 0}>
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>Import Selected ({selectedRows.size})</>
                )}
              </Button>
            </div>
          )}
        </>
      ) : (
        /* Preview Mode */
        <ScrollArea className="h-[500px] rounded-lg border">
          <table className="w-full">
            <thead className="bg-muted sticky top-0">
              <tr>
                <th className="p-2 text-left w-10">
                  <Checkbox
                    checked={selectedRows.size === data.length && data.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </th>
                <th className="p-2 text-left">No</th>
                <th className="p-2 text-left">Operator</th>
                <th className="p-2 text-left">RTG</th>
                <th className="p-2 text-left">Temuan</th>
                <th className="p-2 text-left">Rating</th>
                <th className="p-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr key={i} className="border-t hover:bg-muted/50">
                  <td className="p-2">
                    <Checkbox
                      checked={selectedRows.has(i)}
                      onCheckedChange={() => handleRowSelect(i)}
                    />
                  </td>
                  <td className="p-2 text-sm">{i + 1}</td>
                  <td className="p-2">
                    <div className="text-sm">
                      <div className="font-medium">{row['Name']}</div>
                      <div className="text-xs text-muted-foreground">{row['Email']}</div>
                    </div>
                  </td>
                  <td className="p-2 text-sm">
                    {extractRTGCode(row['Jenis dan Nomor Alat yang anda operasikan contoh : RTG 51'])}
                  </td>
                  <td className="p-2 text-sm max-w-xs truncate">
                    {row['Temuan Pra-Penggunaan'] || '-'}
                  </td>
                  <td className="p-2 text-sm text-center">
                    {row['Dari 0-10 menurut anda berapa nilai Performance Alat yang anda operasikan'] || 0}
                  </td>
                  <td className="p-2">
                    <Badge variant={row['Temuan Pra-Penggunaan']?.toString().toLowerCase().includes('tidak ada') ? 'default' : 'destructive'}>
                      {row['Temuan Pra-Penggunaan']?.toString().toLowerCase().includes('tidak ada') ? 'Ready' : 'Perlu Tindakan'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollArea>
      )}

      {!determineStatus && (
        <div className="flex justify-between">
          <Button variant="outline" onClick={onBack}>
            Cancel
          </Button>
          <Button onClick={() => onNext()}>
            Next: Tentukan Status
          </Button>
        </div>
      )}
    </div>
  );
}
