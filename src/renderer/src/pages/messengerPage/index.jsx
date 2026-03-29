/* eslint-disable react/prop-types */
import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Box,
  Stack,
  Typography,
  alpha,
  CircularProgress,
  Tooltip,
  IconButton,
  TextField,
  Chip,
  Button
} from '@mui/material'
import {
  Message,
  Circle,
  Refresh,
  Computer,
  ArrowBack,
  Send,
  AttachFile,
  Description,
  CloseRounded,
  CheckRounded
} from '@mui/icons-material'
import { UseMessenger } from './hook/useMessenger'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getPlatformLabel(platform) {
  if (platform === 'win32') return 'Windows'
  if (platform === 'darwin') return 'macOS'
  if (platform === 'linux') return 'Linux'
  return platform || '—'
}

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}

function formatFileSize(size) {
  if (!size) return '0 B'
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

// ─── Avatar inisial ────────────────────────────────────────────────────────────
function Avatar({ name, size = 36, isMe = false }) {
  const initial = (name || '?')[0].toUpperCase()
  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: '50%',
        bgcolor: isMe ? alpha('#1a73e8', 0.3) : alpha('#9c27b0', 0.28),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        fontFamily: '"IBM Plex Mono", monospace',
        fontSize: size * 0.38,
        fontWeight: 700,
        color: isMe ? '#90caf9' : '#ce93d8',
        userSelect: 'none',
        border: `1px solid ${isMe ? alpha('#90caf9', 0.3) : alpha('#ce93d8', 0.22)}`,
        boxShadow: `0 8px 20px ${alpha('#02040a', 0.35)}`
      }}
    >
      {initial}
    </Box>
  )
}

