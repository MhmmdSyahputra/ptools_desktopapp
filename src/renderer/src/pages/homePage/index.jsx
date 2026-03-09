import { useState } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Collapse,
  Divider,
  Fade,
  IconButton,
  InputAdornment,
  LinearProgress,
  Stack,
  TextField,
  Tooltip,
  Typography,
  alpha
} from '@mui/material'
import {
  FolderOpen,
  Search,
  DeleteOutline,
  CheckCircleOutline,
  ErrorOutline,
  FolderOff,
  Storage,
  ExpandMore,
  ExpandLess,
  DeleteSweep,
  CleaningServices,
  Build,
  Extension,
  CachedOutlined,
  FolderOpenOutlined
} from '@mui/icons-material'

const CATEGORY_CONFIG = {
  build: {
    label: 'build',
    color: '#ff9800',
    icon: <Build sx={{ fontSize: 11 }} />,
    tooltip: 'Hasil compile/build — aman dihapus, bisa di-generate ulang'
  },
  dependency: {
    label: 'dependency',
    color: '#1a73e8',
    icon: <Extension sx={{ fontSize: 11 }} />,
    tooltip: 'Package/library — bisa diinstall ulang'
  },
  cache: {
    label: 'cache',
    color: '#9c27b0',
    icon: <CachedOutlined sx={{ fontSize: 11 }} />,
    tooltip: 'Cache tools/framework — aman dihapus, akan di-regenerate'
  }
}

