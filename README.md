# Cyber AI — Halaman Peserta

Website **frontend saja**, tanpa login, akses admin, pengaturan, tombol edit, atau unggahan berkas. Peserta dapat melihat progres, mencari nama/instansi, memfilter status, dan membuka [web pengumpulan tugas Website](https://cyberai-smg.vercel.app).

Logo menggunakan gambar Cyber AI dari pengguna. Jumlah peserta program adalah **30**. Data pratinjau berisi 30 baris berlabel contoh; nama dan progres tersebut bukan konfirmasi data peserta nyata. Lima baris tambahan menggunakan nama placeholder Peserta 26–30.

## Integrasi Google Spreadsheet — tanpa backend

Website sudah memiliki pembaca **CSV yang dipublikasikan dari Google Sheets**. Tidak perlu Apps Script, Client ID Google, API key, atau login peserta.

### 1. Siapkan satu lembar progres untuk peserta

Buat spreadsheet khusus data publik, dengan satu tab bernama `Progres`. Gunakan header berikut pada baris pertama (masing-masing satu kolom):

| participant_id | name            | institution  | website | video | prepost |
| -------------- | --------------- | ------------ | ------- | ----- | ------- |
| peserta-01     | Nama Peserta 01 | Nama Sekolah | SUDAH   | BELUM | BELUM   |
| peserta-02     | Nama Peserta 02 | Nama Sekolah | BELUM   | SUDAH | SUDAH   |

Isi sampai **30 peserta** menggunakan data sebenarnya. `participant_id` harus unik dan tetap, misalnya `peserta-01` sampai `peserta-30`; jangan mengubah ID ketika mengurutkan baris.

- Kolom status menerima `SUDAH` / `BELUM`, `TRUE` / `FALSE` (checkbox Sheets), atau `1` / `0`.
- Status kosong dianggap BELUM.
- Nama, instansi, dan ID wajib diisi. Header tidak boleh duplikat.
- Hanya publikasikan informasi yang memang boleh dilihat peserta. Jangan tambahkan nomor telepon, email, nilai asesmen individu, tautan berkas privat, atau data lain yang tidak perlu dibagikan.
- Sebaiknya gunakan **spreadsheet terpisah untuk data publik**. Menyembunyikan kolom di tampilan website tidak membuat kolom tersebut privat di sumber CSV.

### 2. Publikasikan sebagai CSV

Di Google Sheets pada komputer:

1. Pilih **File → Share / Bagikan → Publish to web / Publikasikan ke web**.
2. Pilih **hanya tab Progres**, bukan seluruh dokumen.
3. Pilih format **Comma-separated values (.csv)**.
4. Klik **Publish / Publikasikan** dan konfirmasi hanya setelah memastikan isi tab boleh dibaca publik.
5. Pastikan **Automatically republish when changes are made** aktif.
6. Salin tautan yang dihasilkan. Bentuknya seperti ini:

```text
https://docs.google.com/spreadsheets/d/e/ID_PUBLIKASI/pub?gid=0&single=true&output=csv
```

ID dan `gid` di atas hanya contoh. Gunakan tautan asli yang dibuat Google, bukan tautan edit biasa (`.../edit`). Publish to web membuat isi tab dapat dibaca publik; tidak perlu memberi publik izin edit. Jika opsi publikasi dinonaktifkan organisasi, hubungi pengelola Google Workspace. Website tanpa login/backend ini memang memerlukan sumber yang dapat dibaca publik.

Rujukan: [Panduan resmi Google tentang publikasi](https://support.google.com/docs/answer/183965?hl=en-GB).

### 3. Hubungkan ke website

Untuk lokal, salin `.env.example` menjadi `.env.local`, lalu isi:

```dotenv
VITE_SHEETS_CSV_URL=https://docs.google.com/spreadsheets/d/e/ID_PUBLIKASI/pub?gid=0&single=true&output=csv
```

Restart server pengembangan, atau jalankan build ulang. URL sumber bersifat publik dan bukan rahasia.

Untuk Vercel: **Project → Settings → Environment Variables**, tambahkan `VITE_SHEETS_CSV_URL` dengan URL CSV tadi untuk environment yang digunakan, lalu **Redeploy**. Perubahan environment memerlukan build ulang; perubahan isi Spreadsheet tidak memerlukan deploy ulang.

### 4. Perbarui progres dari Google Sheets

Panitia mengubah status pada kolom `website`, `video`, dan `prepost` langsung di Google Sheets. Website mengecek sumber setiap 60 detik saat tab aktif dan ketika pengguna kembali ke tab. Publikasi Google dapat memiliki jeda cache, sehingga pembaruan tidak dijamin seketika.

Peserta **tidak dapat mengubah data dari website**. Tautan `cyberai-smg.vercel.app` hanya membuka situs pengumpulan yang terpisah; pengiriman di sana **tidak otomatis** memperbarui Spreadsheet ini. Otomatisasi lintas situs tersebut membutuhkan integrasi tersendiri pada sistem pengumpulan.

## Perhitungan

- Total program tetap 30 peserta, sesuai permintaan.
- Kartu tugas = jumlah peserta yang berstatus SUDAH / 30.
- Rata-rata kelengkapan = total tugas selesai / 90.
- Progres individu = tugas selesai / 3 → 0%, 33%, 67%, atau 100%.
- Jika sumber baru berisi sebagian peserta, daftar menunjukkan jumlah yang sudah tercatat; baris yang belum tersedia tidak dianggap selesai. Parser menolak lebih dari 30 baris untuk membantu mendeteksi duplikasi.
- Tenggat tetap: Website 19 September 2026, Video dan Pre-Post 26 September 2026, pukul 23.59 WIB. Ubah `src/domain.ts` bila panitia mengganti jadwal.

## Menjalankan lokal

Node.js 22.18+ dan npm:

```sh
npm ci
npm run dev
```

Atau jalankan versi hasil build:

```sh
npm run build
npm run preview
```

Tanpa `VITE_SHEETS_CSV_URL`, website menampilkan data contoh dengan label yang jelas. Bila URL sudah diisi tetapi gagal dimuat, website menampilkan pesan gagal atau data nyata terakhir dengan peringatan pembaruan tertunda; tidak menggantinya diam-diam dengan data contoh.

## Pengujian dan deployment

```sh
npm run lint
npm run test
npm run build
```

Vercel: preset **Vite**, build `npm run build`, output `dist`, Node sesuai versi minimum. `vercel.json` menangani route React Router. Tidak ada server atau Apps Script yang perlu dideploy.

Route yang digunakan: `/dashboard`, `/peserta`, `/tracker`. Tidak ada route login atau pengaturan; alamat lama yang tidak dikenali hanya menampilkan dashboard peserta.

## Struktur

- `src/App.tsx`: logo, navigasi, ringkasan dan dashboard.
- `src/Pages.tsx`: tabel peserta dan tracker baca-saja.
- `src/sheets.ts`: pembacaan CSV, validasi header/status/ID.
- `src/api.ts`: GET sumber publik, tanpa token atau mutasi.
- `src/workspace.tsx`: cache data, pembaruan berkala, loading/error.
- `src/settings.ts`: total 30 peserta dan tautan pengumpulan Website.
- `src/demo.ts`: 30 peserta contoh untuk pratinjau.
- `public/cyber-ai-logo.png`: logo asli dari pengguna, tanpa perubahan gambar.

Integrasi dengan Spreadsheet nyata belum diaktifkan karena URL sumber belum diberikan. Pembaca CSV diuji menggunakan data uji; izin publikasi, CORS, serta jeda pembaruan sumber nyata perlu diverifikasi setelah URL dipasang.

## Alternatif: Google Apps Script sebagai sumber data

Bila tidak ingin memakai Publish to web pada Spreadsheet, tersedia penghubung baca-saja di `apps-script/Code.gs`. Salin kode tersebut ke proyek Apps Script, isi ID Spreadsheet, lalu deploy sebagai web app. Gunakan URL `/exec` pada `VITE_SHEETS_CSV_URL`. Lihat [panduan pemasangan Apps Script](apps-script/PANDUAN.md).

Pilihan ini mengganti sumber CSV publik langsung; tampilan website tetap frontend dan tidak memerlukan login peserta. Enam kolom progres yang diberikan endpoint menjadi data publik. Ini bukan paket hosting seluruh tampilan di Apps Script.