// ─── Kartu user di sidebar ─────────────────────────────────────────────────────
function UserCard({ user, isMe = false, unread = 0, onClick }) {
  return (
    <Stack
      direction="row"
      alignItems="center"
      gap={1.4}
      onClick={!isMe ? onClick : undefined}
      sx={{
        px: 1.8,
        py: 1.4,
        borderRadius: '10px',
        bgcolor: isMe ? alpha('#1a73e8', 0.07) : alpha('#ffffff', 0.03),
        border: `1px solid ${isMe ? alpha('#1a73e8', 0.22) : alpha('#ffffff', 0.07)}`,
        backdropFilter: 'blur(8px)',
        boxShadow: `inset 0 1px 0 ${alpha('#ffffff', 0.04)}`,
        transition: 'all 0.15s ease',
        cursor: isMe ? 'default' : 'pointer',
        '&:hover': !isMe
          ? {
              bgcolor: alpha('#ffffff', 0.08),
              borderColor: alpha('#1a73e8', 0.24),
              transform: 'translateY(-1px)'
            }
          : {}
      }}
    >
      <Avatar name={user.username} isMe={isMe} />

      <Box flex={1} minWidth={0}>
        <Stack direction="row" alignItems="center" gap={0.7}>
          <Typography
            sx={{
              fontFamily: '"IBM Plex Mono", monospace',
              fontSize: 13,
              fontWeight: 600,
              color: isMe ? '#90caf9' : '#e8eaf6',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {user.username}
          </Typography>
          {isMe && (
            <Chip
              label="kamu"
              size="small"
              sx={{
                height: 15,
                fontSize: 9,
                fontFamily: '"IBM Plex Mono", monospace',
                bgcolor: alpha('#1a73e8', 0.2),
                color: '#90caf9',
                '& .MuiChip-label': { px: 0.7 }
              }}
            />
          )}
        </Stack>
        <Stack direction="row" alignItems="center" gap={0.8} mt={0.2}>
          <Computer sx={{ fontSize: 10, color: alpha('#e8eaf6', 0.3) }} />
          <Typography
            sx={{
              fontFamily: '"IBM Plex Mono", monospace',
              fontSize: 10,
              color: alpha('#e8eaf6', 0.35),
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {user.ip} • {getPlatformLabel(user.platform)}
          </Typography>
        </Stack>
      </Box>

      <Stack alignItems="flex-end" gap={0.6} flexShrink={0}>
        <Stack direction="row" alignItems="center" gap={0.5}>
          <Circle sx={{ fontSize: 7, color: '#4caf50' }} />
          <Typography
            sx={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 10, color: '#4caf50' }}
          >
            online
          </Typography>
        </Stack>
        {!isMe && unread > 0 && (
          <Box
            sx={{
              bgcolor: '#1a73e8',
              borderRadius: '10px',
              minWidth: 18,
              height: 18,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              px: 0.6
            }}
          >
            <Typography
              sx={{
                fontFamily: '"IBM Plex Mono", monospace',
                fontSize: 10,
                color: '#fff',
                fontWeight: 700
              }}
            >
              {unread > 99 ? '99+' : unread}
            </Typography>
          </Box>
        )}
      </Stack>
    </Stack>
  )
}

// ─── Bubble pesan ──────────────────────────────────────────────────────────────
function MessageBubble({ msg, onAcceptFile, onRejectFile }) {
  const isMine = msg.isMine
  const isFileOffer = msg.type === 'file-offer'

  const canAccept = !isMine && msg.fileStatus === 'waiting'

  const statusLabelMap = {
    waiting: 'Menunggu persetujuan',
    accepting: 'Menyiapkan download...',
    sending: 'Mengirim file...',
    sent: 'Menunggu konfirmasi download',
    downloaded: isMine ? 'Sudah diunduh penerima' : 'Download selesai',
    rejected: 'Ditolak',
    failed: 'Gagal'
  }

  const statusLabel = statusLabelMap[msg.fileStatus] || 'Proses file'

  return (
    <Stack
      direction={isMine ? 'row-reverse' : 'row'}
      alignItems="flex-end"
      gap={1}
      sx={{
        maxWidth: { xs: '90%', sm: '82%' },
        alignSelf: isMine ? 'flex-end' : 'flex-start'
      }}
    >
      {!isMine && <Avatar name={msg.from} size={28} />}

      <Box>
        {!isMine && (
          <Typography
            sx={{
              fontFamily: '"IBM Plex Mono", monospace',
              fontSize: 10,
              color: alpha('#e8eaf6', 0.45),
              mb: 0.4,
              ml: 0.5
            }}
          >
            {msg.from}
          </Typography>
        )}
        {isFileOffer ? (
          <Box
            sx={{
              px: 1.4,
              py: 1.2,
              borderRadius: isMine ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
              bgcolor: isMine ? alpha('#1a73e8', 0.24) : alpha('#ffffff', 0.07),
              border: `1px solid ${isMine ? alpha('#1a73e8', 0.35) : alpha('#ffffff', 0.1)}`,
              maxWidth: { xs: 300, sm: 380 },
              boxShadow: `0 8px 20px ${alpha('#02040a', 0.24)}`
            }}
          >
            <Stack direction="row" alignItems="flex-start" gap={1.1}>
              <Description sx={{ fontSize: 17, color: isMine ? '#90caf9' : '#81d4fa', mt: 0.1 }} />
              <Box flex={1} minWidth={0}>
                <Typography
                  sx={{
                    fontFamily: '"IBM Plex Mono", monospace',
                    fontSize: 12.5,
                    color: '#e8eaf6',
                    fontWeight: 600,
                    wordBreak: 'break-word'
                  }}
                >
                  {msg.fileName}
                </Typography>
                <Typography
                  sx={{
                    fontFamily: '"IBM Plex Mono", monospace',
                    fontSize: 10,
                    color: alpha('#e8eaf6', 0.5),
                    mt: 0.4
                  }}
                >
                  {formatFileSize(msg.fileSize)} • {statusLabel}
                </Typography>
                {msg.localPath && !isMine && (
                  <Typography
                    sx={{
                      fontFamily: '"IBM Plex Mono", monospace',
                      fontSize: 10,
                      color: alpha('#8bc34a', 0.9),
                      mt: 0.45,
                      wordBreak: 'break-all'
                    }}
                  >
                    Tersimpan: {msg.localPath}
                  </Typography>
                )}
                {msg.error && (
                  <Typography
                    sx={{
                      fontFamily: '"IBM Plex Mono", monospace',
                      fontSize: 10,
                      color: '#ef9a9a',
                      mt: 0.45
                    }}
                  >
                    {msg.error}
                  </Typography>
                )}
              </Box>
            </Stack>

            {canAccept && (
              <Stack direction="row" gap={0.8} mt={1.1}>
                <Button
                  size="small"
                  startIcon={<CheckRounded sx={{ fontSize: 14 }} />}
                  onClick={() => onAcceptFile(msg)}
                  sx={{
                    textTransform: 'none',
                    fontSize: 11,
                    minWidth: 0,
                    borderRadius: 1.5,
                    bgcolor: alpha('#4caf50', 0.15),
                    color: '#a5d6a7',
                    border: `1px solid ${alpha('#4caf50', 0.28)}`,
                    '&:hover': { bgcolor: alpha('#4caf50', 0.22) }
                  }}
                >
                  Accept
                </Button>
                <Button
                  size="small"
                  startIcon={<CloseRounded sx={{ fontSize: 14 }} />}
                  onClick={() => onRejectFile(msg)}
                  sx={{
                    textTransform: 'none',
                    fontSize: 11,
                    minWidth: 0,
                    borderRadius: 1.5,
                    bgcolor: alpha('#f44336', 0.12),
                    color: '#ef9a9a',
                    border: `1px solid ${alpha('#f44336', 0.22)}`,
                    '&:hover': { bgcolor: alpha('#f44336', 0.2) }
                  }}
                >
                  Reject
                </Button>
              </Stack>
            )}
          </Box>
        ) : (
          <Box
            sx={{
              px: 1.6,
              py: 1,
              borderRadius: isMine ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
              bgcolor: isMine ? '#1a73e8' : alpha('#ffffff', 0.07),
              border: `1px solid ${isMine ? 'transparent' : alpha('#ffffff', 0.1)}`,
              maxWidth: { xs: 280, sm: 360 },
              boxShadow: isMine
                ? `0 10px 24px ${alpha('#1a73e8', 0.24)}`
                : `0 8px 20px ${alpha('#02040a', 0.28)}`
            }}
          >
            <Typography
              sx={{
                fontFamily: '"IBM Plex Mono", monospace',
                fontSize: 13,
                color: isMine ? '#ffffff' : '#e8eaf6',
                wordBreak: 'break-word',
                whiteSpace: 'pre-wrap',
                lineHeight: 1.5
              }}
            >
              {msg.text}
            </Typography>
          </Box>
        )}
        <Typography
          sx={{
            fontFamily: '"IBM Plex Mono", monospace',
            fontSize: 10,
            color: alpha('#e8eaf6', 0.3),
            mt: 0.4,
            textAlign: isMine ? 'right' : 'left',
            mx: 0.5
          }}
        >
          {formatTime(msg.timestamp)}
        </Typography>
      </Box>
    </Stack>
  )
}

// ─── Room Chat ─────────────────────────────────────────────────────────────────
function ChatRoom({ peer, messages = [], onBack, onSend, onSendFile, onAcceptFile, onRejectFile }) {
  const MAX_MESSAGE_CHARS = 4000
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  // Auto scroll ke bawah setiap ada pesan baru
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input saat room dibuka
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSend = useCallback(async () => {
    if (!text.trim() || sending) return
    if (text.length > MAX_MESSAGE_CHARS) {
      setError(`Pesan terlalu panjang (maks ${MAX_MESSAGE_CHARS} karakter)`)
      return
    }
    setSending(true)
    setError('')
    const result = await onSend(peer.ip, text)
    if (!result.success) {
      setError(result.error || 'Gagal mengirim pesan')
    }
    setText('')
    setSending(false)
    inputRef.current?.focus()
  }, [text, sending, peer.ip, onSend])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSendFiles = useCallback(
    async (files) => {
      const list = Array.from(files || [])
      if (!list.length) return

      setError('')
      for (const file of list) {
        const filePath = file.path || file.filePath
        const fileName = file.name || 'file'
        const fileSize = Number(file.size || 0)
        const mimeType = file.type || 'application/octet-stream'

        if (!filePath) {
          setError('File path tidak ditemukan. Gunakan tombol attach untuk memilih file.')
          continue
        }

        const result = await onSendFile(peer.ip, {
          filePath,
          fileName,
          fileSize,
          mimeType
        })

        if (!result.success) {
          setError(result.error || `Gagal mengirim file ${fileName}`)
        }
      }
    },
    [onSendFile, peer.ip]
  )

  const handleAttachClick = useCallback(async () => {
    setError('')
    const result = await window.api.chat.selectFiles()

    if (!result?.success) {
      setError(result?.error || 'Gagal membuka file picker')
      return
    }

    if (!result.files?.length) return
    await handleSendFiles(result.files)
  }, [handleSendFiles])

  const handleDrop = async (e) => {
    e.preventDefault()
    setDragOver(false)
    const files = e.dataTransfer?.files
    await handleSendFiles(files)
  }

  const handleAccept = async (msg) => {
    setError('')
    const result = await onAcceptFile(msg.fromIp, msg.id, msg.fileName)
    if (!result.success && !result.canceled) {
      setError(result.error || 'Gagal menerima file')
    }
  }

  const handleReject = async (msg) => {
    setError('')
    const result = await onRejectFile(msg.fromIp, msg.id)
    if (!result.success) {
      setError(result.error || 'Gagal menolak file')
    }
  }

  return (
    <Stack
      sx={{
        height: '100%',
        minHeight: 0,
        border: `1px solid ${alpha('#ffffff', 0.08)}`,
        borderRadius: 3,
        bgcolor: alpha('#0d1420', 0.45),
        backdropFilter: 'blur(8px)',
        overflow: 'hidden'
      }}
    >
      {/* Header room */}
      <Stack
        direction="row"
        alignItems="center"
        gap={1.4}
        sx={{
          px: 2,
          py: 1.4,
          borderBottom: `1px solid ${alpha('#ffffff', 0.07)}`,
          flexShrink: 0,
          bgcolor: alpha('#0b1019', 0.55)
        }}
      >
        <IconButton
          onClick={onBack}
          size="small"
          sx={{
            color: alpha('#e8eaf6', 0.5),
            '&:hover': { color: '#e8eaf6', bgcolor: alpha('#ffffff', 0.07) }
          }}
        >
          <ArrowBack sx={{ fontSize: 18 }} />
        </IconButton>

        <Avatar name={peer.username} size={34} />

        <Box flex={1} minWidth={0}>
          <Typography
            sx={{
              fontFamily: '"IBM Plex Mono", monospace',
              fontSize: 13,
              fontWeight: 600,
              color: '#e8eaf6'
            }}
          >
            {peer.username}
          </Typography>
          <Stack direction="row" alignItems="center" gap={0.5}>
            <Circle sx={{ fontSize: 7, color: '#4caf50' }} />
            <Typography
              sx={{
                fontFamily: '"IBM Plex Mono", monospace',
                fontSize: 10,
                color: alpha('#e8eaf6', 0.4)
              }}
            >
              {peer.ip} • {getPlatformLabel(peer.platform)}
            </Typography>
          </Stack>
        </Box>
      </Stack>

      {/* Area pesan */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          px: 2,
          py: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 1.2,
          backgroundImage: `radial-gradient(circle at 50% 0%, ${alpha('#1a73e8', 0.08)} 0%, transparent 45%)`,
          '&::-webkit-scrollbar': { width: 4 },
          '&::-webkit-scrollbar-thumb': { bgcolor: alpha('#ffffff', 0.12), borderRadius: 2 }
        }}
        onDragOver={(e) => {
          e.preventDefault()
          if (!dragOver) setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        {dragOver && (
          <Box
            sx={{
              position: 'sticky',
              top: 0,
              zIndex: 5,
              mb: 1,
              py: 1,
              borderRadius: 2,
              border: `1px dashed ${alpha('#1a73e8', 0.7)}`,
              bgcolor: alpha('#1a73e8', 0.18),
              textAlign: 'center'
            }}
          >
            <Typography
              sx={{ fontSize: 11, color: '#90caf9', fontFamily: '"IBM Plex Mono", monospace' }}
            >
              Lepas file di sini untuk kirim ke {peer.username}
            </Typography>
          </Box>
        )}
        {messages.length === 0 && (
          <Stack alignItems="center" justifyContent="center" flex={1} gap={1} py={4}>
            <Message sx={{ fontSize: 32, color: alpha('#e8eaf6', 0.12) }} />
            <Typography
              sx={{
                fontFamily: '"IBM Plex Mono", monospace',
                fontSize: 12,
                color: alpha('#e8eaf6', 0.25)
              }}
            >
              Belum ada pesan — mulai percakapan!
            </Typography>
          </Stack>
        )}
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            msg={msg}
            onAcceptFile={handleAccept}
            onRejectFile={handleReject}
          />
        ))}
        <div ref={bottomRef} />
      </Box>

      {/* Error banner */}
      {error && (
        <Box
          sx={{
            mx: 2,
            mb: 1,
            px: 1.5,
            py: 0.8,
            bgcolor: alpha('#f44336', 0.12),
            borderRadius: '8px',
            border: `1px solid ${alpha('#f44336', 0.25)}`
          }}
        >
          <Typography
            sx={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 11, color: '#ef9a9a' }}
          >
            ⚠ {error}
          </Typography>
        </Box>
      )}

      {/* Input kirim pesan */}
      <Box sx={{ px: 2, pb: 2, pt: 1, flexShrink: 0 }}>
        <Stack direction="row" gap={1} alignItems="flex-end">
          <Tooltip title="Attach file">
            <IconButton
              onClick={handleAttachClick}
              sx={{
                width: 40,
                height: 40,
                bgcolor: alpha('#ffffff', 0.06),
                color: alpha('#e8eaf6', 0.75),
                borderRadius: '10px',
                border: `1px solid ${alpha('#ffffff', 0.08)}`,
                flexShrink: 0,
                '&:hover': { bgcolor: alpha('#ffffff', 0.1) }
              }}
            >
              <AttachFile sx={{ fontSize: 17 }} />
            </IconButton>
          </Tooltip>
          <TextField
            inputRef={inputRef}
            fullWidth
            multiline
            maxRows={4}
            placeholder={`Pesan ke ${peer.username}...`}
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, MAX_MESSAGE_CHARS))}
            onKeyDown={handleKeyDown}
            inputProps={{ maxLength: MAX_MESSAGE_CHARS }}
            variant="outlined"
            size="small"
            sx={{
              '& .MuiOutlinedInput-root': {
                fontFamily: '"IBM Plex Mono", monospace',
                fontSize: 13,
                color: '#e8eaf6',
                bgcolor: alpha('#0f1520', 0.85),
                borderRadius: '10px',
                '& fieldset': { borderColor: alpha('#ffffff', 0.12) },
                '&:hover fieldset': { borderColor: alpha('#ffffff', 0.22) },
                '&.Mui-focused fieldset': { borderColor: alpha('#1a73e8', 0.6) }
              },
              '& .MuiInputBase-input::placeholder': {
                color: alpha('#e8eaf6', 0.3),
                fontFamily: '"IBM Plex Mono", monospace'
              }
            }}
          />
          <IconButton
            onClick={handleSend}
            disabled={!text.trim() || sending}
            sx={{
              width: 40,
              height: 40,
              bgcolor: text.trim() ? '#1a73e8' : alpha('#ffffff', 0.05),
              color: text.trim() ? '#fff' : alpha('#e8eaf6', 0.3),
              borderRadius: '10px',
              border: `1px solid ${alpha('#ffffff', 0.08)}`,
              flexShrink: 0,
              transition: 'all 0.15s',
              '&:hover': { bgcolor: text.trim() ? '#1557b0' : alpha('#ffffff', 0.08) },
              '&.Mui-disabled': { bgcolor: alpha('#ffffff', 0.04), color: alpha('#e8eaf6', 0.2) }
            }}
          >
            {sending ? (
              <CircularProgress size={16} sx={{ color: alpha('#e8eaf6', 0.4) }} />
            ) : (
              <Send sx={{ fontSize: 17 }} />
            )}
          </IconButton>
        </Stack>
        <Typography
          sx={{
            fontFamily: '"IBM Plex Mono", monospace',
            fontSize: 10,
            color: alpha('#e8eaf6', 0.2),
            mt: 0.8,
            ml: 0.3
          }}
        >
          Enter kirim • Shift+Enter baris baru • Maks {MAX_MESSAGE_CHARS} karakter
        </Typography>
      </Box>
    </Stack>
  )
}

