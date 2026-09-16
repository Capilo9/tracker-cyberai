# Memasang penghubung Google Apps Script

## Apa yang dijalankan di Apps Script?

**Google Spreadsheet → Apps Script (baca-saja) → website peserta.**

Kode `Code.gs` di folder ini mengambil progres dari Spreadsheet. Tampilan React tetap berjalan sebagai website frontend, misalnya di Vercel atau pratinjau lokal. Tidak ada login peserta, panel admin, atau API pengubahan data.

Jangan menyalin `App.tsx`, folder `src`, atau file ZIP ke editor Apps Script. Berkas tersebut adalah source React, bukan kode `.gs`.

Apps Script juga dapat menjadi tempat hosting tampilan HTML, tetapi paket ini adalah **penghubung data**, bukan konversi seluruh website menjadi `Index.html`. Untuk menjalankan semuanya lewat URL Apps Script tanpa Vercel, diperlukan versi HTML yang disesuaikan dan komunikasi `google.script.run`.

## 1. Siapkan Spreadsheet

Buat tab bernama **Progres**. Baris pertama berisi enam header:

| participant_id | name            | institution  | website | video | prepost |
| -------------- | --------------- | ------------ | ------- | ----- | ------- |
| peserta-01     | Nama Peserta 01 | Nama Sekolah | SUDAH   | BELUM | BELUM   |
| peserta-02     | Nama Peserta 02 | Nama Sekolah | BELUM   | SUDAH | SUDAH   |

Masukkan data sebenarnya untuk 30 peserta. ID harus unik dan tetap. Status boleh SUDAH/BELUM atau checkbox TRUE/FALSE; kosong dianggap BELUM.

Spreadsheet tidak perlu dipublikasikan sebagai CSV bila menggunakan Apps Script ini. Namun enam kolom yang dikembalikan oleh endpoint web app akan **dapat dibaca publik** apabila aksesnya Anyone. Publikasikan hanya data progres yang boleh dilihat peserta. Kode tidak mengembalikan kolom lain atau tab lain; hindari menambahkan data pribadi yang tidak diperlukan pada enam kolom tersebut.

## 2. Buka editor dan salin kode

1. Buka Spreadsheet tersebut.
2. Klik **Extensions / Ekstensi → Apps Script**.
3. Di sebelah kiri, buka berkas bawaan **Code.gs**.
4. Bila ini proyek baru, hapus fungsi contoh `myFunction()`. Jangan menimpa kode proyek lain yang sedang digunakan.
5. Buka file **Code.gs dari paket Cyber AI**, salin **seluruh isinya**, lalu tempel ke Code.gs di editor Google.
6. Ganti baris ini:

```javascript
const SPREADSHEET_ID = "GANTI_DENGAN_ID_SPREADSHEET";
```

ID adalah teks antara `/d/` dan `/edit` pada alamat Spreadsheet, bukan seluruh URL. Contoh:

```text
https://docs.google.com/spreadsheets/d/1AbcContohID/edit
                                      └ 1AbcContohID adalah ID
```

Jika nama tab berbeda, ubah juga:

```javascript
const SHEET_NAME = "Progres";
```

7. Klik **Save / Simpan**. Beri nama proyek, misalnya **Cyber AI Progres Peserta**.

## 3. Uji koneksi

1. Pada dropdown nama fungsi di toolbar, pilih **testConnection**.
2. Klik **Run / Jalankan**.
3. Tinjau dan berikan izin akses Spreadsheet untuk script milik Anda.
4. Periksa **Execution log / Log eksekusi**. Hasil yang benar: **Koneksi berhasil. Sumber CSV siap digunakan.**

Jika gagal, log akan menunjukkan penyebabnya: ID keliru, tab tidak ditemukan, header tidak sesuai, kolom kosong, ID duplikat, atau lebih dari 30 peserta. Fungsi ini hanya membaca; tidak mengubah isi Spreadsheet.

## 4. Deploy sebagai Web app

1. Klik **Deploy / Terapkan → New deployment / Deployment baru**.
2. Pada ikon pengaturan jenis deployment, pilih **Web app / Aplikasi web**.
3. **Execute as / Jalankan sebagai:** pilih **Me / Saya**.
4. **Who has access / Siapa yang memiliki akses:** pilih **Anyone / Siapa saja** agar website peserta dapat membacanya tanpa login.
5. Klik **Deploy / Terapkan** dan selesaikan otorisasi bila diminta.
6. Salin **Web app URL** yang berakhiran **`/exec`**. Jangan memakai deployment ID saja atau URL pengujian `/dev`.

Jika opsi Anyone tidak tersedia pada akun sekolah, kebijakan Google Workspace dapat membatasinya. Hubungi pengelola akun; endpoint yang meminta login tidak cocok untuk halaman peserta tanpa login.

Buka URL `/exec` di browser. Browser dapat menampilkan atau mengunduh CSV berisi enam kolom dan data peserta. **URL ini adalah sumber data, bukan halaman dashboard.** Jika yang muncul halaman login atau pesan JSON gagal, selesaikan masalah deployment/izin/data sebelum menghubungkan website.

## 5. Sambungkan website yang sudah dibuat

Frontend terbaru menerima URL `/exec` ini melalui variabel yang sama:

```dotenv
VITE_SHEETS_CSV_URL=https://script.google.com/macros/s/ID_DEPLOYMENT_ANDA/exec
```

- **Lokal:** masukkan ke `.env.local`, lalu restart server. Untuk pratinjau hasil build, jalankan `npm run build` lalu `npm run preview`.
- **Vercel:** Project → Settings → Environment Variables → tambahkan/ganti `VITE_SHEETS_CSV_URL` → Redeploy.

Gunakan frontend terbaru dalam paket ini; versi awal yang hanya mendukung URL publik Google Sheets belum menerima URL Apps Script.

## Pemakaian sehari-hari

Panitia memperbarui SUDAH/BELUM di Spreadsheet. Website mengambil data setiap 60 detik selama tab aktif dan saat pengguna kembali ke tab. Tidak perlu deploy ulang untuk perubahan isi Spreadsheet.

Setelah mengubah **kode Apps Script**, buka **Deploy → Manage deployments → Edit → New version → Deploy** agar URL `/exec` menggunakan kode terbaru. Menekan Save di editor saja tidak memperbarui versi deployment yang sudah aktif.

Jika data di situs pengumpulan Website ingin otomatis mengubah status, situs pengumpulan tersebut perlu memiliki integrasi terpisah. Penghubung ini hanya membaca status yang ada di Sheets.

## Status pengujian

Kode dan validasi sumber URL diuji secara lokal menggunakan data uji. Koneksi langsung Google belum diuji karena ID Spreadsheet dan deployment belum diberikan. Uji akses URL `/exec` dan koneksi dari website sesudah deployment, khususnya bila akun sekolah memiliki pembatasan akses atau browser memblokir permintaan lintas domain.

## Referensi resmi

- [Apps Script Web Apps dan deployment](https://developers.google.com/apps-script/guides/web)
- [Content Service untuk CSV](https://developers.google.com/apps-script/guides/content)
- [Hosting HTML dan komunikasi google.script.run](https://developers.google.com/apps-script/guides/html/communication)
