'use client';

import { useState, useRef, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, FileSpreadsheet, AlertCircle, Loader2, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  StatusKondisiLabels,
  StatusKondisiRTG,
  PenindakLanjut,
  PenindakLanjutLabels,
} from '@/types/rtg';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { parseExcelDate, extractRTGCode, collectPhotoURLs, suggestStatusAwal, suggestPenindakLanjut } from '@/lib/import-excel';
import { importLaporanOperator } from '@/app/operasional/daftar-laporan/actions';

interface ImportExcelFormProps {
  onImportComplete: () => void;
}

export function ImportExcelForm({ onImportComplete }: ImportExcelFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [step, setStep] = useState<'idle' | 'preview' | 'determine'>('idle');
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [statuses, setStatuses] = useState<Record<number, StatusKondisiRTG>>({});
  const [penindakLanjuts, setPenindakLanjuts] = useState<Record<number, PenindakLanjut>>({});
  const [catatan, setCatatan] = useState<Record<number, string>>({});
  const [isPending, startTransition] = useTransition();
  const [importResult, setImportResult] = useState<any>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
      setError('Harap pilih file Excel (.xlsx atau .xls)');
      return;
    }

    setError('');
    setLoading(true);
    setFile(selectedFile);
    setStep('preview');

    try {
      const dataArray = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(dataArray, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet);

      const filteredData = jsonData.filter((row: any) =>
        row['Email'] && row['Name'] && row['Jenis dan Nomor Alat yang anda operasikan contoh : RTG 51']
      );

      setData(filteredData);
      setSelectedRows(new Set(filteredData.map((_, i) => i)));
    } catch (err: any) {
      setError(err.message || 'Gagal membaca file Excel');
      setStep('idle');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setData([]);
    setError('');
    setStep('idle');
    setSelectedRows(new Set());
    setCurrentIndex(0);
    setStatuses({});
    setPenindakLanjuts({});
    setCatatan({});
    setImportResult(null);
  };

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

  const currentRow = data[currentIndex];
  const hasTemuan = currentRow && currentRow['Temuan Pra-Penggunaan'] &&
    !currentRow['Temuan Pra-Penggunaan'].toString().toLowerCase().includes('tidak ada');

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
      return suggestPenindakLanjut(currentRow?.['Temuan Pra-Penggunaan'] || '');
    }
    return penindakLanjuts[currentIndex];
  };

  const handleImport = () => {
    startTransition(async () => {
      const importData = Array.from(selectedRows).map((index) => {
        const row = data[index];
        return {
          row: {
            ID: row['ID'],
            'Email': row['Email'],
            'Name': row['Name'],
            'Nama Operator ': row['Nama Operator '],
            'Group': row['Group'],
            'Jenis dan Nomor Alat yang anda operasikan contoh : RTG 51': row['Jenis dan Nomor Alat yang anda operasikan contoh : RTG 51'],
            'Tanggal Pengoprasian': row['Tanggal Pengoprasian'],
            'Temuan Pra-Penggunaan': row['Temuan Pra-Penggunaan'],
            'Uplod disini temuan Anda (max 100MB)': row['Uplod disini temuan Anda (max 100MB)'],
            'Temuan Pasca Pengoprasian Alat': row['Temuan Pasca Pengoprasian Alat'],
            'Uplod disini temuan Anda (max 100MB)2': row['Uplod disini temuan Anda (max 100MB)2'],
            'Dari 0-10 menurut anda berapa nilai Performance Alat yang anda operasikan': row['Dari 0-10 menurut anda berapa nilai Performance Alat yang anda operasikan'],
            'Saran dan perbaikan apa saja yang perlu untuk segera ditindak lanjuti.  ': row['Saran dan perbaikan apa saja yang perlu untuk segera ditindak lanjuti.  '],
            'Silahkan Uploud disini untuk percepatan tindakan. ': row['Silahkan Uploud disini untuk percepatan tindakan. '],
            'Catatan ': row['Catatan '],
            'Tindak lanjut': row['Tindak lanjut'],
            'Status ': row['Status '],
          },
          status: statuses[index] || suggestStatusAwal(row),
          penindakLanjut: penindakLanjuts[index] || suggestPenindakLanjut(row['Temuan Pra-Penggunaan'] || ''),
          catatan: catatan[index] || '',
        };
      });

      const result = await importLaporanOperator(importData);
      setImportResult(result);
    });
  };

  if (step === 'idle') {
    return (
      <div className="border-2 border-dashed rounded-lg p-12 text-center hover:bg-muted/50 transition-colors">
        <FileSpreadsheet className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
        <div className="space-y-2">
          <p className="text-lg font-semibold">Import Data Laporan Operator</p>
          <p className="text-sm text-muted-foreground">
            Upload file Excel berisi data laporan operator
          </p>
          <p className="text-xs text-muted-foreground">
            Format: FORM KESIAPAN ALAT RTG (.xlsx atau .xls)
          </p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileChange}
          className="hidden"
          id="excel-upload"
          disabled={loading}
        />
        <Button
          size="lg"
          disabled={loading}
          onClick={() => fileInputRef.current?.click()}
        >
          {loading ? 'Membaca...' : 'Pilih File Excel'}
        </Button>

        {error && (
          <Alert className="mt-4" variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>
    );
  }

  if (step === 'preview') {
    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-green-600" />
              <p className="font-semibold">Data Excel Terbaca: {data.length} baris</p>
            </div>
            <p className="text-sm text-muted-foreground">
              File: {file?.name}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleReset}>
            Ganti File
          </Button>
        </div>

        {/* Preview Table */}
        <ScrollArea className="h-[400px] rounded-lg border">
          <table className="w-full">
            <thead className="bg-muted sticky top-0">
              <tr>
                <th className="p-2 text-left">
                  <Checkbox
                    checked={selectedRows.size === data.length}
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

        {/* Action Buttons */}
        <div className="flex justify-between">
          <Button variant="outline" onClick={handleReset}>
            Cancel
          </Button>
          <Button onClick={() => setStep('determine')}>
            Next: Tentukan Status ({selectedRows.size})
          </Button>
        </div>
      </div>
    );
  }

  if (step === 'determine') {
    return (
      <div className="space-y-4">
        {/* Summary Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold">Tentukan Status Awal & Penugasan</p>
            <p className="text-sm text-muted-foreground">
              {selectedRows.size} dari {data.length} data diproses
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setStep('preview')}>
            Back to Preview
          </Button>
        </div>

        {importResult ? (
          <Alert className={importResult.success > 0 ? "border-green-500" : "border-destructive"}>
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-semibold">Import Selesai!</p>
                <div className="text-sm">
                  <p>✅ Berhasil: {importResult.success}</p>
                  <p>❌ Gagal: {importResult.failed}</p>
                  {importResult.createdUnits && importResult.createdUnits.length > 0 && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-blue-600">RTG Units Baru Dibuat: {importResult.createdUnits.length}</summary>
                      <ul className="mt-2 space-y-1 pl-4">
                        {importResult.createdUnits.map((unit: any, i: number) => (
                          <li key={i} className="text-xs">
                            {unit.nama} ({unit.group})
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}
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
                <Button onClick={() => { onImportComplete(); handleReset(); }} className="mt-2">
                  Close & Refresh
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        ) : (
          <>
            {/* Navigation */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                disabled={currentIndex === 0}
              >
                ← Previous
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
                Next →
              </Button>
            </div>

            {/* Current Row Detail */}
            <ScrollArea className="h-[450px] rounded-lg border p-4">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between pb-4 border-b">
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
                {hasTemuan ? (
                  <div className="space-y-3">
                    {currentRow['Temuan Pra-Penggunaan'] && (
                      <div className="p-3 bg-destructive/10 rounded-lg">
                        <Label className="text-sm font-semibold">Temuan Pra-Penggunaan:</Label>
                        <p className="text-sm mt-1">{currentRow['Temuan Pra-Penggunaan']}</p>
                      </div>
                    )}

                    {currentRow['Temuan Pasca Pengoprasian Alat'] && (
                      <div className="p-3 bg-muted rounded-lg">
                        <Label className="text-sm font-semibold">Temuan Pasca:</Label>
                        <p className="text-sm mt-1">{currentRow['Temuan Pasca Pengoprasian Alat']}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Rating:</Label>
                        <p className="text-2xl font-bold">
                          {currentRow['Dari 0-10 menurut anda berapa nilai Performance Alat yang anda operasikan'] || 0}/10
                        </p>
                      </div>
                      <div>
                        <Label>Tanggal:</Label>
                        <p className="text-sm">{parseExcelDate(currentRow['Tanggal Pengoprasian'])}</p>
                      </div>
                    </div>

                    {collectPhotoURLs(currentRow).length > 0 && (
                      <div>
                        <Label>Foto Bukti:</Label>
                        <div className="flex flex-wrap gap-2 mt-1">
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

                    {currentRow['Saran dan perbaikan apa saja yang perlu untuk segera ditindak lanjuti.  '] && (
                      <div>
                        <Label>Saran & Perbaikan:</Label>
                        <p className="text-sm mt-1">
                          {currentRow['Saran dan perbaikan apa saja yang perlu untuk segera ditindak lanjuti.  ']}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-800">✓ Tidak ada temuan - RTG Ready</p>
                  </div>
                )}

                {/* Status Determination */}
                <div className="pt-4 border-t space-y-4">
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
                      rows={2}
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
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep('preview')}>
                Back
              </Button>
              <Button onClick={handleImport} disabled={isPending || selectedRows.size === 0}>
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
          </>
        )}
      </div>
    );
  }

  return null;
}
