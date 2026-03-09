# 📋 Release Checklist & Template

## Pre-Release Checklist

- [ ] Update version di `package.json`
- [ ] Update `CHANGELOG.md` dengan changes
- [ ] Test build untuk semua platform (Windows, macOS, Linux)
- [ ] Update screenshots jika ada perubahan UI
- [ ] Review dan update README jika diperlukan
- [ ] Commit semua perubahan
- [ ] Create git tag: `git tag -a v1.0.0 -m "Release v1.0.0"`
- [ ] Push tag: `git push origin v1.0.0`

## GitHub Release Template

### Title
```
v1.0.0 - Project Cleaner
```

### Description
```markdown
## 🎉 What's New

### ✨ Features
- Feature 1 description
- Feature 2 description
- Feature 3 description

### 🐛 Bug Fixes
- Fix 1 description
- Fix 2 description

### 🔧 Improvements
- Improvement 1
- Improvement 2

### 📦 Downloads

Choose the installer for your platform:

**Windows:**
- `PTools-Setup-1.0.0.exe` - Windows installer (recommended)
- `PTools-1.0.0-win.zip` - Portable version

**macOS:**
- `PTools-1.0.0.dmg` - macOS installer
- `PTools-1.0.0-mac.zip` - ZIP archive

**Linux:**
- `PTools-1.0.0.AppImage` - AppImage (universal)
- `PTools-1.0.0.deb` - Debian/Ubuntu package
- `PTools-1.0.0.rpm` - RedHat/Fedora package

### 📝 Installation

**Windows:**
1. Download `PTools-Setup-1.0.0.exe`
2. Run the installer
3. Follow installation wizard

**macOS:**
1. Download `PTools-1.0.0.dmg`
2. Open the DMG file
3. Drag PTools to Applications folder

**Linux:**
1. Download `PTools-1.0.0.AppImage`
2. Make it executable: `chmod +x PTools-1.0.0.AppImage`
3. Run: `./PTools-1.0.0.AppImage`

### 🔗 Full Changelog
See [CHANGELOG.md](CHANGELOG.md) for complete details.

---

**Minimum Requirements:**
- Windows: Windows 10 or later
- macOS: macOS 10.13 or later
- Linux: Ubuntu 18.04 or later (or equivalent)
```

## Build Commands

```bash
# Windows
npm run build:win

# macOS
npm run build:mac

# Linux
npm run build:linux
```

Build output akan berada di folder `dist/`

## Upload Artifacts

Upload semua file dari `dist/` ke GitHub Release:
- Executables (.exe, .dmg, .AppImage)
- Installers
- Portable versions (jika ada)
- RELEASES file (untuk auto-updater)

## Auto-Updater Configuration

Pastikan file berikut tersedia untuk auto-updater:
- `latest.yml` (Windows)
- `latest-mac.yml` (macOS)
- `latest-linux.yml` (Linux)

## Post-Release

- [ ] Verify download links di README
- [ ] Update website/landing page jika ada
- [ ] Announce release di social media / community
- [ ] Monitor issues untuk bug reports