export const HomePage = () => {
  const [dirPath, setDirPath] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [deletingPath, setDeletingPath] = useState(null)
  const [scanned, setScanned] = useState(false)
  const [expanded, setExpanded] = useState({})

  const handleScan = async () => {
    if (!dirPath.trim()) return
    setLoading(true)
    setError('')
    setResults([])
    setScanned(false)
    setExpanded({})
    try {
      const data = await window.api.scanner.scanDirectory(dirPath.trim())
      setResults(data)
      setScanned(true)
      const exp = {}
      data.forEach((_, i) => {
        exp[i] = true
      })
      setExpanded(exp)
    } catch (err) {
      setError(err.message || 'Gagal membaca directory.')
    } finally {
      setLoading(false)
    }
  }

  const handleBrowse = async () => {
    const selected = await window.api.scanner.selectDirectory()
    if (selected) setDirPath(selected)
  }

  // ✨ Open folder di File Explorer / Finder
  const handleOpenFolder = (folderPath) => {
    window.api.scanner.openInExplorer(folderPath)
  }

  const handleDeleteOne = async (pi, junk) => {
    if (!window.confirm(`Hapus "${junk.name}" dari "${results[pi].project}"?`)) return
    setDeletingPath(junk.fullPath)
    try {
      await window.api.scanner.deleteJunkFolder(junk.fullPath)
      setResults((prev) => {
        const next = [...prev]
        const p = { ...next[pi] }
        p.junkFolders = p.junkFolders.filter((f) => f.fullPath !== junk.fullPath)
        p.totalSizeMB = p.junkFolders.reduce((a, f) => a + parseFloat(f.sizeMB || 0), 0).toFixed(2)
        if (p.junkFolders.length === 0) next.splice(pi, 1)
        else next[pi] = p
        return next
      })
    } catch (err) {
      alert(`Gagal hapus: ${err.message}`)
    } finally {
      setDeletingPath(null)
    }
  }

  const handleDeleteAll = async (pi) => {
    const project = results[pi]
    if (
      !window.confirm(
        `Hapus SEMUA junk folder dari "${project.project}"?\n${project.junkFolders.map((f) => f.name).join(', ')}`
      )
    )
      return
    for (const junk of project.junkFolders) {
      setDeletingPath(junk.fullPath)
      try {
        await window.api.scanner.deleteJunkFolder(junk.fullPath)
      } catch {
        /**/
      }
    }
    setDeletingPath(null)
    setResults((prev) => prev.filter((_, i) => i !== pi))
  }

  const totalMB = results.reduce((a, r) => a + parseFloat(r.totalSizeMB || 0), 0).toFixed(2)
  const totalFolders = results.reduce((a, r) => a + r.junkFolders.length, 0)
  const totalBuild = results.reduce(
    (a, r) => a + r.junkFolders.filter((f) => f.category === 'build').length,
    0
  )
  const totalDep = results.reduce(
    (a, r) => a + r.junkFolders.filter((f) => f.category === 'dependency').length,
    0
  )
  const totalCache = results.reduce(
    (a, r) => a + r.junkFolders.filter((f) => f.category === 'cache').length,
    0
  )

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#0f1117',
        backgroundImage: `radial-gradient(ellipse at 15% 15%, ${alpha('#1a73e8', 0.07)} 0%, transparent 50%), radial-gradient(ellipse at 85% 85%, ${alpha('#9c27b0', 0.04)} 0%, transparent 50%)`,
        p: 4,
        fontFamily: '"IBM Plex Mono", monospace'
      }}
    >
      <Box maxWidth={920} mx="auto">
        {/* Header */}
        <Stack direction="row" alignItems="center" gap={1.5} mb={0.5}>
          <CleaningServices sx={{ color: '#1a73e8', fontSize: 26 }} />
          <Typography
            variant="h5"
            sx={{
              fontFamily: '"IBM Plex Mono", monospace',
              fontWeight: 700,
              color: '#e8eaf6',
              letterSpacing: '-0.5px'
            }}
          >
            Project Cleaner
          </Typography>
        </Stack>
        <Typography
          variant="body2"
          sx={{
            color: alpha('#e8eaf6', 0.28),
            mb: 4,
            fontFamily: '"IBM Plex Mono", monospace',
            fontSize: 12
          }}
        >
          Deteksi & bersihkan build output · dependencies · cache — Next · Vite · Nuxt · Electron ·
          Flutter · Python · .NET · Android · Rust · Go · Laravel
        </Typography>

        {/* Input */}
        <Card
          sx={{
            bgcolor: alpha('#1e2130', 0.9),
            border: `1px solid ${alpha('#3d4263', 0.6)}`,
            borderRadius: 3,
            mb: 3
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Typography
              variant="caption"
              sx={{
                color: alpha('#e8eaf6', 0.35),
                fontFamily: '"IBM Plex Mono", monospace',
                display: 'block',
                mb: 1.5,
                textTransform: 'uppercase',
                letterSpacing: 1,
                fontSize: 11
              }}
            >
              root directory
            </Typography>
            <Stack direction="row" gap={1.5}>
              <TextField
                fullWidth
                size="small"
                placeholder="D:\MyWork\Projects"
                value={dirPath}
                onChange={(e) => setDirPath(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleScan()}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Storage sx={{ color: alpha('#e8eaf6', 0.2), fontSize: 16 }} />
                    </InputAdornment>
                  ),
                  sx: {
                    fontFamily: '"IBM Plex Mono", monospace',
                    fontSize: 14,
                    color: '#e8eaf6',
                    bgcolor: alpha('#0f1117', 0.6),
                    borderRadius: 2,
                    '& fieldset': { borderColor: alpha('#3d4263', 0.8) },
                    '&:hover fieldset': { borderColor: alpha('#1a73e8', 0.4) },
                    '&.Mui-focused fieldset': { borderColor: '#1a73e8' }
                  }
                }}
              />
              <Tooltip title="Browse folder">
                <IconButton
                  onClick={handleBrowse}
                  sx={{
                    border: `1px solid ${alpha('#3d4263', 0.8)}`,
                    borderRadius: 2,
                    color: alpha('#e8eaf6', 0.4),
                    bgcolor: alpha('#0f1117', 0.6),
                    '&:hover': {
                      bgcolor: alpha('#1a73e8', 0.1),
                      borderColor: alpha('#1a73e8', 0.5),
                      color: '#1a73e8'
                    }
                  }}
                >
                  <FolderOpen fontSize="small" />
                </IconButton>
              </Tooltip>
              <Button
                variant="contained"
                onClick={handleScan}
                disabled={loading || !dirPath.trim()}
                startIcon={loading ? <CircularProgress size={13} color="inherit" /> : <Search />}
                sx={{
                  px: 3,
                  borderRadius: 2,
                  fontFamily: '"IBM Plex Mono", monospace',
                  fontSize: 14,
                  fontWeight: 600,
                  textTransform: 'none',
                  bgcolor: '#1a73e8',
                  whiteSpace: 'nowrap',
                  '&:hover': { bgcolor: '#1557b0' },
                  '&.Mui-disabled': {
                    bgcolor: alpha('#1a73e8', 0.15),
                    color: alpha('#e8eaf6', 0.25)
                  }
                }}
              >
                {loading ? 'Scanning...' : 'Scan'}
              </Button>
            </Stack>
          </CardContent>
          {loading && (
            <LinearProgress
              sx={{
                height: 2,
                borderRadius: '0 0 12px 12px',
                bgcolor: alpha('#1a73e8', 0.1),
                '& .MuiLinearProgress-bar': { bgcolor: '#1a73e8' }
              }}
            />
          )}
        </Card>

        {/* Error */}
        {error && (
          <Fade in>
            <Card
              sx={{
                bgcolor: alpha('#f44336', 0.07),
                border: `1px solid ${alpha('#f44336', 0.25)}`,
                borderRadius: 3,
                mb: 3
              }}
            >
              <CardContent sx={{ py: 1.5, px: 2.5, '&:last-child': { pb: 1.5 } }}>
                <Stack direction="row" alignItems="center" gap={1}>
                  <ErrorOutline sx={{ color: '#f44336', fontSize: 16 }} />
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#f44336',
                      fontFamily: '"IBM Plex Mono", monospace',
                      fontSize: 13
                    }}
                  >
                    {error}
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Fade>
        )}

        {/* Summary */}
        {scanned && (
          <Fade in>
            <Stack gap={1.5} mb={3}>
              <Stack direction="row" gap={2}>
                {[
                  { label: 'Project', value: results.length, color: '#e8eaf6' },
                  { label: 'Junk folder', value: totalFolders, color: '#e8eaf6' },
                  { label: 'Total ukuran', value: `${totalMB} MB`, color: '#ff9800' }
                ].map((s) => (
                  <Card
                    key={s.label}
                    sx={{
                      flex: 1,
                      bgcolor: alpha('#1e2130', 0.9),
                      border: `1px solid ${alpha('#3d4263', 0.5)}`,
                      borderRadius: 3
                    }}
                  >
                    <CardContent sx={{ py: 1.8, px: 2.5, '&:last-child': { pb: 1.8 } }}>
                      <Typography
                        sx={{
                          fontFamily: '"IBM Plex Mono", monospace',
                          fontWeight: 700,
                          color: s.color,
                          fontSize: 22,
                          lineHeight: 1
                        }}
                      >
                        {s.value}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          color: alpha('#e8eaf6', 0.3),
                          fontFamily: '"IBM Plex Mono", monospace',
                          fontSize: 11
                        }}
                      >
                        {s.label}
                      </Typography>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
              <Stack direction="row" gap={1.5}>
                {[
                  { cat: 'build', value: totalBuild, label: 'build output' },
                  { cat: 'dependency', value: totalDep, label: 'dependencies' },
                  { cat: 'cache', value: totalCache, label: 'cache' }
                ].map((s) => {
                  const cfg = CATEGORY_CONFIG[s.cat]
                  return (
                    <Card
                      key={s.cat}
                      sx={{
                        flex: 1,
                        bgcolor: alpha('#1e2130', 0.6),
                        border: `1px solid ${alpha(cfg.color, 0.2)}`,
                        borderRadius: 2
                      }}
                    >
                      <CardContent sx={{ py: 1.2, px: 2, '&:last-child': { pb: 1.2 } }}>
                        <Stack direction="row" alignItems="center" gap={1}>
                          <Box sx={{ color: cfg.color, display: 'flex', fontSize: 15 }}>
                            {cfg.icon}
                          </Box>
                          <Typography
                            sx={{
                              fontFamily: '"IBM Plex Mono", monospace',
                              fontWeight: 700,
                              color: cfg.color,
                              fontSize: 19,
                              lineHeight: 1
                            }}
                          >
                            {s.value}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              color: alpha('#e8eaf6', 0.3),
                              fontFamily: '"IBM Plex Mono", monospace',
                              fontSize: 11
                            }}
                          >
                            {s.label}
                          </Typography>
                        </Stack>
                      </CardContent>
                    </Card>
                  )
                })}
              </Stack>
            </Stack>
          </Fade>
        )}

        {/* Empty */}
        {scanned && results.length === 0 && (
          <Fade in>
            <Card
              sx={{
                bgcolor: alpha('#1e2130', 0.9),
                border: `1px solid ${alpha('#3d4263', 0.6)}`,
                borderRadius: 3
              }}
            >
              <CardContent sx={{ py: 6, textAlign: 'center' }}>
                <FolderOff sx={{ color: alpha('#e8eaf6', 0.12), fontSize: 52, mb: 2 }} />
                <Typography
                  sx={{
                    color: alpha('#e8eaf6', 0.3),
                    fontFamily: '"IBM Plex Mono", monospace',
                    fontSize: 14
                  }}
                >
                  Tidak ada junk folder ditemukan
                </Typography>
                <Typography
                  sx={{
                    color: alpha('#e8eaf6', 0.18),
                    fontFamily: '"IBM Plex Mono", monospace',
                    fontSize: 12,
                    mt: 0.5
                  }}
                >
                  Project sudah bersih 🎉
                </Typography>
              </CardContent>
            </Card>
          </Fade>
        )}

        {/* Results */}
        {results.length > 0 && (
          <Fade in>
            <Stack gap={2}>
              {results.map((item, pi) => (
                <Fade in key={item.projectPath} style={{ transitionDelay: `${pi * 40}ms` }}>
                  <Card
                    sx={{
                      bgcolor: alpha('#1e2130', 0.9),
                      border: `1px solid ${alpha('#3d4263', 0.55)}`,
                      borderRadius: 3,
                      overflow: 'hidden',
                      transition: 'border-color 0.2s',
                      '&:hover': { borderColor: alpha('#3d4263', 1) }
                    }}
                  >
                    {/* Project header */}
                    <CardContent sx={{ py: 2, px: 3, '&:last-child': { pb: 2 } }}>
                      <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Stack direction="row" alignItems="center" gap={1.5} flex={1} minWidth={0}>
                          <CheckCircleOutline
                            sx={{ color: '#4caf50', fontSize: 15, flexShrink: 0 }}
                          />
                          <Box flex={1} minWidth={0}>
                            <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
                              <Typography
                                sx={{
                                  fontFamily: '"IBM Plex Mono", monospace',
                                  fontWeight: 700,
                                  color: '#e8eaf6',
                                  fontSize: 15
                                }}
                              >
                                {item.project}
                              </Typography>
                              {item.projectTypes.map((pt) => (
                                <Chip
                                  key={pt.key}
                                  label={pt.label}
                                  size="small"
                                  sx={{
                                    height: 18,
                                    fontSize: 11,
                                    fontFamily: '"IBM Plex Mono", monospace',
                                    fontWeight: 600,
                                    bgcolor: alpha(pt.color, 0.1),
                                    color: pt.color,
                                    border: `1px solid ${alpha(pt.color, 0.22)}`,
                                    '& .MuiChip-label': { px: 1 }
                                  }}
                                />
                              ))}
                            </Stack>
                            <Typography
                              variant="caption"
                              sx={{
                                color: alpha('#e8eaf6', 0.2),
                                fontFamily: '"IBM Plex Mono", monospace',
                                fontSize: 11,
                                display: 'block',
                                mt: 0.3,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {item.projectPath}
                            </Typography>
                          </Box>
                        </Stack>

                        <Stack direction="row" alignItems="center" gap={1} ml={2} flexShrink={0}>
                          <Chip
                            label={`${item.totalSizeMB} MB`}
                            size="small"
                            sx={{
                              height: 22,
                              fontSize: 12,
                              fontFamily: '"IBM Plex Mono", monospace',
                              fontWeight: 700,
                              bgcolor: alpha('#ff9800', 0.1),
                              color: '#ff9800',
                              border: `1px solid ${alpha('#ff9800', 0.2)}`
                            }}
                          />
                          {/* ✨ Buka project folder */}
                          <Tooltip title="Buka folder project di Explorer">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenFolder(item.projectPath)}
                              sx={{
                                color: alpha('#e8eaf6', 0.25),
                                '&:hover': { bgcolor: alpha('#00bcd4', 0.1), color: '#00bcd4' }
                              }}
                            >
                              <FolderOpenOutlined fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Hapus semua junk folder">
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteAll(pi)}
                              sx={{
                                color: alpha('#f44336', 0.45),
                                '&:hover': { bgcolor: alpha('#f44336', 0.1), color: '#f44336' }
                              }}
                            >
                              <DeleteSweep fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Divider
                            orientation="vertical"
                            flexItem
                            sx={{ borderColor: alpha('#3d4263', 0.5) }}
                          />
                          <IconButton
                            size="small"
                            onClick={() => setExpanded((p) => ({ ...p, [pi]: !p[pi] }))}
                            sx={{ color: alpha('#e8eaf6', 0.25) }}
                          >
                            {expanded[pi] ? (
                              <ExpandLess fontSize="small" />
                            ) : (
                              <ExpandMore fontSize="small" />
                            )}
                          </IconButton>
                        </Stack>
                      </Stack>
                    </CardContent>

                    {/* Junk folder rows */}
                    <Collapse in={expanded[pi]}>
                      <Divider sx={{ borderColor: alpha('#3d4263', 0.35) }} />
                      <Box sx={{ bgcolor: alpha('#0a0d14', 0.5) }}>
                        {item.junkFolders.map((junk, ji) => {
                          const cat = CATEGORY_CONFIG[junk.category] || CATEGORY_CONFIG.build
                          return (
                            <Box key={junk.fullPath}>
                              {ji > 0 && (
                                <Divider sx={{ borderColor: alpha('#3d4263', 0.15), mx: 3 }} />
                              )}
                              <Stack
                                direction="row"
                                alignItems="center"
                                justifyContent="space-between"
                                sx={{ px: 3, py: 1.5 }}
                              >
                                <Stack
                                  direction="row"
                                  alignItems="center"
                                  gap={1.5}
                                  flex={1}
                                  minWidth={0}
                                >
                                  <Tooltip title={cat.tooltip}>
                                    <Box
                                      sx={{
                                        width: 6,
                                        height: 6,
                                        borderRadius: '50%',
                                        bgcolor: cat.color,
                                        flexShrink: 0,
                                        cursor: 'help'
                                      }}
                                    />
                                  </Tooltip>
                                  <Box flex={1} minWidth={0}>
                                    <Stack direction="row" alignItems="center" gap={1}>
                                      <Typography
                                        sx={{
                                          fontFamily: '"IBM Plex Mono", monospace',
                                          fontSize: 13,
                                          color: alpha('#e8eaf6', 0.75),
                                          fontWeight: 600
                                        }}
                                      >
                                        {junk.name}
                                      </Typography>
                                      <Tooltip title={cat.tooltip}>
                                        <Chip
                                          label={cat.label}
                                          size="small"
                                          icon={
                                            <Box
                                              sx={{
                                                color: `${cat.color} !important`,
                                                display: 'flex',
                                                ml: '6px !important'
                                              }}
                                            >
                                              {cat.icon}
                                            </Box>
                                          }
                                          sx={{
                                            height: 17,
                                            fontSize: 10,
                                            fontFamily: '"IBM Plex Mono", monospace',
                                            bgcolor: alpha(cat.color, 0.08),
                                            color: cat.color,
                                            border: `1px solid ${alpha(cat.color, 0.2)}`,
                                            cursor: 'help',
                                            '& .MuiChip-label': { px: 0.8, pl: 0.4 }
                                          }}
                                        />
                                      </Tooltip>
                                    </Stack>
                                    <Typography
                                      sx={{
                                        fontFamily: '"IBM Plex Mono", monospace',
                                        fontSize: 11,
                                        color: alpha('#e8eaf6', 0.18),
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap'
                                      }}
                                    >
                                      {junk.fullPath}
                                    </Typography>
                                  </Box>
                                </Stack>

                                <Stack
                                  direction="row"
                                  alignItems="center"
                                  gap={1}
                                  flexShrink={0}
                                  ml={2}
                                >
                                  <Chip
                                    label={`${junk.packageCount} items`}
                                    size="small"
                                    sx={{
                                      height: 20,
                                      fontSize: 11,
                                      fontFamily: '"IBM Plex Mono", monospace',
                                      bgcolor: alpha('#e8eaf6', 0.05),
                                      color: alpha('#e8eaf6', 0.4),
                                      border: `1px solid ${alpha('#e8eaf6', 0.08)}`,
                                      '& .MuiChip-label': { px: 1 }
                                    }}
                                  />
                                  <Chip
                                    label={`${junk.sizeMB} MB`}
                                    size="small"
                                    sx={{
                                      height: 20,
                                      fontSize: 11,
                                      fontFamily: '"IBM Plex Mono", monospace',
                                      bgcolor: alpha('#ff9800', 0.08),
                                      color: alpha('#ff9800', 0.8),
                                      border: `1px solid ${alpha('#ff9800', 0.15)}`,
                                      '& .MuiChip-label': { px: 1 }
                                    }}
                                  />
                                  {/* ✨ Buka junk folder */}
                                  <Tooltip title={`Buka ${junk.name} di Explorer`}>
                                    <IconButton
                                      size="small"
                                      onClick={() => handleOpenFolder(junk.fullPath)}
                                      sx={{
                                        color: alpha('#e8eaf6', 0.2),
                                        '&:hover': {
                                          bgcolor: alpha('#00bcd4', 0.1),
                                          color: '#00bcd4'
                                        }
                                      }}
                                    >
                                      <FolderOpenOutlined sx={{ fontSize: 15 }} />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title={`Hapus ${junk.name}`}>
                                    <span>
                                      <IconButton
                                        size="small"
                                        onClick={() => handleDeleteOne(pi, junk)}
                                        disabled={deletingPath === junk.fullPath}
                                        sx={{
                                          color: alpha('#f44336', 0.4),
                                          '&:hover': {
                                            bgcolor: alpha('#f44336', 0.1),
                                            color: '#f44336'
                                          }
                                        }}
                                      >
                                        {deletingPath === junk.fullPath ? (
                                          <CircularProgress size={13} color="inherit" />
                                        ) : (
                                          <DeleteOutline sx={{ fontSize: 16 }} />
                                        )}
                                      </IconButton>
                                    </span>
                                  </Tooltip>
                                </Stack>
                              </Stack>
                            </Box>
                          )
                        })}
                      </Box>
                    </Collapse>
                  </Card>
                </Fade>
              ))}
            </Stack>
          </Fade>
        )}
      </Box>
    </Box>
  )
}
