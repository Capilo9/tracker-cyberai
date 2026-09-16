/** Cyber AI: sumber progres baca-saja untuk website peserta. */
const SPREADSHEET_ID = '1CJ6spLyQs9joYfQEBziG2VfpGG78WYQYb-fAc567o_w';
const SHEET_NAME = 'Progres';
const PUBLIC_COLUMNS = ['participant_id', 'name', 'institution', 'website', 'video', 'prepost'];

function doGet() {
  try {
    if (!SPREADSHEET_ID || SPREADSHEET_ID === 'GANTI_DENGAN_ID_SPREADSHEET') {
      throw new Error('Isi SPREADSHEET_ID pada Code.gs terlebih dahulu.');
    }
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
    if (!sheet) throw new Error('Tab Progres tidak ditemukan. Sesuaikan SHEET_NAME.');
    const lastRow = sheet.getLastRow();
    const lastColumn = sheet.getLastColumn();
    if (!lastRow || !lastColumn) throw new Error('Tab Progres belum memiliki header.');
    // Read only the designated tab. No write methods, uploads, or other routes.
    if (lastRow > 1000 || lastColumn > 100) throw new Error('Gunakan tab khusus progres 30 peserta.');
    const values = sheet.getRange(1, 1, lastRow, lastColumn).getDisplayValues();
    const header = values[0].map(value => value.trim().toLowerCase());
    const positions = PUBLIC_COLUMNS.map(column => {
      const index = header.indexOf(column);
      if (index < 0 || header.lastIndexOf(column) !== index) {
        throw new Error('Header wajib dan tidak boleh duplikat: ' + column);
      }
      return index;
    });
    const rows = values.slice(1)
      .map(row => positions.map(index => row[index].trim()))
      .filter(row => row.some(value => value !== ''));
    if (rows.length > 30) throw new Error('Data melebihi 30 peserta. Periksa baris duplikat.');
    const ids = new Set();
    rows.forEach((row, index) => {
      if (!row[0] || !row[1] || !row[2]) throw new Error('ID, nama, dan instansi wajib diisi. Periksa peserta ke-' + (index + 1));
      if (ids.has(row[0])) throw new Error('ID peserta duplikat: ' + row[0]);
      ids.add(row[0]);
      for (let column = 3; column < 6; column++) {
        const value = row[column].toLowerCase();
        if (['sudah', 'true', '1'].includes(value)) row[column] = 'SUDAH';
        else if (['', 'belum', 'false', '0'].includes(value)) row[column] = 'BELUM';
        else throw new Error('Status harus SUDAH/BELUM atau TRUE/FALSE. Periksa peserta ke-' + (index + 1));
      }
    });
    // Only these six columns are returned, even if the tab has other columns.
    const csv = [PUBLIC_COLUMNS].concat(rows)
      .map(row => row.map(value => '"' + String(value).replace(/"/g, '""') + '"').join(','))
      .join('\r\n');
    return ContentService.createTextOutput(csv).setMimeType(ContentService.MimeType.CSV);
  } catch (error) {
    console.error(error);
    // Avoid exposing stack traces, internal IDs, or Google account details.
    return ContentService.createTextOutput(JSON.stringify({
      ok: false,
      message: 'Progres belum tersedia. Panitia perlu memeriksa konfigurasi dan data pada Apps Script.'
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Run from the editor to test access and authorize the spreadsheet connection.
function testConnection() {
  const output = doGet();
  if (output.getMimeType() === ContentService.MimeType.JSON) {
    throw new Error('Uji koneksi gagal. Lihat detail kesalahan pada Execution log.');
  }
  console.log('Koneksi berhasil. Sumber CSV siap digunakan.');
}
