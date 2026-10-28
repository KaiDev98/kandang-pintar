# PRD: Kandang Pintar

Sistem Manajemen Peternakan Ayam Kampung Berbasis Web (PWA) + AI

| | |
| --- | --- |
| Versi | 1.0 (draft untuk review) |
| Tanggal | 28 Oktober 2026 |
| Sumber | Dokumen Perencanaan Proyek v1.4 (27 Oktober 2026) |
| Pemilik produk | Klien (peternak pemula) |
| Tim | 1 developer full-stack, 1 desainer paruh waktu |
| Dokumen pendamping | `design.md` (desain UI/UX dan desain teknis) |

---

## 1. Ringkasan Produk

### 1.1 Masalah

Peternak pemula yang memulai dari 4 ekor indukan (1 jantan, 3 betina) belum punya cara yang rapi untuk mencatat telur, penetasan, pakan, kesehatan, dan biaya. Akibatnya mereka tidak tahu berapa modal sebenarnya per ekor ayam, kapan ayam layak jual, dan berapa harga jual yang aman.

### 1.2 Solusi

Aplikasi web mobile-first (PWA) yang berpusat pada **batch ayam dan siklus hidupnya**:

```
Telur dierami induk → menetas (batch baru) → dikandangkan → diumbar → dipantau
→ dijual bertahap per ekor → HPP dan laba dihitung
```

Aplikasi memberi panduan (alert, pengingat, saran AI), bukan hanya tempat menyimpan data.

### 1.3 Proposisi nilai

1. Pencatatan harian selesai di bawah 30 detik dari HP Android.
2. Klien selalu tahu HPP per ekor, harga impas, dan laba per batch tanpa bantuan developer.
3. Aplikasi tetap bisa dipakai saat mati lampu (input offline sederhana).
4. Data bisa dibawa ke Excel kapan saja.

---

## 2. Pengguna

| Peran | Status | Deskripsi | Akses |
| --- | --- | --- | --- |
| Pemilik | Tahap awal | Klien. Satu-satunya pengguna, pemula, input dari HP Android di dekat kandang | Semua fitur |
| Pekerja kandang | Ditunda | Membantu input harian | Catatan harian saja, tanpa keuangan |
| Admin sistem | Internal | Developer atau maintainer | Teknis dan dukungan, tercatat di audit log |

**Persona utama: Pemilik.** Belum berpengalaman beternak, memakai Android (Chrome), internet cukup stabil kecuali saat mati lampu. Ingin tahu apakah usahanya untung, dan butuh sistem yang memandu langkah demi langkah.

Tahap awal tanpa manajemen peran. Struktur data tetap memakai `farm_id` dan `farm_members` supaya multi-pengguna bisa ditambahkan tanpa perombakan.

---

## 3. Tujuan, Non-Tujuan, dan Indikator Keberhasilan

### 3.1 Tujuan

1. Menggantikan catatan manual dengan pencatatan digital yang konsisten.
2. Memberi gambaran kondisi peternakan secara real-time.
3. Menghitung HPP, pendapatan, dan laba per batch.
4. Membantu keputusan lewat AI (kapan panen, apa yang tidak normal, seberapa efisien pakan).

### 3.2 Non-tujuan (tahap awal)

- Aplikasi native Android/iOS.
- Sensor IoT (suhu, kelembapan, timbangan otomatis).
- Marketplace atau pembayaran online.
- Notifikasi WhatsApp/Telegram dan web push.
- Multi-peternakan (SaaS komersial) dan multi-pengguna.
- Pembukuan formal, laporan untuk pinjaman, dan laporan PDF.
- Impor data lama (peternakan dimulai setelah sistem jadi).
- Stok pakan dan estimasi hari stok habis.
- Analisis komposisi atau rasio campuran pakan.

### 3.3 KPI

| KPI | Target | Cara ukur |
| --- | --- | --- |
| Waktu pencatatan harian | < 30 detik | Waktu dari buka Catat Cepat sampai Simpan (event analitik) dan uji kegunaan |
| Kebiasaan mencatat | ≥ 5 hari per minggu setelah 1 bulan pemakaian | Hitung hari dengan catatan harian lengkap |
| LCP halaman utama | < 2,5 detik (Android kelas menengah, 4G) | Lighthouse CI dan RUM |
| Respons API p95 | < 300 ms untuk operasi umum | Log server |
| Uptime | ≥ 99,5% per bulan | Uptime Kuma |
| Kemandirian klien | Klien melihat HPP dan laba per batch tanpa bantuan | Skenario UAT |
| Budget JS awal | < 200 KB gzip | Lighthouse CI |

