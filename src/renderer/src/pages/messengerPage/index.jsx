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
  Chip
} from '@mui/material'
import { Message, Circle, Refresh, Computer, ArrowBack, Send } from '@mui/icons-material'
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
function MessageBubble({ msg }) {
  const isMine = msg.isMine

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
              lineHeight: 1.5
            }}
          >
            {msg.text}
          </Typography>
        </Box>
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
function ChatRoom({ peer, messages = [], onBack, onSend }) {
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
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

  return (
    <Stack
      sx={{
        minHeight: 'calc(100vh - 140px)',
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
      >
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
          <MessageBubble key={msg.id} msg={msg} />
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
          <TextField
            inputRef={inputRef}
            fullWidth
            multiline
            maxRows={4}
            placeholder={`Pesan ke ${peer.username}...`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
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
          Enter kirim • Shift+Enter baris baru
        </Typography>
      </Box>
    </Stack>
  )
}

// ─── User List (sidebar/main view) ────────────────────────────────────────────
function UserList({ peers, myInfo, isLoading, refresh, unreadCounts, onSelectPeer }) {
  const totalOnline = peers.length + (myInfo ? 1 : 0)

  return (
    <Stack sx={{ minHeight: 'calc(100vh - 140px)' }}>
      {/* Header */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        px={2}
        pt={2}
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
    unreadCounts
  } = UseMessenger()

  return (
    <Box
      sx={{
        minHeight: 'calc(100vh - 40px)',
        bgcolor: '#0f1117',
        backgroundImage: `
          radial-gradient(ellipse at 15% 15%, ${alpha('#1a73e8', 0.07)} 0%, transparent 50%),
          radial-gradient(ellipse at 85% 85%, ${alpha('#9c27b0', 0.04)} 0%, transparent 50%)
        `,
        px: { xs: 2, sm: 3, md: 4 },
        py: { xs: 2, sm: 3, md: 3.5 },
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
          maxWidth: 920,
          mx: 'auto'
        }}
      >
        {activeRoom ? (
          <ChatRoom
            peer={activeRoom}
            messages={chatMessages[activeRoom.ip] || []}
            myInfo={myInfo}
            onBack={closeRoom}
            onSend={sendMessage}
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
