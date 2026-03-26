import dgram from 'dgram'
import net from 'net'
import os from 'os'
import { ipcMain, Notification } from 'electron'
import { mainWindow } from '../window.js'

// ─── Konstanta ────────────────────────────────────────────────────────────────
const BROADCAST_PORT = 45678
const CHAT_PORT = 45679
const BROADCAST_INTERVAL = 3000
const PEER_TIMEOUT = 10000
const APP_ID = 'ptools-electron-app'

// ─── State ────────────────────────────────────────────────────────────────────
let udpSocket = null
let tcpServer = null
let broadcastTimer = null
let cleanupTimer = null
let peers = new Map()
let myInfo = null
// Map<peerIp, Message[]>
let chatHistory = new Map()

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getMyIPs() {
  const ips = new Set()
  for (const iface of Object.values(os.networkInterfaces())) {
    for (const cfg of iface) {
      if (cfg.family === 'IPv4' && !cfg.internal) ips.add(cfg.address)
    }
  }
  return ips
}

function getMyInfo() {
  if (myInfo) return myInfo
  let ipAddress = ''
  for (const iface of Object.values(os.networkInterfaces())) {
    for (const cfg of iface) {
      if (!cfg.internal && cfg.family === 'IPv4') {
        ipAddress = cfg.address
        break
      }
    }
    if (ipAddress) break
  }
  myInfo = {
    username: os.userInfo().username,
    hostname: os.hostname(),
    ip: ipAddress,
    platform: os.platform()
  }
  return myInfo
}

function getPeerList() {
  return Array.from(peers.values()).map(({ username, hostname, ip, platform, lastSeen }) => ({
    username,
    hostname,
    ip,
    platform,
    lastSeen
  }))
}

function notifyRenderer(channel, payload) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, payload)
  }
}

function addToHistory(peerIp, msg) {
  if (!chatHistory.has(peerIp)) chatHistory.set(peerIp, [])
  chatHistory.get(peerIp).push(msg)
}

// ─── UDP Broadcast ─────────────────────────────────────────────────────────────

function broadcastPresence() {
  if (!udpSocket) return
  const info = getMyInfo()
  const message = Buffer.from(
    JSON.stringify({
      appId: APP_ID,
      username: info.username,
      hostname: info.hostname,
      ip: info.ip,
      platform: info.platform
    })
  )
  udpSocket.send(message, 0, message.length, BROADCAST_PORT, '255.255.255.255', (err) => {
    if (err) console.error('[Discovery] Broadcast error:', err.message)
  })
}

function startUDP() {
  udpSocket = dgram.createSocket({ type: 'udp4', reuseAddr: true })

  udpSocket.on('error', (err) => {
    console.error('[Discovery] UDP error:', err.message)
    udpSocket = null
  })

  udpSocket.on('message', (msg, rinfo) => {
    try {
      const data = JSON.parse(msg.toString())
      if (data.appId !== APP_ID) return
      if (getMyIPs().has(rinfo.address)) return

      const ip = rinfo.address
      const isNew = !peers.has(ip)

      peers.set(ip, {
        username: data.username || 'Unknown',
        hostname: data.hostname || ip,
        ip,
        platform: data.platform || '',
        lastSeen: Date.now()
      })

      if (isNew) {
        console.log(`[Discovery] Peer joined: ${data.username} (${ip})`)
        notifyRenderer('discovery:peers-updated', getPeerList())
      } else {
        peers.get(ip).lastSeen = Date.now()
      }
    } catch {
      /* ignore */
    }
  })

  udpSocket.bind(BROADCAST_PORT, () => {
    udpSocket.setBroadcast(true)
    console.log(`[Discovery] UDP listening on port ${BROADCAST_PORT}`)
    broadcastPresence()
    broadcastTimer = setInterval(broadcastPresence, BROADCAST_INTERVAL)
    cleanupTimer = setInterval(() => {
      const now = Date.now()
      let changed = false
      for (const [ip, peer] of peers) {
        if (now - peer.lastSeen > PEER_TIMEOUT) {
          console.log(`[Discovery] Peer left: ${peer.username} (${ip})`)
          peers.delete(ip)
          changed = true
        }
      }
      if (changed) notifyRenderer('discovery:peers-updated', getPeerList())
    }, 2000)
  })
}

