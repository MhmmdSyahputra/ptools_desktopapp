const fs = require('fs')
const path = require('path')

/**
 * Kategori folder sampah:
 *   'dependency' — package/library yang diinstall (bisa diinstall ulang)
 *   'build'      — hasil compile/build (bisa digenerate ulang)
 *   'cache'      — cache tools/framework
 */

export const PROJECT_TYPES = {
  // ─── Next.js (harus di atas node agar lebih spesifik) ─────────────────────
  next: {
    label: 'Next.js',
    color: '#e8eaf6',
    markers: ['next.config.js', 'next.config.ts', 'next.config.mjs'],
    junkFolders: [
      { name: 'node_modules', category: 'dependency' },
      { name: '.next', category: 'build' },
      { name: 'out', category: 'build' }
    ]
  },

  // ─── Vite ──────────────────────────────────────────────────────────────────
  vite: {
    label: 'Vite',
    color: '#bd34fe',
    markers: ['vite.config.js', 'vite.config.ts', 'vite.config.mjs'],
    junkFolders: [
      { name: 'node_modules', category: 'dependency' },
      { name: 'dist', category: 'build' }
    ]
  },

  // ─── Nuxt ──────────────────────────────────────────────────────────────────
  nuxt: {
    label: 'Nuxt',
    color: '#00dc82',
    markers: ['nuxt.config.js', 'nuxt.config.ts'],
    junkFolders: [
      { name: 'node_modules', category: 'dependency' },
      { name: '.nuxt', category: 'build' },
      { name: '.output', category: 'build' }
    ]
  },

  // ─── Remix ─────────────────────────────────────────────────────────────────
  remix: {
    label: 'Remix',
    color: '#ef4444',
    markers: ['remix.config.js', 'remix.config.ts'],
    junkFolders: [
      { name: 'node_modules', category: 'dependency' },
      { name: 'build', category: 'build' },
      { name: '.cache', category: 'cache' }
    ]
  },

  // ─── SvelteKit ─────────────────────────────────────────────────────────────
  svelte: {
    label: 'SvelteKit',
    color: '#ff3e00',
    markers: ['svelte.config.js', 'svelte.config.ts'],
    junkFolders: [
      { name: 'node_modules', category: 'dependency' },
      { name: '.svelte-kit', category: 'build' },
      { name: 'build', category: 'build' }
    ]
  },

  // ─── Electron ──────────────────────────────────────────────────────────────
  electron: {
    label: 'Electron',
    color: '#47c2d4',
    markers: [
      'electron.vite.config.js',
      'electron.vite.config.ts',
      'electron-builder.yml',
      'electron-builder.json',
      'electron-builder.json5'
    ],
    junkFolders: [
      { name: 'node_modules', category: 'dependency' },
      { name: 'dist', category: 'build' },
      { name: 'dist-electron', category: 'build' },
      { name: 'release', category: 'build' },
      { name: 'out', category: 'build' }
    ]
  },

  // ─── React Native / Expo ───────────────────────────────────────────────────
  react_native: {
    label: 'React Native',
    color: '#61dafb',
    markers: ['metro.config.js', 'metro.config.ts', 'react-native.config.js'],
    junkFolders: [
      { name: 'node_modules', category: 'dependency' },
      { name: '.expo', category: 'cache' },
      { name: '.expo-shared', category: 'cache' }
    ]
  },

  // ─── Generic Node.js (paling terakhir, paling umum) ───────────────────────
  node: {
    label: 'Node.js',
    color: '#68a063',
    markers: ['package.json'],
    junkFolders: [
      { name: 'node_modules', category: 'dependency' },
      { name: 'dist', category: 'build' },
      { name: 'build', category: 'build' }
    ]
  },

  // ─── Flutter ───────────────────────────────────────────────────────────────
  flutter: {
    label: 'Flutter',
    color: '#54c5f8',
    markers: ['pubspec.yaml'],
    junkFolders: [
      { name: 'build', category: 'build' },
      { name: '.dart_tool', category: 'cache' }
    ]
  },

  // ─── Python ────────────────────────────────────────────────────────────────
  python: {
    label: 'Python',
    color: '#f7c948',
    markers: ['requirements.txt', 'setup.py', 'pyproject.toml'],
    junkFolders: [
      { name: '__pycache__', category: 'cache' },
      { name: '.venv', category: 'dependency' },
      { name: 'venv', category: 'dependency' },
      { name: 'env', category: 'dependency' },
      { name: 'dist', category: 'build' },
      { name: 'build', category: 'build' },
      { name: '.eggs', category: 'build' },
      { name: '.mypy_cache', category: 'cache' },
      { name: '.pytest_cache', category: 'cache' },
      { name: '.ruff_cache', category: 'cache' }
    ]
  },

  // ─── .NET ──────────────────────────────────────────────────────────────────
  dotnet: {
    label: '.NET',
    color: '#7b5ea7',
    markers: ['*.csproj', '*.sln', '*.fsproj'],
    junkFolders: [
      { name: 'bin', category: 'build' },
      { name: 'obj', category: 'build' }
    ]
  },

  // ─── Android ───────────────────────────────────────────────────────────────
  android: {
    label: 'Android',
    color: '#3ddc84',
    markers: ['build.gradle', 'build.gradle.kts'],
    junkFolders: [
      { name: 'build', category: 'build' },
      { name: '.gradle', category: 'cache' },
      { name: 'captures', category: 'build' },
      { name: 'intermediates', category: 'build' },
      { name: 'generated', category: 'build' }
    ]
  },

  // ─── Maven ─────────────────────────────────────────────────────────────────
  java_maven: {
    label: 'Maven',
    color: '#c71a36',
    markers: ['pom.xml'],
    junkFolders: [{ name: 'target', category: 'build' }]
  },

  // ─── Gradle (non-Android) ──────────────────────────────────────────────────
  gradle: {
    label: 'Gradle',
    color: '#02303a',
    markers: ['settings.gradle', 'settings.gradle.kts'],
    junkFolders: [
      { name: 'build', category: 'build' },
      { name: '.gradle', category: 'cache' }
    ]
  },

  // ─── Rust ──────────────────────────────────────────────────────────────────
  rust: {
    label: 'Rust',
    color: '#ce422b',
    markers: ['Cargo.toml'],
    junkFolders: [{ name: 'target', category: 'build' }]
  },

  // ─── Go ────────────────────────────────────────────────────────────────────
  go: {
    label: 'Go',
    color: '#00add8',
    markers: ['go.mod'],
    junkFolders: [
      { name: 'bin', category: 'build' },
      { name: 'dist', category: 'build' },
      { name: 'tmp', category: 'build' }
    ]
  },

  // ─── Laravel / PHP ─────────────────────────────────────────────────────────
  laravel: {
    label: 'Laravel',
    color: '#ff2d20',
    markers: ['artisan'],
    junkFolders: [
      { name: 'vendor', category: 'dependency' },
      { name: 'node_modules', category: 'dependency' },
      { name: 'bootstrap/cache', category: 'cache' },
      { name: 'storage/logs', category: 'cache' }
    ]
  },
  php_composer: {
    label: 'Composer',
    color: '#8892bf',
    markers: ['composer.json'],
    junkFolders: [{ name: 'vendor', category: 'dependency' }]
  }
}

