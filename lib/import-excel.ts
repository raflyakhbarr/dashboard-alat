import * as XLSX from 'xlsx';

export interface ExcelRowData {
  'ID': number;
  'Start time': number;
  'Completion time': number;
  'Email': string;
  'Name': string;
  'Last modified time': any;
  'Nama Operator ': string;
  'Group': string;
  'Jenis dan Nomor Alat yang anda operasikan contoh : RTG 51': string;
  'Tanggal Pengoprasian': number;
  'Temuan Pra-Penggunaan': string;
  'Uplod disini temuan Anda (max 100MB)': any;
  'Temuan Pasca Pengoprasian Alat': string;
  'Uplod disini temuan Anda (max 100MB)2': any;
  'Dari 0-10 menurut anda berapa nilai Performance Alat yang anda operasikan': number;
  'Saran dan perbaikan apa saja yang perlu untuk segera ditindak lanjuti.  ': string;
  'Silahkan Uploud disini untuk percepatan tindakan. ': any;
  '': any;
  'Catatan ': string;
  'Tindak lanjut': string;
  'Status ': string;
}

export async function readExcelFile(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet);

        // Filter out empty rows and header
        const filteredData = jsonData.filter((row: any) =>
          row['Email'] && row['Name'] && row['Jenis dan Nomor Alat yang anda operasikan contoh : RTG 51']
        );

        resolve(filteredData);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error('Gagal membaca file'));
    };

    reader.readAsArrayBuffer(file);
  });
}

export function parseExcelDate(excelDate: number): string {
  // Excel date is number of days since 1/1/1900
  const date = new Date(Math.round((excelDate - 25569) * 86400 * 1000));
  return date.toISOString().split('T')[0];
}

export function extractRTGCode(jenisAlat: string): string {
  // Extract "45" from "RTG 45" or just return the cleaned code
  const cleaned = jenisAlat.trim().toUpperCase();
  // Remove "RTG" prefix if present and get just the number/code
  return cleaned.replace(/^RTG\s*/, '');
}

export function collectPhotoURLs(row: any): string[] {
  const photos: string[] = [];

  if (row['Uplod disini temuan Anda (max 100MB)']) {
    photos.push(row['Uplod disini temuan Anda (max 100MB)']);
  }
  if (row['Uplod disini temuan Anda (max 100MB)2']) {
    photos.push(row['Uplod disini temuan Anda (max 100MB)2']);
  }
  if (row['Silahkan Uploud disini untuk percepatan tindakan. ']) {
    photos.push(row['Silahkan Uploud disini untuk percepatan tindakan. ']);
  }

  return photos.filter(url => url && url.startsWith('http'));
}

export function suggestStatusAwal(row: any): 'READY' | 'READY_CATATAN_RINGAN' | 'READY_CATATAN_BERAT' | 'TIDAK_READY' {
  const temuanPra = row['Temuan Pra-Penggunaan']?.toString().toLowerCase() || '';
  const rating = row['Dari 0-10 menurut anda berapa nilai Performance Alat yang anda operasikan'] || 0;

  // Tidak ada temuan
  if (!temuanPra || temuanPra.includes('tidak ada') || temuanPra === '') {
    return 'READY';
  }

  // Ada temuan + rating
  if (rating >= 8) {
    return 'READY'; // Masih performa baik
  } else if (rating >= 6) {
    return 'READY_CATATAN_RINGAN';
  } else if (rating >= 4) {
    return 'READY_CATATAN_BERAT';
  } else {
    return 'TIDAK_READY'; // Performa buruk
  }
}

export function suggestPenindakLanjut(temuan: string): 'fasilitas' | 'peralatan_terminal' | 'perencanaan_persediaan' {
  const lower = temuan.toLowerCase();

  if (lower.includes('bogie') || lower.includes('roda') ||
      lower.includes('gardan') || lower.includes('farside') ||
      lower.includes('hoist') || lower.includes('trolly') ||
      lower.includes('mekanis')) {
    return 'peralatan_terminal'; // Mechanical issues
  } else if (lower.includes('gantri') || lower.includes('gantry') ||
             lower.includes('kabel') || lower.includes('electrik') ||
             lower.includes('struktur')) {
    return 'fasilitas'; // Electrical/structural
  } else {
    return 'perencanaan_persediaan'; // General/supply
  }
}