---

## 4. Keputusan Terkunci dari Klien

Semua poin berikut berasal dari validasi klien dan menjadi dasar kebutuhan.

| Topik | Keputusan | Konsekuensi produk |
| --- | --- | --- |
| Jenis ayam | Ayam kampung biasa, tanpa strain | Tanpa kurva standar bawaan; target dibuat dari target klien dan sampling sendiri |
| Skala | 4 indukan (1 jantan, 3 betina), 2 kandang, 2 tempat bertelur/mengeram | Indukan dicatat individual |
| Siklus panen | Tiap 3–4 bulan | Target umur panen default 3–4 bulan |
| Pengguna | 1 orang | Satu akun, tanpa peran |
| Layak jual | Umur ≥ 3 bulan **dan** bobot > 1 kg **dan** sehat; tanpa kelas bobot | Ambang dapat diatur, checklist sehat |
| Pakan | Dedak (hasil sendiri, Rp 0) dan pur (sekitar Rp 10.000/kg); benih beras opsional; komposisi tetap; tanpa rasio | Catatan pakan harian berisi berat dan harga saja |
| Telur | Dierami induk sendiri, tidak dijual dan tidak dikonsumsi; target anakan > 10 per siklus; anak ayam tidak dibeli | Telur dan penetasan dicatat per induk; sumber anakan hanya tetas sendiri |
| Tempat mengeram | Boleh dipakai bergantian, tidak oleh dua induk sekaligus | Aturan satu tempat satu induk |
| Kandang | Satu induk beserta anakannya, maksimal 25 ekor | Peringatan kapasitas; maksimal 2 batch di kandang bersamaan |
| Setelah diumbar | Anakan (umur 2–4 minggu) diumbar dan tidak kembali ke kandang; hitung ulang mingguan; kandang kosong paling cepat minggu ke-3 setelah menetas | Fase kandang dan umbaran; kejadian "hilang" |
| Harga jual | Berubah menurut musim dan pembeli; harga tengah Rp 70.000/ekor | Harga acuan untuk proyeksi; harga aktual dicatat per transaksi |
| Cara panen | Bertahap per ekor; satu transaksi boleh gabungan beberapa batch | Laba batch sementara, final saat batch ditutup |
| Perangkat | Android, Chrome | Target uji utama; antrean offline sederhana |
| Notifikasi | Di dalam aplikasi saja | Pusat notifikasi |
| Ekspor | Excel/CSV: laporan per batch dan seluruh catatan harian | Dua jenis ekspor, PDF ditunda |
| Rilis | Menunggu sistem lengkap | Tanpa rilis bertahap (opsi tetap terbuka) |

**Dua penafsiran yang harus dikonfirmasi pada review desain:**

1. Dedak dianggap tanpa biaya (Rp 0). Nilai pasar tetap bisa diisi kapan saja.
2. Tidak ada analisis komposisi pakan; hanya berat dan harga harian.

---

## 5. Ruang Lingkup per Fase

| Fase | Durasi | Cakupan | Prioritas |
| --- | --- | --- | --- |
| 0. Discovery dan desain | 1 minggu | Validasi alur, wireframe, ERD, keputusan stack final | Must |
| 1. MVP pencatatan | 5 minggu | Akun pemilik, kandang dan tempat mengeram, indukan dan batch, catatan harian (populasi, pakan, minum, telur), penetasan, kesehatan dan vaksin dasar, biaya dasar, dashboard dasar, PWA, mode demo | Must |
| 2. Penjualan, laba, monitoring | 3 minggu | Penjualan per ekor, HPP, laba/rugi, alokasi biaya indukan, sampling bobot, notifikasi dalam aplikasi, ekspor Excel/CSV | Must |
| 3. Fitur AI | 3 minggu | Catat bahasa natural, tanya-jawab, insight mingguan, cek kesehatan awal, estimasi panen | Should |
| 4. Penguatan dan rilis | 2 minggu | UAT, tuning performa, review keamanan, backup, dokumentasi, pelatihan klien | Must |
| 5. Pasca-rilis | Berkelanjutan | Prediksi lebih akurat, rekomendasi efisiensi, OCR nota, WhatsApp/Telegram, multi-pengguna | Could |

Total sekitar 14 minggu sampai rilis lengkap.

---

## 6. Konsep Inti dan Glosarium