// ─── TCP Server (terima pesan masuk) ──────────────────────────────────────────

function startTCPServer() {
  tcpServer = net.createServer((socket) => {
    let buffer = ''

    socket.on('data', (chunk) => {
      buffer += chunk.toString()
      const lines = buffer.split('\n')
      buffer = lines.pop() // sisa belum lengkap

      for (const line of lines) {
        if (!line.trim()) continue
        try {
          const msg = JSON.parse(line)
          if (msg.appId !== APP_ID) continue

          const peerIp = (socket.remoteAddress || '').replace('::ffff:', '')

          const incoming = {
            id: msg.id || `${Date.now()}-${Math.random()}`,
            from: msg.from,
            fromIp: peerIp,
            text: msg.text,
            timestamp: msg.timestamp || Date.now(),
            isMine: false
          }

          addToHistory(peerIp, incoming)
          notifyRenderer('chat:message-received', incoming)

          // Notifikasi sistem jika window tidak fokus
          if (mainWindow && !mainWindow.isFocused()) {
            new Notification({
              title: `💬 ${msg.from}`,
              body: msg.text.length > 100 ? msg.text.slice(0, 100) + '...' : msg.text,
              silent: false
            }).show()
          }

          console.log(`[Chat] ← ${msg.from} (${peerIp}): ${msg.text}`)
        } catch (e) {
          console.error('[Chat] Parse error:', e.message)
        }
      }
    })

    socket.on('error', () => {
      /* ignore disconnect errors */
    })
  })

  tcpServer.listen(CHAT_PORT, '0.0.0.0', () => {
    console.log(`[Chat] TCP server listening on port ${CHAT_PORT}`)
  })

  tcpServer.on('error', (err) => {
    console.error('[Chat] TCP server error:', err.message)
  })
}

// ─── Kirim pesan ke peer via TCP ──────────────────────────────────────────────

function sendMessageToPeer(targetIp, text) {
  return new Promise((resolve, reject) => {
    const me = getMyInfo()
    const msg = {
      appId: APP_ID,
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      from: me.username,
      fromIp: me.ip,
      text,
      timestamp: Date.now()
    }

    const client = new net.Socket()

    const timeout = setTimeout(() => {
      client.destroy()
      reject(new Error('Connection timeout — pastikan peer masih online'))
    }, 5000)

    client.connect(CHAT_PORT, targetIp, () => {
      client.write(JSON.stringify(msg) + '\n')
      clearTimeout(timeout)
      client.end()

      const outgoing = { ...msg, isMine: true, fromIp: targetIp }
      addToHistory(targetIp, outgoing)
      resolve(outgoing)

      console.log(`[Chat] → ${me.username} → ${targetIp}: ${text}`)
    })

    client.on('error', (err) => {
      clearTimeout(timeout)
      reject(err)
    })
  })
}

// ─── Start / Stop ─────────────────────────────────────────────────────────────

export function startDiscovery() {
  startUDP()
  startTCPServer()
}

export function stopDiscovery() {
  clearInterval(broadcastTimer)
  clearInterval(cleanupTimer)
  broadcastTimer = null
  cleanupTimer = null
  peers.clear()
  if (udpSocket) {
    try {
      udpSocket.close()
    } catch {
      /* ignore */
    }
    udpSocket = null
  }
  if (tcpServer) {
    tcpServer.close()
    tcpServer = null
  }
  console.log('[Discovery] Stopped')
}

// ─── IPC ──────────────────────────────────────────────────────────────────────

export function registerDiscoveryIpc() {
  ipcMain.handle('discovery:get-peers', () => getPeerList())
  ipcMain.handle('discovery:get-my-info', () => getMyInfo())

  ipcMain.handle('chat:get-history', (_, peerIp) => {
    return chatHistory.get(peerIp) || []
  })

  ipcMain.handle('chat:send-message', async (_, { targetIp, text }) => {
    try {
      const msg = await sendMessageToPeer(targetIp, text)
      return { success: true, message: msg }
    } catch (err) {
      console.error('[Chat] Send error:', err.message)
      return { success: false, error: err.message }
    }
  })
}
