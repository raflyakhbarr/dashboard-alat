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
import { parseExcelDate, extractRTGCode, collectPhotoURLs, suggestStatusAwal, suggestPenindakLanjut, filterDataBaru, serializeForServer } from '@/lib/import-excel';
import { importLaporanOperator, cekDataBaru, debugCheckLaporan } from '@/app/operasional/daftar-laporan/actions';

interface ImportExcelFormProps {
  onImportComplete: () => void;
}

export function ImportExcelForm({ onImportComplete }: ImportExcelFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [data, setData] = useState<any[]>([]);
  const [allData, setAllData] = useState<any[]>([]); // Semua data dari Excel
  const [existingData, setExistingData] = useState<any[]>([]); // Data yang sudah ada
  const [loading, setLoading] = useState(false);
  const [checkingData, setCheckingData] = useState(false); // Loading state saat cek data
  const [error, setError] = useState<string>('');
  const [step, setStep] = useState<'idle' | 'preview' | 'determine'>('idle');
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [statuses, setStatuses] = useState<Record<number, StatusKondisiRTG>>({});
  const [penindakLanjuts, setPenindakLanjuts] = useState<Record<number, PenindakLanjut>>({});
  const [catatan, setCatatan] = useState<Record<number, string>>({});
  const [isPending, startTransition] = useTransition();
  const [importResult, setImportResult] = useState<any>(null);
  const [debugInfo, setDebugInfo] = useState<any[]>([]);

  // Helper function untuk memastikan nilai aman di-render
  const safeString = (value: any): string => {
    if (value === null || value === undefined) return '';
    if (value instanceof Date) return value.toISOString();
    return String(value);
  };

  // Helper function untuk mendapatkan RTG code dari row dengan fleksibel
  const getRTGCodeFromRow = (row: any): string => {
    // Coba multiple possible keys
    const rtgValue =
      row['Jenis dan Nomor Alat yang anda operasikan contoh : RTG 51'] ||
      row['Jenis dan Nomor Alat yang anda operasikan contoh : RTG51'] ||
      row['RTG'] ||
      row['rtg'] ||
      row['Jenis dan Nomor Alat'] ||
      '';

    return extractRTGCode(rtgValue);
  };

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

    try {
      const dataArray = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(dataArray, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet, { defval: '' });

      // DEBUG: Log untuk melihat struktur data dari Excel
      console.log('=== DEBUG Excel Data ===');
      console.log('Total rows from Excel:', jsonData.length);
      if (jsonData.length > 0) {
        console.log('Sample first row keys:', Object.keys(jsonData[0]));
        console.log('Sample first row:', JSON.stringify(jsonData[0], null, 2));
      }

      // Filter dengan lebih fleksibel - cek multiple possible key names
      const filteredData = jsonData.filter((row: any) => {
        const hasEmail = row['Email'] || row['email'] || row['EMAIL'];
        const hasName = row['Name'] || row['name'] || row['NAME'];
        const hasRTG = row['Jenis dan Nomor Alat yang anda operasikan contoh : RTG 51'] ||
                     row['Jenis dan Nomor Alat yang anda operasikan contoh : RTG51'] ||
                     row['RTG'] ||
                     row['rtg'];

        const isValid = hasEmail && hasName && hasRTG;

        if (!isValid && jsonData.indexOf(row) < 3) {
          console.log(`Row ${jsonData.indexOf(row)} filtered out:`, {
            hasEmail,
            hasName,
            hasRTG,
            keys: Object.keys(row)
          });
        }

        return isValid;
      });

      console.log('Total filtered data:', filteredData.length);

      // CRITICAL: Serialize data IMMEDIATELY setelah membaca dari Excel
      // Ini memastikan data yang disimpan di state adalah plain objects
      const serializedData = serializeForServer(filteredData);

      // DEBUG: Log setelah serialize
      if (serializedData.length > 0) {
        console.log('After serialize - Sample first row keys:', Object.keys(serializedData[0]));
        console.log('After serialize - Sample first row:', JSON.stringify(serializedData[0], null, 2));
      }

      setAllData(serializedData);

      // Cek data baru vs data lama
      setCheckingData(true);
      startTransition(async () => {
        try {
          // Debug: Cek beberapa data pertama menggunakan server action
          const debugResults = await debugCheckLaporan(serializedData);
          setDebugInfo(debugResults);
          console.log('Debug Info:', debugResults);

          const cekResult = await cekDataBaru(serializedData);

          // Filter data baru menggunakan serialized data
          const { newData, existingData: existing } = filterDataBaru(
            serializedData,
            cekResult.existingIndices
          );

          setData(newData);
          setExistingData(existing);
          setSelectedRows(new Set(newData.map((_, i) => i)));
          setStep('preview');
        } catch (err: any) {
          console.error('Error checking data:', err);
          setError(err.message || 'Gagal mengecek data');
          setStep('idle');
        } finally {
          setCheckingData(false);
          setLoading(false);
        }
      });
    } catch (err: any) {
      setError(err.message || 'Gagal membaca file Excel');
      setStep('idle');
      setLoading(false);
      setCheckingData(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setData([]);
    setAllData([]);
    setExistingData([]);
    setError('');
    setStep('idle');
    setSelectedRows(new Set());
    setCurrentIndex(0);
    setStatuses({});
    setPenindakLanjuts({});
    setCatatan({});
    setImportResult(null);
    setDebugInfo([]);
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

        // Gunakan helper function yang lebih fleksibel
        const rtgFullCode = getRTGCodeFromRow(row) || row['Jenis dan Nomor Alat yang anda operasikan contoh : RTG 51'] || '';

        // CRITICAL: Jangan serialize di sini karena data sudah di-serialize saat dibaca dari Excel
        // Kita hanya perlu memastikan row data tetap sebagai object, bukan JSON string
        return {
          row: row, // Kirim row object langsung, jangan di-serialize lagi
          status: statuses[index] || suggestStatusAwal(row),
          penindakLanjut: penindakLanjuts[index] || suggestPenindakLanjut(row['Temuan Pra-Penggunaan'] || ''),
          catatan: catatan[index] || '',
        };
      });

      // JANGAN serialize lagi! Data sudah di-serialize saat dibaca dari Excel
      // Langsung kirim importData ke server
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
          disabled={loading || checkingData}
        />
        <Button
          size="lg"
          disabled={loading || checkingData}
          onClick={() => fileInputRef.current?.click()}
        >
          {loading || checkingData ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {loading ? 'Membaca File...' : 'Mengecek Data...'}
            </>
          ) : (
            'Pilih File Excel'
          )}
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
              <p className="font-semibold">Data Excel Terbaca: {allData.length} baris</p>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="default" className="bg-green-600">
                Data Baru: {data.length}
              </Badge>
              {existingData.length > 0 && (
                <Badge variant="secondary">
                  Data Sudah Ada: {existingData.length}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              File: {file?.name}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleReset}>
            Ganti File
          </Button>
        </div>

        {/* Info jika ada data lama */}
        {existingData.length > 0 && (
          <Alert className="border-blue-200 bg-blue-50">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <p className="font-semibold">Data Duplikat Ditemukan</p>
              <p className="text-sm">
                {existingData.length} data sudah ada di database dan tidak akan ditampilkan.
                Hanya data baru yang akan diproses.
              </p>
            </AlertDescription>
          </Alert>
        )}

        {/* Debug Info */}
        {debugInfo.length > 0 && (
          <Alert className="border-orange-200 bg-orange-50">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <p className="font-semibold">Debug Info (3 data pertama)</p>
              <div className="mt-2 space-y-2 text-xs">
                {debugInfo.map((debug, i) => (
                  <div key={i} className="border-b pb-2 last:border-0">
                    <p><strong>Baris {debug.index + 1}:</strong></p>
                    <p>RTG: {debug.rtgCode} | Tanggal Excel: {String(debug.tanggalExcel)} → Parsed: {String(debug.tanggalParsed)}</p>
                    <p>Nama: {String(debug.namaPelapor)}</p>
                    <p>Temuan: {String(debug.temuanPra)}</p>
                    <p>Status: <span className={debug.exists ? 'text-green-700 font-semibold' : 'text-red-700 font-semibold'}>
                      {debug.exists ? '✓ DITEMUKAN di database' : '✗ TIDAK DITEMUKAT (dianggap baru)'}
                    </span></p>
                    {debug.foundData && (
                      <p className="ml-2 text-gray-600">
                        Found: {String(debug.foundData.jenis_kerusakan)} pada {String(debug.foundData.tanggal_laporan)}
                      </p>
                    )}
                    {debug.allReportsForDate && debug.allReportsForDate.length > 0 && (
                      <details className="ml-2">
                        <summary className="cursor-pointer text-blue-600">Lihat semua laporan untuk tanggal ini ({debug.allReportsForDate.length})</summary>
                        <ul className="mt-1 space-y-1 pl-4">
                          {debug.allReportsForDate.map((report: any, j: number) => (
                            <li key={j} className="text-gray-600">
                              - {String(report.nama_pelapor)}: {String(report.jenis_kerusakan)}
                            </li>
                          ))}
                        </ul>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}

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
                      <div className="font-medium">{safeString(row['Name'])}</div>
                      <div className="text-xs text-muted-foreground">{safeString(row['Email'])}</div>
                    </div>
                  </td>
                  <td className="p-2 text-sm">
                    {extractRTGCode(row['Jenis dan Nomor Alat yang anda operasikan contoh : RTG 51'])}
                  </td>
                  <td className="p-2 text-sm max-w-xs truncate">
                    {safeString(row['Temuan Pra-Penggunaan']) || '-'}
                  </td>
                  <td className="p-2 text-sm text-center">
                    {safeString(row['Dari 0-10 menurut anda berapa nilai Performance Alat yang anda operasikan']) || 0}
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
            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground">
                {selectedRows.size} dari {data.length} data baru diproses
              </p>
              {existingData.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {existingData.length} data sudah ada
                </Badge>
              )}
            </div>
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
                  {importResult.skipped > 0 && (
                    <p>⏭️ Dilewati (sudah ada): {importResult.skipped}</p>
                  )}
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
                  {importResult.skippedData && importResult.skippedData.length > 0 && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-orange-600">Data yang Dilewati: {importResult.skippedData.length}</summary>
                      <ul className="mt-2 space-y-1 pl-4">
                        {importResult.skippedData.map((item: any, i: number) => (
                          <li key={i} className="text-xs">
                            {item.nama} - {item.rtg}: {item.alasan}
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
                      {safeString(currentRow['Name'])} - {extractRTGCode(safeString(currentRow['Jenis dan Nomor Alat yang anda operasikan contoh : RTG 51']))}
                    </h3>
                    <p className="text-sm text-muted-foreground">{safeString(currentRow['Email'])}</p>
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
                        <p className="text-sm mt-1">{safeString(currentRow['Temuan Pra-Penggunaan'])}</p>
                      </div>
                    )}

                    {currentRow['Temuan Pasca Pengoprasian Alat'] && (
                      <div className="p-3 bg-muted rounded-lg">
                        <Label className="text-sm font-semibold">Temuan Pasca:</Label>
                        <p className="text-sm mt-1">{safeString(currentRow['Temuan Pasca Pengoprasian Alat'])}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Rating:</Label>
                        <p className="text-2xl font-bold">
                          {safeString(currentRow['Dari 0-10 menurut anda berapa nilai Performance Alat yang anda operasikan']) || 0}/10
                        </p>
                      </div>
                      <div>
                        <Label>Tanggal:</Label>
                        <p className="text-sm">{safeString(parseExcelDate(currentRow['Tanggal Pengoprasian']))}</p>
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
                          {safeString(currentRow['Saran dan perbaikan apa saja yang perlu untuk segera ditindak lanjuti.  '])}
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