| Istilah | Arti dalam aplikasi |
| --- | --- |
| Indukan | Ayam dewasa pemilik telur (Jantan 1, Betina 1–3), dicatat individual |
| Batch | Kelompok anakan hasil satu penetasan, terhubung ke induk dan catatan penetasan |
| Fase | Dikandangkan (awal) lalu diumbar (setelah 2–4 minggu) |
| Tempat pengeraman | 2 unit; satu tempat hanya untuk satu induk selama masa mengeram |
| Penetasan | Pengeraman telur oleh induk (tanpa mesin tetas), sekitar 21 hari |
| Layak jual | Umur ≥ 3 bulan, bobot > 1 kg, dan sehat (ambang dapat diatur) |
| HPP | Harga pokok per ekor: total biaya batch dibagi ayam terjual dan yang masih hidup |
| Hitung ulang | Hitung manual mingguan jumlah anakan di umbaran |

---

## 7. Alur Pengguna Utama

| ID | Alur | Langkah singkat | Hasil |
| --- | --- | --- | --- |
| J1 | Onboarding | Buat kandang → daftarkan indukan → catat pakan pertama | Peternakan siap dipakai (atau coba mode demo dulu) |
| J2 | Catat harian | Buka Catat Cepat → cek nilai default → ubah dengan plus/minus → Simpan | Pakan, minum, telur, kematian tersimpan < 30 detik |
| J3 | Siklus tetas | Mulai pengeraman (induk + tempat + jumlah telur) → sistem hitung perkiraan menetas → catat jumlah menetas | Batch baru dan hatch rate |
| J4 | Umbaran | Catat tanggal mulai diumbar → hitung ulang mingguan → selisih jadi "hilang" | Populasi akurat |
| J5 | Jual | Pilih ayam layak jual → checklist sehat → isi bobot dan harga per ekor → status bayar | Penjualan, laba sementara terupdate |
| J6 | Lihat laba | Buka Keuangan → pilih batch | HPP, harga impas, laba, margin, ROI |
| J7 | Ekspor | Pilih laporan per batch atau seluruh catatan harian | File .xlsx atau .csv |

---

## 8. Kebutuhan Fungsional

Kolom **Fase** merujuk ke bagian 5. Kriteria penerimaan (KP) ditulis agar bisa diuji langsung.

### 8.1 Akun dan Pengaturan (FR-ACC)

| ID | Kebutuhan | Kriteria penerimaan | Fase |
| --- | --- | --- | --- |
| FR-ACC-01 | Login email atau nomor HP + password | Password di-hash (argon2/bcrypt); percobaan gagal dibatasi (rate limit) | 1 |
| FR-ACC-02 | Sesi tetap aktif di HP | Pengguna tidak diminta login ulang selama sesi valid, termasuk saat offline | 1 |
| FR-ACC-03 | Profil peternakan dan pengaturan | Nama farm, daftar kandang, satuan (kg, gram, liter, ekor), Rupiah, WIB | 1 |
| FR-ACC-04 | Parameter yang dapat diatur | Ambang layak jual (umur, bobot), lama pengeraman (21 hari), batas kosong kandang (minggu ke-3), kapasitas kandang (25), harga acuan (Rp 70.000), harga pur default (Rp 10.000/kg), ambang alert | 1–2 |
| FR-ACC-05 | Wizard onboarding | Alur 3 langkah selesai tanpa membuka menu lain | 1 |
| FR-ACC-06 | Mode demo | Data contoh bisa dibuat dan dihapus sekali klik; data demo diberi penanda dan tidak ikut laporan asli | 1 |

### 8.2 Ayam: Indukan, Batch, Kandang (FR-FLK)

| ID | Kebutuhan | Kriteria penerimaan | Fase |
| --- | --- | --- | --- |
| FR-FLK-01 | Kandang dan tempat pengeraman | 2 kandang (kapasitas 25) dan 2 tempat pengeraman tersedia sebagai data awal; dapat diubah | 1 |
| FR-FLK-02 | Indukan individual | Kode (Jantan 1, Betina 1–3), jenis kelamin, tanggal masuk, status (aktif, afkir, mati, terjual) | 1 |
| FR-FLK-03 | Batch anakan dibuat dari penetasan | Batch memuat induk, kandang, tanggal menetas, jumlah awal, fase, target umur (default 90 hari) dan bobot (default 1 kg) | 1 |
| FR-FLK-04 | Pergerakan populasi sebagai kejadian | Jenis: masuk, mati, afkir, hilang, terjual, pindah, penyesuaian. Populasi aktif dihitung dari kejadian dan tidak bisa diedit langsung | 1 |
| FR-FLK-05 | Fase kandang ke umbaran | Tanggal mulai diumbar dicatat sebagai kejadian; peringatan lembut jika di luar usia 2–4 minggu | 1 |
| FR-FLK-06 | Peringatan kapasitas | Peringatan muncul saat jumlah ayam di satu kandang mendekati 25 (default mulai 23); bersifat peringatan, tidak memblokir | 1 |
| FR-FLK-07 | Status kandang terisi/kosong | Kandang "kosong" paling cepat pada minggu ke-3 setelah menetas (dapat diatur) dan setelah anakan diumbar | 1 |
| FR-FLK-08 | Hitung ulang mingguan di umbaran | Pengingat mingguan; selisih antara hitungan dan catatan otomatis menjadi kejadian "hilang" atau "mati" (dipilih pengguna) | 1 |
| FR-FLK-09 | Kalender siklus | Menampilkan mulai eram, perkiraan menetas, perkiraan umbaran, perkiraan panen (3–4 bulan), dan keterpakaian 2 kandang serta 2 tempat pengeraman | 1 |
| FR-FLK-10 | Status batch | Aktif → siap jual → sebagian terjual → selesai. "Siap jual" bila umur ≥ 3 bulan dan bobot rata-rata sampling > 1 kg | 2 |
| FR-FLK-11 | Tutup batch | Menutup batch mengunci laba menjadi final; dibuka ulang hanya dengan konfirmasi dan tercatat di audit log | 2 |

