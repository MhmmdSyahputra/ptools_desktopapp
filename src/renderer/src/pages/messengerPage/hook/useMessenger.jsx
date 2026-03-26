import { useState, useEffect, useCallback, useRef } from 'react'
import { useNotifier } from '@renderer/components/core/notificationProvider'
import { useSetSidebarBadge } from '@renderer/context/sidebarBadge'

/**
 * Hook utama untuk Messenger:
 * - List peers online (discovery)
 * - Buka/tutup room chat
 * - Kirim & terima pesan
 * - Badge notif pesan belum dibaca
 */
export function UseMessenger() {
  const notifier = useNotifier()
  const setSidebarBadge = useSetSidebarBadge()
  const [peers, setPeers] = useState([])
  const [myInfo, setMyInfo] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  // Room yang sedang aktif: null | peerInfo
  const [activeRoom, setActiveRoom] = useState(null)

  // Map<peerIp, Message[]>
  const [chatMessages, setChatMessages] = useState({})

  // Map<peerIp, number> — jumlah pesan belum dibaca
  const [unreadCounts, setUnreadCounts] = useState({})

  const activeRoomRef = useRef(null)
  const notifierRef = useRef(notifier)
  const knownPeersRef = useRef(new Set())
  const hasPeerSnapshotRef = useRef(false)
  activeRoomRef.current = activeRoom
  notifierRef.current = notifier

  // Reset sidebar badge saat Messenger dibuka
  useEffect(() => {
    if (setSidebarBadge) setSidebarBadge((prev) => ({ ...prev, messenger: 0 }))
  }, [setSidebarBadge])

  // ─── Load peers awal ───────────────────────────────────────────────────────
  const refresh = useCallback(async () => {
    try {
      const [currentPeers, info] = await Promise.all([
        window.api.discovery.getPeers(),
        window.api.discovery.getMyInfo()
      ])
      setPeers(currentPeers)
      setMyInfo(info)
    } catch (err) {
      console.error('[UseMessenger] refresh error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()

    const cleanupPeers = window.api.discovery.onPeersUpdated((updatedPeers) => {
      const nextPeerIps = new Set(updatedPeers.map((peer) => peer.ip))

      // Notify only for peers that appear after the first snapshot (avoid noise at startup).
      if (hasPeerSnapshotRef.current) {
        updatedPeers.forEach((peer) => {
          const isNewOnlinePeer = !knownPeersRef.current.has(peer.ip)
          if (!isNewOnlinePeer) return

          notifierRef.current.show({
            message: 'Device online',
            description: `${peer.username} (${peer.ip}) telah online`,
            severity: 'info'
          })

          window.api.windowNotification.show({
            title: 'PTools Messenger',
            body: `${peer.username} (${peer.ip}) is now online`,
            silent: false
          })
        })
      }

      knownPeersRef.current = nextPeerIps
      hasPeerSnapshotRef.current = true
      setPeers(updatedPeers)
    })

    // ─── Terima pesan masuk ────────────────────────────────────────────────
    const cleanupChat = window.api.chat.onMessageReceived((msg) => {
      const peerIp = msg.fromIp
      const senderLabel = msg.from || msg.username || peerIp

      notifierRef.current.show({
        message: 'Pesan baru',
        description: `${senderLabel}: ${msg.text || ''}`,
        severity: 'info'
      })

      window.api.windowNotification.show({
        title: `Pesan baru dari ${senderLabel}`,
        body: msg.text || '(pesan kosong)',
        silent: false
      })

      setChatMessages((prev) => ({
        ...prev,
        [peerIp]: [...(prev[peerIp] || []), msg]
      }))

      // Tambah unread jika bukan room yang aktif
      if (activeRoomRef.current?.ip !== peerIp) {
        setUnreadCounts((prev) => ({
          ...prev,
          [peerIp]: (prev[peerIp] || 0) + 1
        }))
      }
    })

    return () => {
      cleanupPeers()
      cleanupChat()
    }
  }, [refresh])

  // ─── Buka room chat ────────────────────────────────────────────────────────
  const openRoom = useCallback(async (peer) => {
    setActiveRoom(peer)
    // Reset unread
    setUnreadCounts((prev) => ({ ...prev, [peer.ip]: 0 }))
    // Load history dari main process jika belum ada
    setChatMessages((prev) => {
      if (prev[peer.ip]) return prev // sudah ada, skip
      return prev // akan di-load di bawah
    })
    try {
      const history = await window.api.chat.getHistory(peer.ip)
      setChatMessages((prev) => ({
        ...prev,
        [peer.ip]: history
      }))
    } catch (err) {
      console.error('[UseMessenger] getHistory error:', err)
    }
  }, [])

  const closeRoom = useCallback(() => {
    setActiveRoom(null)
  }, [])

  // ─── Kirim pesan ──────────────────────────────────────────────────────────
  const sendMessage = useCallback(async (targetIp, text) => {
    if (!text.trim()) return { success: false }
    const result = await window.api.chat.sendMessage(targetIp, text.trim())
    if (result.success) {
      setChatMessages((prev) => ({
        ...prev,
        [targetIp]: [...(prev[targetIp] || []), result.message]
      }))
    }
    return result
  }, [])

  const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0)

  return {
    peers,
    myInfo,
    isLoading,
    refresh,
    activeRoom,
    openRoom,
    closeRoom,
    chatMessages,
    sendMessage,
    unreadCounts,
    totalUnread
  }
}
