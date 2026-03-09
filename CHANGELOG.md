# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-03-10

### Added
- 🎉 Initial release of Project Cleaner
- Auto-detection of junk folders across multiple frameworks
- Support for Next.js, Nuxt, Vite, Flutter, Python, .NET, Android, Rust, Go, Laravel
- Visual dashboard with project statistics
- Category-based folder classification (build, dependency, cache)
- Individual and bulk delete functionality
- Open folder in Explorer/Finder integration
- Cross-platform support (Windows, macOS, Linux)
- Dark theme UI with IBM Plex Mono font
- Scan progress indicator
- Confirm dialog before deletion

### Features by Category
- **Build Output Detection**: dist, build, out, .next, .nuxt, .output, .vite, etc.
- **Dependencies Detection**: node_modules, vendor, packages, etc.
- **Cache Detection**: .cache, .turbo, .parcel-cache, __pycache__, etc.

---

## [Unreleased]

### Planned
- [ ] Search/filter functionality
- [ ] Save scan history
- [ ] Scheduled auto-scan
- [ ] Custom folder patterns
- [ ] Multi-language support
- [ ] Export scan results to CSV

---

[1.0.0]: https://github.com/yourusername/ptools/releases/tag/v1.0.0