### 8.3 Telur dan Penetasan (FR-EGG)

| ID | Kebutuhan | Kriteria penerimaan | Fase |
| --- | --- | --- | --- |
| FR-EGG-01 | Catatan telur harian per induk | Jumlah telur dan kondisi (baik, pecah, abnormal); tidak ada pilihan "jual" atau "konsumsi" | 1 |
| FR-EGG-02 | Mulai pengeraman | Memilih induk, tempat pengeraman, tanggal mulai, jumlah telur; sistem menghitung perkiraan menetas (default +21 hari) | 1 |
| FR-EGG-03 | Aturan satu tempat satu induk | Sistem menolak penjadwalan dua induk di tempat yang sama pada rentang waktu yang beririsan, dengan pesan jelas. Tempat bebas setelah pengeraman selesai | 1 |
| FR-EGG-04 | Hasil tetas | Input jumlah menetas; sistem menghitung hatch rate, membuat batch baru, membebaskan tempat | 1 |
| FR-EGG-05 | Penetasan gagal | Jika menetas 0, tidak ada batch dibuat dan pengeraman ditutup | 1 |
| FR-EGG-06 | Indikator target anakan | Hasil tetas menampilkan perbandingan dengan target klien (> 10 anakan per siklus) sebagai informasi | 1 |

### 8.4 Pakan (FR-FED)

| ID | Kebutuhan | Kriteria penerimaan | Fase |
| --- | --- | --- | --- |
| FR-FED-01 | Catatan pakan harian | Tanggal, batch atau indukan, jenis (pur, dedak, benih beras, lainnya), berat (kg), harga (Rp) | 1 |
| FR-FED-02 | Default harga | Pur memakai harga default (≈ Rp 10.000/kg), dedak Rp 0, benih beras opsional; semua dapat diubah per catatan | 1 |
| FR-FED-03 | Biaya pakan otomatis | Biaya pakan masuk ke biaya batch; biaya per ekor per hari dihitung otomatis | 1 |
| FR-FED-04 | Pakan di umbaran | Hanya pakan tambahan yang dicatat; efisiensi pakan (FCR) diberi label "perkiraan" | 1 |
| FR-FED-05 | Tanpa resep atau rasio | Tidak ada input rasio campuran dan tidak ada analisis komposisi | 1 |

### 8.5 Minum (FR-WTR)

| ID | Kebutuhan | Kriteria penerimaan | Fase |
| --- | --- | --- | --- |
| FR-WTR-01 | Mode sederhana | Centang harian: air diganti dan wadah dibersihkan | 1 |
| FR-WTR-02 | Mode detail | Volume (liter) dan catatan vitamin atau elektrolit | 1 |
| FR-WTR-03 | Alert konsumsi turun | Alert bila konsumsi turun > 20% dari rata-rata (hanya aktif pada mode detail) | 2 |

### 8.6 Kesehatan (FR-HLT)

| ID | Kebutuhan | Kriteria penerimaan | Fase |
| --- | --- | --- | --- |
| FR-HLT-01 | Catatan gejala dan pengobatan | Tanggal, batch, gejala, obat/vitamin, dosis, hasil | 1 |
| FR-HLT-02 | Jadwal vaksinasi dan obat cacing | Template dapat diubah; pengingat jatuh tempo muncul di Beranda dan pusat notifikasi | 1 |
| FR-HLT-03 | Catatan kematian | Jumlah dan dugaan penyebab; otomatis menjadi kejadian "mati" | 1 |
| FR-HLT-04 | Checklist biosekuriti | Kebersihan kandang, pembatasan tamu, karantina | 1 |
| FR-HLT-05 | Status kesehatan batch | Sehat, perlu perhatian, sakit | 1 |
| FR-HLT-06 | Checklist sehat sebelum jual | Nafsu makan, bulu, mata, kaki, keaktifan; hasilnya menjadi dasar layak jual | 2 |

