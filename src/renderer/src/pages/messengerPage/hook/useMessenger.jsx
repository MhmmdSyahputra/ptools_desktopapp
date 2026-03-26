import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * Hook utama untuk Messenger:
 * - List peers online (discovery)
 * - Buka/tutup room chat
 * - Kirim & terima pesan
 * - Badge notif pesan belum dibaca
 */
export function UseMessenger() {
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
  activeRoomRef.current = activeRoom

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
      setPeers(updatedPeers)
    })

    // ─── Terima pesan masuk ────────────────────────────────────────────────
    const cleanupChat = window.api.chat.onMessageReceived((msg) => {
      const peerIp = msg.fromIp

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