/**
 * Deteksi tipe project dari suatu folder.
 * Urutan penting — tipe spesifik (next, vite) di cek sebelum yang umum (node).
 */
function detectProjectType(dirPath) {
  const matched = []
  try {
    const entries = fs.readdirSync(dirPath).map((e) => e.toLowerCase())
    for (const [type, config] of Object.entries(PROJECT_TYPES)) {
      const isMatch = config.markers.some((marker) => {
        if (marker.includes('*')) {
          const ext = marker.replace('*.', '.')
          return entries.some((e) => e.endsWith(ext))
        }
        return entries.includes(marker.toLowerCase())
      })
      if (isMatch) matched.push(type)
    }
  } catch {
    /* skip */
  }

  // Kalau ada tipe spesifik (next/vite/nuxt), hapus generic 'node'
  const specific = ['next', 'vite', 'nuxt', 'remix', 'svelte', 'electron', 'react_native']
  if (matched.some((m) => specific.includes(m))) {
    const idx = matched.indexOf('node')
    if (idx !== -1) matched.splice(idx, 1)
  }

  return matched
}

/**
 * Scan basePath, deteksi project type, dan cari folder sampah
 */
export function scanForJunkFolders(basePath) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(basePath)) {
      return reject(new Error(`Path tidak ditemukan: ${basePath}`))
    }

    const results = []

    function scanDir(currentPath, depth = 0) {
      if (depth > 4) return

      let entries
      try {
        entries = fs.readdirSync(currentPath, { withFileTypes: true })
      } catch {
        return
      }

      const projectTypes = detectProjectType(currentPath)

      if (projectTypes.length > 0 && depth > 0) {
        // Merge semua junkFolders dari semua tipe yang terdeteksi, tanpa duplikat
        const junkMap = new Map()
        for (const t of projectTypes) {
          for (const junk of PROJECT_TYPES[t].junkFolders) {
            const key = junk.name.toLowerCase()
            if (!junkMap.has(key)) junkMap.set(key, junk)
          }
        }

        const junkFoldersFound = []
        for (const entry of entries) {
          if (!entry.isDirectory()) continue
          const junkDef = junkMap.get(entry.name.toLowerCase())
          if (junkDef) {
            const fullPath = path.join(currentPath, entry.name)
            const sizeInfo = calculateSize(fullPath)
            junkFoldersFound.push({
              name: entry.name,
              category: junkDef.category,
              fullPath,
              ...sizeInfo
            })
          }
        }

        if (junkFoldersFound.length > 0) {
          results.push({
            project: path.basename(currentPath),
            projectPath: currentPath,
            projectTypes: projectTypes.map((t) => ({
              key: t,
              label: PROJECT_TYPES[t].label,
              color: PROJECT_TYPES[t].color
            })),
            junkFolders: junkFoldersFound,
            totalSizeMB: junkFoldersFound
              .reduce((acc, f) => acc + parseFloat(f.sizeMB || 0), 0)
              .toFixed(2)
          })
        }
        return
      }

      for (const entry of entries) {
        if (!entry.isDirectory()) continue
        const fullPath = path.join(currentPath, entry.name)
        scanDir(fullPath, depth + 1)
      }
    }

    scanDir(basePath)
    resolve(results)
  })
}