### 8.7 Pertumbuhan (FR-GRW)

| ID | Kebutuhan | Kriteria penerimaan | Fase |
| --- | --- | --- | --- |
| FR-GRW-01 | Sampling timbang | Input 5–10 bobot per batch; rata-rata dihitung otomatis | 2 |
| FR-GRW-02 | Kurva pertumbuhan | Grafik bobot aktual terhadap ambang 1 kg, beserta estimasi tanggal mencapai 1 kg | 2 |

### 8.8 Biaya (FR-CST)

| ID | Kebutuhan | Kriteria penerimaan | Fase |
| --- | --- | --- | --- |
| FR-CST-01 | Pencatatan biaya berkategori | Kategori: ayam indukan, pakan, obat dan vitamin, vaksin, listrik, air, tenaga kerja, peralatan, perbaikan kandang, transportasi, lain-lain | 1 |
| FR-CST-02 | Biaya langsung ke batch | Biaya dapat ditautkan ke batch tertentu | 1 |
| FR-CST-03 | Alokasi biaya umum | Listrik dan tenaga kerja dialokasikan proporsional ekor-hari | 2 |
| FR-CST-04 | Alokasi biaya indukan | Biaya pemeliharaan indukan selama masa tetas dialokasikan ke batch hasil tetas sebagai biaya awal; mode pilihan: per anakan atau per telur | 2 |
| FR-CST-05 | Foto nota | Lampiran dari kamera HP | 1 |

### 8.9 Penjualan dan Laba (FR-SAL)

| ID | Kebutuhan | Kriteria penerimaan | Fase |
| --- | --- | --- | --- |
| FR-SAL-01 | Transaksi penjualan per ekor | Tanggal, pembeli (opsional), item per ekor (batch, bobot, harga), biaya pengiriman, status bayar (lunas/piutang) | 2 |
| FR-SAL-02 | Gabungan beberapa batch | Satu transaksi boleh memuat ayam dari beberapa batch | 2 |
| FR-SAL-03 | Penjualan bertahap | Tidak semua ayam batch harus dijual sekaligus | 2 |
| FR-SAL-04 | Validasi layak jual | Sistem menandai ayam yang belum memenuhi umur 3 bulan atau bobot 1 kg; penjualan di bawah ambang butuh konfirmasi eksplisit | 2 |
| FR-SAL-05 | Harga acuan | Rp 70.000 jadi nilai awal; harga aktual disimpan dan rata-ratanya dibandingkan dengan acuan | 2 |
| FR-SAL-06 | Perhitungan per batch | Total biaya, HPP per ekor dan per kg, pendapatan, laba kotor, margin, ROI | 2 |
| FR-SAL-07 | Laba sementara dan final | Sementara = pendapatan sejauh ini − (HPP/ekor × ekor terjual); final saat batch ditutup | 2 |
| FR-SAL-08 | Kalkulator harga | Harga impas dan harga yang disarankan untuk target margin | 2 |
| FR-SAL-09 | Perbandingan batch dan arus kas | Perbandingan keuntungan antarbatch, arus kas bulanan, daftar piutang | 2 |

### 8.10 Dashboard, Alert, Notifikasi (FR-DSH)

| ID | Kebutuhan | Kriteria penerimaan | Fase |
| --- | --- | --- | --- |
| FR-DSH-01 | Beranda | Total ayam aktif per batch, mortalitas, pakan hari ini dan biayanya, status minum, telur hari ini, status kesehatan, biaya bulan ini, proyeksi laba, hitung mundur panen | 1–2 |
| FR-DSH-02 | Alert berbasis aturan | Aturan di bawah ini dievaluasi deterministik (bukan AI) | 1–2 |
| FR-DSH-03 | Pusat notifikasi | Daftar alert dengan status baru/dibaca dan penanda di Beranda; tanpa web push | 2 |

Aturan alert:

