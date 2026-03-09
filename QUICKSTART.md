# 🚀 Quick Start Guide

Panduan cepat untuk mulai menggunakan **Project Cleaner**.

## 📥 Installation

### Windows

1. Download `PTools-Setup-x.x.x.exe` dari [releases page](https://github.com/yourusername/ptools/releases)
2. Double-click file installer
3. Ikuti wizard instalasi
4. Launch aplikasi dari Start Menu atau Desktop shortcut

### macOS

1. Download `PTools-x.x.x.dmg` dari [releases page](https://github.com/yourusername/ptools/releases)
2. Buka file DMG
3. Drag icon **PTools** ke folder Applications
4. Launch dari Applications atau Launchpad

### Linux

1. Download `PTools-x.x.x.AppImage` dari [releases page](https://github.com/yourusername/ptools/releases)
2. Buat executable:
   ```bash
   chmod +x PTools-x.x.x.AppImage
   ```
3. Run aplikasi:
   ```bash
   ./PTools-x.x.x.AppImage
   ```

## 🎯 First Use

### Step 1: Select Directory
![Step 1](screenshots/step1.png)

1. Launch **Project Cleaner**
2. Klik tombol **Browse** atau ketik path secara manual
3. Pilih root folder yang berisi project-project development Anda
   - Contoh: `D:\MyProjects`, `/Users/you/Developer`, `/home/you/projects`

### Step 2: Scan
![Step 2](screenshots/step2.png)

1. Klik tombol **Scan**
2. Tunggu proses scanning selesai (biasanya beberapa detik hingga menit, tergantung jumlah project)
3. Lihat hasil scan yang menampilkan:
   - Total project yang ditemukan
   - Total junk folder
   - Total ukuran yang bisa dibebaskan

### Step 3: Review Results
![Step 3](screenshots/step3.png)

Review hasil scan:
- **Build Output** (🔶 Orange) - Hasil compile/build
- **Dependencies** (🔵 Blue) - Package/library yang terinstall
- **Cache** (🟣 Purple) - Cache dari tools/framework

Setiap project menampilkan:
- Nama project dan tipe framework
- Path lengkap
- Ukuran total junk folder
- Daftar junk folder yang ditemukan

### Step 4: Delete Junk Folders
![Step 4](screenshots/step4.png)

Pilih salah satu:

**Delete Individual Folder:**
1. Expand project (klik panah)
2. Klik icon 🗑️ di samping folder yang ingin dihapus
3. Konfirmasi di dialog

**Delete All Junk (per Project):**
1. Klik icon 🧹 di header project
2. Konfirmasi untuk hapus semua junk folder dari project tersebut

### Step 5: Verify
![Step 5](screenshots/step5.png)

- Folder yang dihapus akan hilang dari list
- Summary statistics akan terupdate
- Disk space Anda sudah bersih! 🎉

## 💡 Tips & Tricks

### Best Practices

✅ **DO:**
- Scan folder parent yang berisi banyak project
- Commit & push code sebelum menghapus folder
- Review hasil scan sebelum delete
- Gunakan fitur "Open in Explorer" untuk verify folder

❌ **DON'T:**
- Jangan scan root system folder (C:\, /, dll)
- Jangan hapus folder yang sedang digunakan (close IDE/terminal dulu)
- Jangan khawatir - semua folder bisa di-regenerate/reinstall ulang

### Keyboard Shortcuts

- `Enter` - Scan setelah input directory
- `Esc` - Cancel dialog

### What Gets Deleted?

**Safe to delete (akan di-detect):**
- `node_modules` - Install ulang dengan `npm install`
- `dist`, `build`, `out` - Generate ulang dengan build command
- `.next`, `.nuxt`, `.vite` - Build ulang project
- `vendor` - Install ulang dengan `composer install`
- `.cache`, `__pycache__` - Auto-regenerate saat run
- Dan masih banyak lagi...

**NOT detected (aman):**
- Source code Anda
- Configuration files
- `.git` folder
- Database files
- Assets dan resources

### Regenerate After Delete

Setelah menghapus junk folder, regenerate dengan:

**Node.js projects:**
```bash
npm install        # restore node_modules
npm run build      # rebuild dist/build
```

**Laravel:**
```bash
composer install   # restore vendor
php artisan cache:clear
```

**Flutter:**
```bash
flutter pub get    # restore packages
flutter build      # rebuild
```

## ❓ FAQ

### Apakah aman menghapus folder-folder ini?
Ya, 100% aman. Semua folder yang terdeteksi adalah folder yang bisa di-regenerate/reinstall ulang.

### Bagaimana jika saya tidak sengaja menghapus?
Tidak masalah! Jalankan install/build command lagi untuk regenerate folder tersebut.

### Berapa banyak space yang bisa dihemat?
Tergantung jumlah dan jenis project. Biasanya:
- Project Node.js: 100-500MB per project
- Project Flutter: 500MB-1GB per project
- Total bisa mencapai beberapa GB jika banyak project

### Apakah ada risiko kehilangan code?
Tidak. Aplikasi HANYA mendeteksi dan menghapus folder build/dependency/cache. Source code Anda tetap aman.

## 🆘 Need Help?

- 📖 [Full Documentation](README.md)
- 🐛 [Report Bugs](https://github.com/yourusername/ptools/issues/new?template=bug_report.md)
- 💡 [Request Features](https://github.com/yourusername/ptools/issues/new?template=feature_request.md)
- ❓ [Ask Questions](https://github.com/yourusername/ptools/issues/new?template=question.md)

---

Happy cleaning! 🧹✨