function calculateSize(folderPath) {
  try {
    const entries = fs.readdirSync(folderPath)
    const packageCount = entries.length
    const sizeBytes = getFolderSize(folderPath)
    const sizeMB = (sizeBytes / (1024 * 1024)).toFixed(2)
    return { packageCount, sizeBytes, sizeMB }
  } catch {
    return { packageCount: 0, sizeBytes: 0, sizeMB: '0.00' }
  }
}

function getFolderSize(folderPath) {
  let total = 0
  try {
    const entries = fs.readdirSync(folderPath, { withFileTypes: true })
    for (const entry of entries) {
      const full = path.join(folderPath, entry.name)
      try {
        if (entry.isDirectory()) total += getFolderSize(full)
        else total += fs.statSync(full).size
      } catch {
        /* skip */
      }
    }
  } catch {
    /* skip */
  }
  return total
}

export function deleteJunkFolder(folderPath) {
  return new Promise((resolve, reject) => {
    try {
      if (!fs.existsSync(folderPath)) {
        return reject(new Error(`Path tidak ditemukan: ${folderPath}`))
      }
      fs.rmSync(folderPath, { recursive: true, force: true })
      resolve({ success: true, deletedPath: folderPath })
    } catch (err) {
      reject(new Error(`Gagal hapus: ${err.message}`))
    }
  })
}