| Aturan | Pemicu (default, dapat diatur) |
| --- | --- |
| Mortalitas tinggi | Melewati ambang per batch (default 5%) |
| Vaksin jatuh tempo | Pada dan setelah tanggal jadwal |
| Pakan atau minum turun | Turun > 20% dari rata-rata 7 hari |
| Bobot di bawah kurva | Rata-rata sampling di bawah target pada umur tersebut |
| Catatan harian belum diisi | Belum ada catatan sampai jam 18.00 WIB |
| Telur hampir menetas | H-3 perkiraan menetas |
| Batch mendekati panen | 14 hari sebelum umur target |
| Kandang mendekati kapasitas | ≥ 23 dari 25 ekor |
| Hitung ulang mingguan | Tujuh hari sejak hitung ulang terakhir (batch umbaran) |
| Kandang siap dipakai | Mencapai minggu ke-3 setelah menetas dan anakan sudah diumbar |

### 8.11 Laporan dan Ekspor (FR-RPT)

| ID | Kebutuhan | Kriteria penerimaan | Fase |
| --- | --- | --- | --- |
| FR-RPT-01 | Laporan harian, mingguan, bulanan, per batch | Tampil di aplikasi dengan filter periode | 2 |
| FR-RPT-02 | Ekspor laporan per batch | File .xlsx dan .csv berisi biaya, HPP, penjualan, laba | 2 |
| FR-RPT-03 | Ekspor seluruh catatan harian | File .xlsx dan .csv per modul: populasi, pakan, telur, kesehatan, biaya, penjualan | 2 |
| FR-RPT-04 | Format lokal | Rupiah (Rp 1.250.000), tanggal (27 Okt 2026), kolom berjudul Bahasa Indonesia | 2 |

### 8.12 PWA dan Offline (FR-PWA)

| ID | Kebutuhan | Kriteria penerimaan | Fase |
| --- | --- | --- | --- |
| FR-PWA-01 | Dapat dipasang | Muncul prompt pasang di Chrome Android; ikon dan splash tersedia | 1 |
| FR-PWA-02 | Input offline untuk catatan harian | Pakan, minum, telur, dan kematian bisa disimpan saat offline dan antre | 1 |
| FR-PWA-03 | Sinkronisasi otomatis | Antrean dikirim saat online; idempotency key mencegah data ganda | 1 |
| FR-PWA-04 | Indikator status | Banner offline dan jumlah catatan menunggu sinkron terlihat jelas | 1 |

---

## 9. Aturan Bisnis

| ID | Aturan |
| --- | --- |
| BR-01 | Satu tempat pengeraman hanya dipakai satu induk pada satu waktu |
| BR-02 | Satu kandang berisi satu induk beserta anakannya; kapasitas 25 ekor termasuk induk selama di kandang |
| BR-03 | Paling banyak 2 batch berada di kandang bersamaan; batch yang sudah diumbar tidak dihitung |
| BR-04 | Anakan yang sudah diumbar tidak kembali ke kandang |
| BR-05 | Kandang kosong paling cepat minggu ke-3 setelah anakan menetas (dapat diatur) |
| BR-06 | Telur tidak dijual dan tidak dikonsumsi; semua telur baik untuk penetasan |
| BR-07 | Sumber batch hanya tetas sendiri (struktur data tetap bisa mendukung pembelian) |
| BR-08 | Layak jual: umur ≥ 3 bulan **dan** bobot > 1 kg **dan** sehat |
| BR-09 | Dedak dicatat Rp 0 kecuali pengguna mengisi nilai pasar |
| BR-10 | Populasi aktif selalu turunan dari kejadian, tidak diedit langsung; koreksi lewat kejadian penyesuaian |
| BR-11 | Uang disimpan sebagai bilangan bulat Rupiah; waktu disimpan UTC dan ditampilkan WIB |
| BR-12 | Perubahan data keuangan dan penutupan batch tercatat di audit log |
| BR-13 | Penghapusan memakai soft delete |
| BR-14 | Penulisan data oleh AI wajib dikonfirmasi pengguna |

### Rumus

```
Populasi aktif         = masuk − mati − afkir − hilang − terjual ± pindah
Mortalitas (%)         = mati ÷ populasi awal × 100
FCR (perkiraan)        = total pakan (kg) ÷ total pertambahan bobot (kg)
ADG                    = (bobot rata-rata akhir − awal) ÷ jumlah hari
Total biaya batch      = alokasi biaya indukan + pakan + obat/vaksin
                         + alokasi biaya umum + biaya lain
HPP per ekor           = total biaya batch ÷ (ayam terjual + ayam hidup)
HPP per kg             = total biaya batch ÷ total bobot terjual
Laba sementara         = pendapatan sejauh ini − (HPP per ekor × ekor terjual)
Laba akhir             = pendapatan − total biaya batch (saat batch ditutup)
Margin (%)             = laba ÷ pendapatan × 100
ROI (%)                = laba ÷ total biaya × 100
Biaya pakan/ekor/hari  = biaya pakan harian ÷ ayam aktif
Hatch rate (%)         = telur menetas ÷ telur dieram × 100
Harga pakan per kg     = harga ÷ berat pada tiap catatan (dedak = Rp 0)
Biaya awal anakan      = biaya indukan periode tetas ÷ jumlah anakan menetas
```

