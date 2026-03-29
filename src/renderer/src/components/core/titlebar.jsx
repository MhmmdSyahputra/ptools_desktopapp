import { useEffect, useState } from 'react'
import Snackbar from '@mui/material/Snackbar'
import MuiAlert from '@mui/material/Alert'
import {
  AppBar,
  Toolbar,
  Box,
  IconButton,
  Avatar,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress
} from '@mui/material'
import { Minimize, CropSquare, Close, Settings, Warning } from '@mui/icons-material'
import { Update as UpdateIcon } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import AppLogo from '@renderer/assets/electron.svg'

// eslint-disable-next-line react/prop-types
export const TitleBar = ({ theme = 'dark', showUpdateButton = false }) => {
  const navigate = useNavigate()
  const appTitle = 'PTools Desktop'
  const [deviceId, setDeviceId] = useState('')
  const [deviceName, setDeviceName] = useState('')
  const [deviceBrand, setDeviceBrand] = useState('')
  const [deviceInfo, setDeviceInfo] = useState({
    hostname: '',
    platform: '',
    arch: '',
    osVersion: '',
    cpu: '',
    cpuCores: null,
    totalRam: null,
    freeRam: null,
    uptime: null,
    ipAddress: '',
    macAddress: '',
    username: ''
  })
  const [openCloseDialog, setOpenCloseDialog] = useState(false)
  const [openDeviceDialog, setOpenDeviceDialog] = useState(false)
  const [openedProgress, setOpenedProgress] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState(0)

  const [updateInfoOpen, setUpdateInfoOpen] = useState(false)
  const [updateInfoMsg, setUpdateInfoMsg] = useState('')
  const [updateInfoSeverity, setUpdateInfoSeverity] = useState(
    'success' | 'warning' | 'error' | 'info'
  )

  useEffect(() => {
    const handleKeyDown = (e) => {
      const { key, altKey, ctrlKey } = e

      if (key === 'F4' && altKey) e.preventDefault()
      if (key === 'F5') e.preventDefault()
      if (key === 'f' && altKey) e.preventDefault()
      if (key === 'F11') e.preventDefault()
      if ((key === 'r' || key === 'R') && ctrlKey) {
        window.location.reload()
      }
      if (key === 'i' && ctrlKey) {
        e.preventDefault()
        navigate('/xyz/info')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [navigate])

  const getDeviceUuid = async () => {
    try {
      const res = await window.api.device.deviceUuid()
      if (res) {
        setDeviceId(res)
      }
    } catch (error) {
      console.error('Failed to get device uuid', error)
    }
  }

  const getDeviceName = async () => {
    try {
      const res = await window.api.device.deviceName()
      if (res?.hostname) {
        const label = `${res.hostname} (${res.platform})`
        setDeviceName(label)
      }
    } catch (error) {
      console.error('Failed to get device name', error)
    }
  }
  const getDeviceBrand = async () => {
    try {
      const res = await window.api.device.deviceBrand()
      if (res?.manufacturer || res?.model) {
        setDeviceBrand(`${res.manufacturer} ${res.model}`.trim())
      }
    } catch (error) {
      console.error('Failed to get device brand', error)
    }
  }

  const getDeviceInfo = async () => {
    try {
      const res = await window.api.device.deviceInfo()
      console.log(res)

      setDeviceInfo(res)
    } catch (error) {
      console.error('Failed to get device info', error)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    getDeviceName()
    getDeviceUuid()
    getDeviceInfo()
    getDeviceBrand()
  }, [])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F12') {
        e.preventDefault()
        setOpenDeviceDialog((prev) => !prev)
      }
      if ((e.key === 'r' || e.key === 'R') && e.ctrlKey) {
        window.location.reload()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    // Subscribe to update progress
    const unsubProgress = window.api.onUpdateProgress((percent) => {
      setDownloadProgress(percent)
      setOpenedProgress(true)
      if (percent >= 100) {
        setTimeout(() => setOpenedProgress(false), 2000)
      }
    })

    // Subscribe to update notifications
    const unsubNotification = window.api.onUpdateNotification((message, severity) => {
      setUpdateInfoMsg(message)
      setUpdateInfoSeverity(severity)
      setUpdateInfoOpen(true)
    })

    return () => {
      unsubProgress()
      unsubNotification()
    }
  }, [])

  const handleCheckUpdates = () => {
    try {
      setUpdateInfoMsg('Memeriksa pembaruan...')
      setUpdateInfoSeverity('info')
      setUpdateInfoOpen(true)

      window.api.checkForUpdates()
    } catch (e) {
      console.error('Failed to request update check', e)
      setUpdateInfoMsg('Gagal memeriksa pembaruan')
      setUpdateInfoSeverity('error')
      setUpdateInfoOpen(true)
    }
  }

  const handleMinimize = () => {
    window.electron?.ipcRenderer.send('window-minimize')
  }

  const handleMaximize = () => {
    window.electron?.ipcRenderer.send('window-maximize')
  }

  const handleCloseClick = () => {
    setOpenCloseDialog(true)
  }

  const handleCloseConfirm = () => {
    setOpenCloseDialog(false)
    window.electron?.ipcRenderer.send('window-close')
  }

  const handleCloseCancel = () => {
    setOpenCloseDialog(false)
  }

  return (
    <>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          height: 40,
          top: 0,
          left: 0,
          right: 0,
          zIndex: (t) => t.zIndex.drawer + 1,
          bgcolor: theme === 'dark' ? 'grey.900' : 'grey.100',
          borderBottom: 1,
          borderColor: theme === 'dark' ? 'grey.800' : 'grey.300',
          WebkitAppRegion: 'drag'
        }}
      >
        <Toolbar variant="dense" sx={{ minHeight: 40, px: 2 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              minWidth: 0,
              pr: 1.5,
              borderRight: '1px solid rgba(255,255,255,0.08)'
            }}
          >
            <Box
              component="img"
              src={AppLogo}
              alt="PTools"
              sx={{
                width: 18,
                height: 18,
                objectFit: 'contain',
                opacity: 0.95,
                filter: 'drop-shadow(0 0 8px rgba(26,115,232,0.35))'
              }}
            />
            <Box sx={{ minWidth: 0 }}>
              <Typography
                sx={{
                  color: '#f5f8ff',
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: 0.35,
                  fontFamily: '"IBM Plex Mono", monospace',
                  lineHeight: 1.15,
                  whiteSpace: 'nowrap'
                }}
              >
                {appTitle}
              </Typography>
            </Box>
          </Box>

          <Box flex={1} />

          {/* RIGHT - User Profile & Window Controls */}
          <Box display="flex" alignItems="center" gap={1} sx={{ WebkitAppRegion: 'no-drag' }}>
            {/* Update button (optional) - shown when `showUpdateButton` is true */}
            {showUpdateButton && (
              <Button
                size="small"
                variant="outlined"
                startIcon={<UpdateIcon />}
                onClick={handleCheckUpdates}
                sx={{
                  color: 'white',
                  borderColor: 'rgba(255,255,255,0.18)',
                  minWidth: 36,
                  py: 0.5,
                  px: 1,
                  textTransform: 'none',
                  '&:hover': { borderColor: 'rgba(255,255,255,0.28)' }
                }}
              >
                Update
              </Button>
            )}
            {/* User Profile Button */}

            {/* Window Control Buttons */}
            <Box display="flex" alignItems="center" sx={{ ml: 1 }}>
              <IconButton
                size="small"
                onClick={handleMinimize}
                sx={{
                  borderRadius: 0,
                  width: 36,
                  height: 36,
                  p: 0,
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.12)'
                  }
                }}
                aria-label="Minimize"
              >
                <Minimize sx={{ color: 'white', fontSize: 18, mb: '12px' }} />
              </IconButton>
              <IconButton
                size="small"
                onClick={handleMaximize}
                sx={{
                  borderRadius: 0,
                  width: 36,
                  height: 36,
                  p: 0,
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.12)'
                  }
                }}
                aria-label="Maximize"
              >
                <CropSquare sx={{ color: 'white', fontSize: 18 }} />
              </IconButton>
              <IconButton
                size="small"
                onClick={handleCloseClick}
                sx={{
                  borderRadius: 0,
                  width: 36,
                  height: 36,
                  p: 0,
                  '&:hover': {
                    bgcolor: 'error.main'
                  }
                }}
                aria-label="Close"
              >
                <Close sx={{ color: 'white', fontSize: 18 }} />
              </IconButton>
            </Box>
          </Box>
        </Toolbar>
      </AppBar>

      <Dialog
        open={openCloseDialog}
        onClose={handleCloseCancel}
        PaperProps={{
          sx: {
            borderRadius: 3,
            minWidth: 420,
            bgcolor: '#151b26',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 24px 60px rgba(0,0,0,0.55)'
          }
        }}
      >
        <DialogTitle sx={{ pb: 2 }}>
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar
              sx={{
                bgcolor: 'rgba(255,152,0,0.22)',
                color: '#ffb74d',
                width: 48,
                height: 48
              }}
            >
              <Warning />
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight={700} sx={{ color: '#f0f4ff' }}>
                Close Application?
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(232,234,246,0.5)' }}>
                Are you sure you want to exit?
              </Typography>
            </Box>
          </Box>
        </DialogTitle>

        <DialogContent>
          <Typography variant="body2" sx={{ color: 'rgba(232,234,246,0.72)', lineHeight: 1.7 }}>
            All unsaved changes will be lost. Make sure you have saved your work before closing the
            application.
          </Typography>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button
            onClick={handleCloseCancel}
            variant="outlined"
            sx={{
              textTransform: 'none',
              borderColor: 'rgba(255,255,255,0.18)',
              color: '#dbe3f3',
              '&:hover': {
                borderColor: 'rgba(255,255,255,0.3)',
                bgcolor: 'rgba(255,255,255,0.06)'
              }
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCloseConfirm}
            variant="contained"
            color="error"
            sx={{
              textTransform: 'none',
              minWidth: 120,
              bgcolor: '#c53d34',
              '&:hover': { bgcolor: '#a83129' }
            }}
          >
            Close App
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openedProgress}
        onClose={() => setOpenedProgress(false)}
        PaperProps={{
          sx: {
            borderRadius: 3,
            minWidth: 340,
            p: 2
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box display="flex" alignItems="center" gap={2}>
            <UpdateIcon color="primary" />
            <Typography variant="h6" fontWeight={700}>
              Mengunduh Pembaruan...
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Update sedang diunduh...
          </Typography>
          <Box sx={{ width: '100%', mb: 1 }}>
            <LinearProgress variant="determinate" value={downloadProgress} />
          </Box>
          <Typography variant="caption" color="text.secondary">
            {downloadProgress.toFixed(1)}%
          </Typography>
        </DialogContent>
      </Dialog>
      <Dialog
        open={openDeviceDialog}
        onClose={() => setOpenDeviceDialog(false)}
        PaperProps={{
          sx: {
            borderRadius: 3,
            minWidth: 520,
            maxWidth: 720,
            width: '90vw',
            maxHeight: '82vh',
            bgcolor: '#151b26',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 24px 60px rgba(0,0,0,0.55)'
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar
              sx={{
                bgcolor: 'rgba(66,165,245,0.22)',
                color: '#64b5f6',
                width: 48,
                height: 48
              }}
            >
              <Settings />
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight={700} sx={{ color: '#f0f4ff' }}>
                Informasi Perangkat
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(232,234,246,0.5)' }}>
                Detail identifikasi perangkat ini
              </Typography>
            </Box>
          </Box>
        </DialogTitle>

        <DialogContent
          sx={{
            '&::-webkit-scrollbar': { width: 8 },
            '&::-webkit-scrollbar-thumb': {
              borderRadius: 99,
              bgcolor: 'rgba(255,255,255,0.16)'
            }
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <Box>
              <Typography
                variant="caption"
                sx={{ color: 'rgba(232,234,246,0.45)', fontWeight: 700, letterSpacing: 0.8 }}
              >
                DEVICE ID
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  mt: 0.5,
                  p: 1.5,
                  bgcolor: 'rgba(255,255,255,0.05)',
                  borderRadius: 2,
                  fontFamily: 'monospace',
                  color: '#dde5f5',
                  border: '1px solid rgba(255,255,255,0.08)',
                  wordBreak: 'break-all'
                }}
              >
                {deviceId || '-'}
              </Typography>
            </Box>
            <Box>
              <Typography
                variant="caption"
                sx={{ color: 'rgba(232,234,246,0.45)', fontWeight: 700, letterSpacing: 0.8 }}
              >
                DEVICE NAME
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  mt: 0.5,
                  p: 1.5,
                  bgcolor: 'rgba(255,255,255,0.05)',
                  borderRadius: 2,
                  fontFamily: 'monospace',
                  color: '#dde5f5',
                  border: '1px solid rgba(255,255,255,0.08)'
                }}
              >
                {deviceName || '-'}
              </Typography>
            </Box>
            <Box>
              <Typography
                variant="caption"
                sx={{ color: 'rgba(232,234,246,0.45)', fontWeight: 700, letterSpacing: 0.8 }}
              >
                DEVICE BRAND
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  mt: 0.5,
                  p: 1.5,
                  bgcolor: 'rgba(255,255,255,0.05)',
                  borderRadius: 2,
                  fontFamily: 'monospace',
                  color: '#dde5f5',
                  border: '1px solid rgba(255,255,255,0.08)'
                }}
              >
                {deviceBrand || '-'}
              </Typography>
            </Box>
            <Box>
              <Typography
                variant="caption"
                sx={{ color: 'rgba(232,234,246,0.45)', fontWeight: 700, letterSpacing: 0.8 }}
              >
                IP ADDRESS
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  mt: 0.5,
                  p: 1.5,
                  bgcolor: 'rgba(255,255,255,0.05)',
                  borderRadius: 2,
                  fontFamily: 'monospace',
                  color: '#dde5f5',
                  border: '1px solid rgba(255,255,255,0.08)'
                }}
              >
                {deviceInfo?.ipAddress || '-'}
              </Typography>
            </Box>
            <Box>
              <Typography
                variant="caption"
                sx={{ color: 'rgba(232,234,246,0.45)', fontWeight: 700, letterSpacing: 0.8 }}
              >
                MAC ADDRESS
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  mt: 0.5,
                  p: 1.5,
                  bgcolor: 'rgba(255,255,255,0.05)',
                  borderRadius: 2,
                  fontFamily: 'monospace',
                  color: '#dde5f5',
                  border: '1px solid rgba(255,255,255,0.08)'
                }}
              >
                {deviceInfo?.macAddress || '-'}
              </Typography>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={() => setOpenDeviceDialog(false)}
            variant="contained"
            sx={{
              textTransform: 'none',
              bgcolor: '#1a73e8',
              minWidth: 84,
              '&:hover': { bgcolor: '#1557b0' }
            }}
          >
            Tutup
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={updateInfoOpen}
        autoHideDuration={3500}
        onClose={() => setUpdateInfoOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <MuiAlert
          elevation={6}
          variant="filled"
          onClose={() => setUpdateInfoOpen(false)}
          severity={updateInfoSeverity}
        >
          {updateInfoMsg}
        </MuiAlert>
      </Snackbar>
    </>
  )
}