// ─── User List (sidebar/main view) ────────────────────────────────────────────
function UserList({ peers, myInfo, isLoading, refresh, unreadCounts, onSelectPeer }) {
  const totalOnline = peers.length + (myInfo ? 1 : 0)

  return (
    <Stack sx={{ height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        pt={1.5}
        pb={1}
        flexShrink={0}
      >
        <Stack direction="row" alignItems="center" gap={1.4}>
          <Message sx={{ color: '#1a73e8', fontSize: 24 }} />
          <Typography
            variant="h6"
            sx={{
              fontFamily: '"IBM Plex Mono", monospace',
              fontWeight: 700,
              color: '#e8eaf6',
              fontSize: 18,
              letterSpacing: '-0.4px'
            }}
          >
            Messenger
          </Typography>
        </Stack>
        <Tooltip title="Refresh" placement="left">
          <IconButton
            onClick={refresh}
            size="small"
            sx={{
              width: 30,
              height: 30,
              borderRadius: 1.5,
              color: alpha('#e8eaf6', 0.4),
              border: `1px solid ${alpha('#ffffff', 0.09)}`,
              '&:hover': { color: '#e8eaf6', bgcolor: alpha('#ffffff', 0.06) }
            }}
          >
            <Refresh
              sx={{ fontSize: 16, animation: isLoading ? 'spin 0.8s linear infinite' : 'none' }}
            />
          </IconButton>
        </Tooltip>
      </Stack>

      <Typography
        sx={{
          fontFamily: '"IBM Plex Mono", monospace',
          fontSize: 11,
          color: alpha('#e8eaf6', 0.28),
          mb: 0.5,
          pb: 2
        }}
      >
        Pengguna aktif dalam jaringan lokal yang sama
      </Typography>

      <Box
        sx={{
          flex: 1,
          mb: 2.2,
          bgcolor: alpha('#0d1420', 0.45),
          border: `1px solid ${alpha('#ffffff', 0.08)}`,
          borderRadius: '14px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          backdropFilter: 'blur(8px)'
        }}
      >
        {/* Sub-header */}
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{
            px: 2,
            py: 1.2,
            borderBottom: `1px solid ${alpha('#ffffff', 0.06)}`,
            flexShrink: 0
          }}
        >
          <Typography
            sx={{
              fontFamily: '"IBM Plex Mono", monospace',
              fontSize: 10,
              fontWeight: 600,
              color: alpha('#e8eaf6', 0.4),
              textTransform: 'uppercase',
              letterSpacing: '0.08em'
            }}
          >
            Pengguna Online
          </Typography>
          <Stack direction="row" alignItems="center" gap={0.6}>
            <Circle sx={{ fontSize: 7, color: '#4caf50' }} />
            <Typography
              sx={{
                fontFamily: '"IBM Plex Mono", monospace',
                fontSize: 11,
                color: alpha('#e8eaf6', 0.4)
              }}
            >
              {isLoading ? '...' : `${totalOnline} aktif`}
            </Typography>
          </Stack>
        </Stack>

        {/* List */}
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            p: 1.2,
            backgroundImage: `linear-gradient(180deg, ${alpha('#1a73e8', 0.05)} 0%, transparent 28%)`,
            '&::-webkit-scrollbar': { width: 4 },
            '&::-webkit-scrollbar-thumb': { bgcolor: alpha('#ffffff', 0.1), borderRadius: 2 }
          }}
        >
          {isLoading ? (
            <Stack alignItems="center" py={4} gap={1.5}>
              <CircularProgress size={20} sx={{ color: alpha('#1a73e8', 0.6) }} />
              <Typography
                sx={{
                  fontFamily: '"IBM Plex Mono", monospace',
                  fontSize: 12,
                  color: alpha('#e8eaf6', 0.3)
                }}
              >
                Mencari pengguna...
              </Typography>
            </Stack>
          ) : (
            <Stack gap={0.8}>
              {myInfo && <UserCard user={myInfo} isMe />}
              {peers.length === 0 ? (
                <Stack alignItems="center" py={4} gap={0.8}>
                  <Typography
                    sx={{
                      fontFamily: '"IBM Plex Mono", monospace',
                      fontSize: 12,
                      color: alpha('#e8eaf6', 0.25)
                    }}
                  >
                    Belum ada pengguna lain
                  </Typography>
                  <Typography
                    sx={{
                      fontFamily: '"IBM Plex Mono", monospace',
                      fontSize: 11,
                      color: alpha('#e8eaf6', 0.15)
                    }}
                  >
                    Mereka muncul otomatis saat buka app ini
                  </Typography>
                </Stack>
              ) : (
                peers.map((peer) => (
                  <UserCard
                    key={peer.ip}
                    user={peer}
                    unread={unreadCounts[peer.ip] || 0}
                    onClick={() => onSelectPeer(peer)}
                  />
                ))
              )}
            </Stack>
          )}
        </Box>
      </Box>

      <Typography
        sx={{
          fontFamily: '"IBM Plex Mono", monospace',
          fontSize: 10,
          color: alpha('#e8eaf6', 0.16),
          textAlign: 'center',
          pb: 1.5,
          mt: 'auto'
        }}
      >
        UDP discovery • TCP chat • port 45678/45679
      </Typography>
    </Stack>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export const MessengerPage = () => {
  const {
    peers,
    myInfo,
    isLoading,
    refresh,
    activeRoom,
    openRoom,
    closeRoom,
    chatMessages,
    sendMessage,
    sendFileOffer,
    acceptFileOffer,
    rejectFileOffer,
    unreadCounts
  } = UseMessenger()

  return (
    <Box
      sx={{
        height: 'calc(100vh - 40px)',
        overflow: 'hidden',
        bgcolor: '#0f1117',
        backgroundImage: `
          radial-gradient(ellipse at 15% 15%, ${alpha('#1a73e8', 0.07)} 0%, transparent 50%),
          radial-gradient(ellipse at 85% 85%, ${alpha('#9c27b0', 0.04)} 0%, transparent 50%)
        `,
        px: { xs: 2, sm: 3.5, md: 4 },
        pt: { xs: 2, sm: 3, md: 3 },
        pb: 0,
        display: 'flex',
        flexDirection: 'column',
        // Keyframe spin untuk tombol refresh
        '@keyframes spin': {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' }
        }
      }}
    >
      <Box
        sx={{
          width: '100%',
          maxWidth: 1200,
          mx: 'auto',
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {activeRoom ? (
          <ChatRoom
            peer={activeRoom}
            messages={chatMessages[activeRoom.ip] || []}
            myInfo={myInfo}
            onBack={closeRoom}
            onSend={sendMessage}
            onSendFile={sendFileOffer}
            onAcceptFile={acceptFileOffer}
            onRejectFile={rejectFileOffer}
          />
        ) : (
          <UserList
            peers={peers}
            myInfo={myInfo}
            isLoading={isLoading}
            refresh={refresh}
            unreadCounts={unreadCounts}
            onSelectPeer={openRoom}
          />
        )}
      </Box>
    </Box>
  )
}