---

## 10. Fitur AI

AI adalah lapisan tambahan. Aplikasi harus tetap berfungsi penuh bila layanan AI tidak tersedia.

| ID | Fitur | Cara kerja | Fase |
| --- | --- | --- | --- |
| FR-AI-01 | Catat dengan bahasa natural | Teks atau suara diubah menjadi data terstruktur, **ditampilkan untuk dikonfirmasi** sebelum disimpan | 3 |
| FR-AI-02 | Asisten tanya-jawab | Memanggil tool read-only yang sudah ditentukan; tidak boleh membuat SQL bebas | 3 |
| FR-AI-03 | Insight mingguan | Anomali dideteksi statistik (rata-rata bergerak, z-score), LLM menarasikan dalam bahasa sederhana | 3 |
| FR-AI-04 | Cek kesehatan awal | Input gejala dan foto; keluaran tingkat urgensi dan langkah awal | 3 |
| FR-AI-05 | Estimasi panen dan laba | Kurva pertumbuhan sederhana; pada batch pertama hanya berbasis target klien dan diberi label "perkiraan awal" | 3 |
| FR-AI-06 | Rekomendasi efisiensi | Analisis FCR dan biaya pakan | 5 |
| FR-AI-07 | Scan nota (OCR) | Foto nota menjadi data biaya | 5 |

**Guardrails (wajib):**

1. Setiap penulisan data oleh AI melewati konfirmasi pengguna.
2. Angka dari tool terstruktur, bukan karangan model.
3. Saran kesehatan memuat disclaimer; kematian mendadak dalam jumlah banyak atau gejala menular memicu aturan merah (rule-based) yang mengarahkan ke dokter hewan atau dinas peternakan setempat.
4. Batas penggunaan, cache, model ringan untuk parsing, model lebih besar hanya untuk analisis.
5. Hanya data yang diperlukan dikirim ke penyedia AI; semua interaksi dicatat untuk evaluasi.
6. Lapisan abstraksi penyedia agar model atau vendor mudah diganti.

**Kriteria rilis fitur AI:** lulus kumpulan kasus uji Bahasa Indonesia (pencatatan, pertanyaan data, gejala) dengan target akurasi yang disepakati bersama klien sebelum rilis.

---

## 11. Kebutuhan Non-Fungsional

| Kategori | Kebutuhan |
| --- | --- |
| Performa | JS awal < 200 KB gzip; LCP < 2,5 s; API p95 < 300 ms; query berindeks, paginasi, tabel ringkasan harian; Optimistic UI saat Simpan |
| Mobile-first | Desain dimulai dari layar 360 px; target sentuh ≥ 44 px; target uji utama Chrome Android |
| Offline | Catatan harian bisa diantre; sinkron otomatis dengan idempotency key |
| Keandalan | Uptime ≥ 99,5%; backup database harian ke object storage terpisah, retensi ≥ 30 hari, uji restore berkala |
| Keamanan | HTTPS wajib, hash password modern, rate limiting, validasi input (Zod), audit log untuk data keuangan, `farm_id` pada semua tabel |
| Privasi | Minimalisasi data pembeli, hak hapus, sesuai prinsip UU Pelindungan Data Pribadi |
| Aksesibilitas | Kontras tinggi, status tidak hanya bergantung warna, ukuran huruf dapat diperbesar, label dan fokus jelas |
| Lokalisasi | Bahasa Indonesia sehari-hari; format Rp, tanggal, satuan lokal |
| Maintainability | Monolit modular, TypeScript strict, migrasi terversi, tes untuk logika HPP, laba, populasi, biaya pakan |

---

## 12. Rekomendasi Teknologi (ringkas)

Rincian ada di `design.md`. Pilihan default (Opsi A):

TypeScript strict; Next.js (App Router) + Tailwind CSS + shadcn/ui; TanStack Query, React Hook Form, Zod; Recharts; PWA dengan Serwist dan IndexedDB; PostgreSQL; ORM (Drizzle atau Prisma); pg-boss untuk job latar belakang; Better Auth atau Auth.js; abstraksi LLM sendiri; Docker Compose di VPS Jakarta/Singapura dengan Cloudflare; Sentry, Uptime Kuma, pino; GitHub Actions.

---

## 13. Pengujian dan Kriteria Rilis

- Unit test (Vitest): HPP, laba, populasi, biaya pakan, alokasi biaya.
- Integration test: penyimpanan data dan sinkronisasi offline.
- E2E (Playwright, viewport mobile): login, catat harian, jual ayam, lihat laba.
- Lighthouse CI dengan budget performa.
- Evaluasi AI dengan kasus uji Bahasa Indonesia.
- UAT bersama klien dengan data contoh.

**Definition of Done rilis:**

1. Semua FR berprioritas Must lulus kriteria penerimaan.
2. KPI performa terpenuhi di Lighthouse CI.
3. Klien menyelesaikan skenario J1–J7 tanpa bantuan.
4. Backup dan uji restore berhasil.
5. Dokumentasi (README, ERD, panduan singkat, runbook) tersedia.

---

## 14. Risiko dan Mitigasi

| Risiko | Mitigasi |
| --- | --- |
| Klien lupa mencatat | Catat Cepat, pengingat harian, default pintar, input bahasa natural |
| Sinyal lemah atau mati lampu | PWA dengan antrean offline dan sinkron otomatis |
| AI keliru atau berbahaya | Tool terstruktur, konfirmasi, disclaimer, aturan merah, arahan ke dokter hewan |
| Biaya API AI membengkak | Batas penggunaan, cache, model ringan, pemantauan biaya |
| Data awal sedikit, prediksi kurang akurat | Estimasi berbasis target, label "perkiraan awal", rentang kepercayaan |
| Asupan umbaran tidak terukur | FCR diberi label perkiraan, untuk membandingkan antarbatch |
| Jumlah anakan terbatas dan bervariasi | Kalender siklus dan perkiraan kapasitas dari telur, hatch rate, batas 25 ekor |
| Scope creep | MVP dulu, backlog terkelola, perubahan lewat persetujuan |
| Data hilang | Backup otomatis, uji restore, soft delete, audit log |
| UI terasa rumit | Uji kegunaan dini dengan prototipe, wizard onboarding, bahasa sederhana |

---

## 15. Asumsi dan Pertanyaan Terbuka

Poin berikut adalah keputusan interpretatif yang saya tambahkan saat menyusun PRD dan belum tegas di dokumen plan. Mohon dikonfirmasi saat review.

| No | Topik | Usulan di PRD | Alasan |
| --- | --- | --- | --- |
| Q1 | Aturan tempat pengeraman: peringatan atau blokir | Ditolak (hard rule) | Klien menyatakan tidak boleh dua induk sekaligus; plan hanya menyebut "memperingatkan" |
| Q2 | Kapasitas 25 ekor: termasuk induk atau tidak | Termasuk induk | Bagian 6.2 plan menyebut termasuk induk, bagian 17 hanya "maksimal 25 ekor" |
| Q3 | Definisi "siap jual" di tingkat batch | Umur ≥ 3 bulan dan bobot rata-rata sampling > 1 kg; keputusan per ekor tetap saat transaksi | Anakan dicatat per batch, bukan individual |
| Q4 | Alokasi biaya indukan "per telur" | Biaya periode ÷ telur baik periode itu, dibebankan sebesar telur yang dieram; sisanya jadi biaya umum. Default: per anakan | Plan menyebut dua mode tanpa definisi rinci |
| Q5 | Ambang mortalitas dan ambang alert lain | Default 5%, 14 hari menjelang panen, 23 dari 25 ekor, jam 18.00 | Plan hanya menyebut "melewati ambang" tanpa angka |
| Q6 | Pengeraman gagal (0 menetas) | Tidak membuat batch; biaya periode jadi biaya umum | Kasus tepi tidak dibahas di plan |
| Q7 | Stack: ORM dan autentikasi | Rekomendasi Drizzle dan Better Auth, final di ADR fase 0 | Plan menyebut dua alternatif masing-masing |

**Dependensi:** akses LLM API (fase 3), VPS dan domain (fase 1), konfirmasi klien atas dua penafsiran di bagian 4 (sebelum desain final).

---

## Lampiran A. Ringkasan Entitas Data

users, farms, farm_members · coops, nest_boxes · flocks, birds, flock_movements · feed_logs, water_logs, egg_logs, hatch_batches · health_records, vaccination_schedules, medications · weight_samples · expense_categories, expenses · customers, sales, sale_items · alerts, reminders · ai_conversations, ai_messages, ai_insights · audit_logs, attachments

Skema rinci, constraint, dan ERD ada di `design.md` bagian 11.
