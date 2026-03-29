import dgram from 'dgram'
import net from 'net'
import os from 'os'
import { ipcMain, Notification, dialog, shell } from 'electron'
import { stat, readFile, writeFile, mkdir } from 'fs/promises'
import { dirname } from 'path'
import { mainWindow } from '../window.js'

const BROADCAST_PORT = 45678
const CHAT_PORT = 45679
const BROADCAST_INTERVAL = 3000
const PEER_TIMEOUT = 10000
const APP_ID = 'ptools-electron-app'
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024
const FILE_CHUNK_SIZE = 64 * 1024
const MAX_TEXT_CHARS = 4000
const MAX_TCP_BUFFER_CHARS = 2 * 1024 * 1024

const COMBINING_REGEX = /[\u0300-\u036f\u0483-\u0489\u0591-\u05bd\u05bf-\u05c7\u0610-\u061a\u064b-\u065f\u06d6-\u06ed]/g
const INVISIBLE_REGEX = /[\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFEFF]/g

let udpSocket = null
let tcpServer = null
let broadcastTimer = null
let cleanupTimer = null
let peers = new Map()
let myInfo = null
let chatHistory = new Map()
let pendingOutgoingFiles = new Map()
let incomingFileTransfers = new Map()

function playMainNotificationCue() {
  try {
    shell.beep()
  } catch (error) {
    console.error('[Notify] Failed to play main cue:', error)
  }
}

function sanitizeTextInput(rawText) {
  const text = String(rawText ?? '')
  const clean = text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
  const normalized = clean.normalize('NFKC')

  if (normalized.length > MAX_TEXT_CHARS) {
    return {
      ok: false,
      reason: `Pesan terlalu panjang (maks ${MAX_TEXT_CHARS} karakter)`
    }
  }

  const combiningCount = (normalized.match(COMBINING_REGEX) || []).length
  const invisibleCount = (normalized.match(INVISIBLE_REGEX) || []).length

  if (combiningCount > 120 || invisibleCount > 80) {
    return {
      ok: false,
      reason: 'Pesan terdeteksi mengandung virtext/karakter berbahaya'
    }
  }

  return { ok: true, text: normalized }
}

function getMyIPs() {
  const ips = new Set()
  for (const iface of Object.values(os.networkInterfaces())) {
    for (const cfg of iface) {
      if (cfg.family === 'IPv4' && !cfg.internal) ips.add(cfg.address)
    }
  }
  return ips
}

function normalizeIp(ip) {
  return (ip || '').replace('::ffff:', '')
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

function updateFileOfferStatus(peerIp, fileId, fileStatus, extra = {}) {
  const list = chatHistory.get(peerIp) || []
  const idx = list.findIndex((msg) => msg.id === fileId)
  if (idx >= 0) {
    list[idx] = { ...list[idx], fileStatus, ...extra }
  }

  notifyRenderer('chat:file-offer-updated', {
    peerIp,
    fileId,
    fileStatus,
    ...extra
  })
}

function sendPacketToPeer(targetIp, packet) {
  return new Promise((resolve, reject) => {
    const client = new net.Socket()

    const timeout = setTimeout(() => {
      client.destroy()
      reject(new Error('Connection timeout — pastikan peer masih online'))
    }, 8000)

    client.connect(CHAT_PORT, targetIp, () => {
      const payload = { appId: APP_ID, ...packet }
      client.write(JSON.stringify(payload) + '\n')
      clearTimeout(timeout)
      client.end()
      resolve()
    })

    client.on('error', (err) => {
      clearTimeout(timeout)
      reject(err)
    })
  })
}

function sendManyPacketsToPeer(targetIp, packets) {
  return new Promise((resolve, reject) => {
    const client = new net.Socket()

    const timeout = setTimeout(() => {
      client.destroy()
      reject(new Error('Connection timeout saat kirim file'))
    }, 20000)

    client.connect(CHAT_PORT, targetIp, () => {
      try {
        for (const packet of packets) {
          const payload = { appId: APP_ID, ...packet }
          client.write(JSON.stringify(payload) + '\n')
        }
        clearTimeout(timeout)
        client.end()
        resolve()
      } catch (err) {
        clearTimeout(timeout)
        reject(err)
      }
    })

    client.on('error', (err) => {
      clearTimeout(timeout)
      reject(err)
    })
  })
}

async function sendPendingFileToPeer(targetIp, pending) {
  const fileBuffer = await readFile(pending.filePath)
  const totalChunks = Math.ceil(fileBuffer.length / FILE_CHUNK_SIZE)

  const packets = [
    {
      type: 'file-transfer-start',
      fileId: pending.fileId,
      fileName: pending.fileName,
      fileSize: pending.fileSize,
      mimeType: pending.mimeType,
      totalChunks,
      timestamp: Date.now()
    }
  ]

  for (let i = 0; i < totalChunks; i += 1) {
    const start = i * FILE_CHUNK_SIZE
    const end = Math.min(start + FILE_CHUNK_SIZE, fileBuffer.length)
    const chunk = fileBuffer.subarray(start, end)

    packets.push({
      type: 'file-transfer-chunk',
      fileId: pending.fileId,
      index: i,
      data: chunk.toString('base64')
    })
  }

  packets.push({ type: 'file-transfer-end', fileId: pending.fileId })

  await sendManyPacketsToPeer(targetIp, packets)
}

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

function createIncomingTextMessage(msg, peerIp, safeText) {
  return {
    id: msg.id || `${Date.now()}-${Math.random()}`,
    type: 'text',
    from: msg.from,
    fromIp: peerIp,
    text: safeText,
    timestamp: msg.timestamp || Date.now(),
    isMine: false
  }
}

function createIncomingFileOffer(msg, peerIp) {
  return {
    id: msg.fileId,
    type: 'file-offer',
    from: msg.from,
    fromIp: peerIp,
    timestamp: msg.timestamp || Date.now(),
    isMine: false,
    fileName: msg.fileName,
    fileSize: msg.fileSize,
    mimeType: msg.mimeType || 'application/octet-stream',
    fileStatus: 'waiting'
  }
}

async function handleIncomingPacket(msg, peerIp) {
  if (msg.appId !== APP_ID) return

  if (!msg.type || msg.type === 'chat-text') {
    const validated = sanitizeTextInput(msg.text)
    if (!validated.ok) {
      console.warn(`[Chat] Blocked incoming text from ${peerIp}: ${validated.reason}`)
      return
    }

    const incoming = createIncomingTextMessage(msg, peerIp, validated.text)
    addToHistory(peerIp, incoming)
    notifyRenderer('chat:message-received', incoming)

    if (mainWindow && !mainWindow.isFocused()) {
      playMainNotificationCue()
      new Notification({
        title: `💬 ${msg.from}`,
        body:
          validated.text.length > 100
            ? validated.text.slice(0, 100) + '...'
            : validated.text,
        silent: false
      }).show()
    }

    console.log(`[Chat] ← ${msg.from} (${peerIp}): ${validated.text}`)
    return
  }

  if (msg.type === 'file-offer') {
    const incomingFileOffer = createIncomingFileOffer(msg, peerIp)
    addToHistory(peerIp, incomingFileOffer)
    notifyRenderer('chat:message-received', incomingFileOffer)

    if (mainWindow && !mainWindow.isFocused()) {
      playMainNotificationCue()
      new Notification({
        title: `📎 File dari ${msg.from}`,
        body: `${msg.fileName} (${Math.ceil((msg.fileSize || 0) / 1024)} KB)`,
        silent: false
      }).show()
    }

    return
  }

  if (msg.type === 'file-accept') {
    const pending = pendingOutgoingFiles.get(msg.fileId)
    if (!pending) return

    updateFileOfferStatus(peerIp, msg.fileId, 'sending')

    try {
      await sendPendingFileToPeer(peerIp, pending)
      updateFileOfferStatus(peerIp, msg.fileId, 'sent')
    } catch (err) {
      console.error('[File] Failed to send accepted file:', err.message)
      updateFileOfferStatus(peerIp, msg.fileId, 'failed', { error: err.message })
    }
    return
  }

  if (msg.type === 'file-reject') {
    updateFileOfferStatus(peerIp, msg.fileId, 'rejected')
    pendingOutgoingFiles.delete(msg.fileId)
    return
  }

  if (msg.type === 'file-transfer-start') {
    const current = incomingFileTransfers.get(msg.fileId)
    if (!current) return

    incomingFileTransfers.set(msg.fileId, {
      ...current,
      fileName: msg.fileName,
      fileSize: msg.fileSize,
      mimeType: msg.mimeType,
      totalChunks: msg.totalChunks || 0,
      chunks: []
    })

    updateFileOfferStatus(peerIp, msg.fileId, 'downloading')
    return
  }

  if (msg.type === 'file-transfer-chunk') {
    const transfer = incomingFileTransfers.get(msg.fileId)
    if (!transfer) return

    transfer.chunks[msg.index] = Buffer.from(msg.data || '', 'base64')
    incomingFileTransfers.set(msg.fileId, transfer)
    return
  }

  if (msg.type === 'file-transfer-end') {
    const transfer = incomingFileTransfers.get(msg.fileId)
    if (!transfer) return

    try {
      const mergedBuffer = Buffer.concat((transfer.chunks || []).filter(Boolean))
      await mkdir(dirname(transfer.savePath), { recursive: true })
      await writeFile(transfer.savePath, mergedBuffer)

      updateFileOfferStatus(peerIp, msg.fileId, 'downloaded', {
        localPath: transfer.savePath
      })

      await sendPacketToPeer(peerIp, { type: 'file-received', fileId: msg.fileId })
    } catch (err) {
      console.error('[File] Failed to finalize incoming file:', err.message)
      updateFileOfferStatus(peerIp, msg.fileId, 'failed', { error: err.message })
    } finally {
      incomingFileTransfers.delete(msg.fileId)
    }

    return
  }

  if (msg.type === 'file-received') {
    updateFileOfferStatus(peerIp, msg.fileId, 'downloaded')
    pendingOutgoingFiles.delete(msg.fileId)
  }
}

function startTCPServer() {
  tcpServer = net.createServer((socket) => {
    let buffer = ''

    socket.on('data', (chunk) => {
      buffer += chunk.toString()

      if (buffer.length > MAX_TCP_BUFFER_CHARS) {
        console.warn('[Chat] Buffer overflow prevented: incoming payload too large')
        buffer = ''
        socket.destroy()
        return
      }

      const lines = buffer.split('\n')
      buffer = lines.pop()

      for (const line of lines) {
        if (!line.trim()) continue

        try {
          const msg = JSON.parse(line)
          const peerIp = normalizeIp(socket.remoteAddress)
          handleIncomingPacket(msg, peerIp)
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

async function sendMessageToPeer(targetIp, text) {
  const validated = sanitizeTextInput(text)
  if (!validated.ok) {
    throw new Error(validated.reason)
  }

  const me = getMyInfo()
  const msg = {
    type: 'chat-text',
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    from: me.username,
    fromIp: me.ip,
    text: validated.text,
    timestamp: Date.now()
  }

  await sendPacketToPeer(targetIp, msg)

  const outgoing = { ...msg, type: 'text', isMine: true, fromIp: targetIp }
  addToHistory(targetIp, outgoing)

  console.log(`[Chat] → ${me.username} → ${targetIp}: ${validated.text}`)
  return outgoing
}

async function registerOutgoingFileOffer(targetIp, payload) {
  const { filePath, fileName, fileSize, mimeType } = payload

  if (!filePath || !fileName) {
    throw new Error('File tidak valid')
  }

  const st = await stat(filePath)
  const normalizedSize = fileSize || st.size

  if (normalizedSize > MAX_FILE_SIZE_BYTES) {
    throw new Error('Ukuran file maksimal 50MB')
  }

  const me = getMyInfo()
  const fileId = `${Date.now()}-${Math.random().toString(36).slice(2)}`

  const outgoingFileOffer = {
    id: fileId,
    type: 'file-offer',
    from: me.username,
    fromIp: targetIp,
    timestamp: Date.now(),
    isMine: true,
    fileName,
    fileSize: normalizedSize,
    mimeType: mimeType || 'application/octet-stream',
    fileStatus: 'waiting'
  }

  pendingOutgoingFiles.set(fileId, {
    fileId,
    targetIp,
    filePath,
    fileName,
    fileSize: normalizedSize,
    mimeType: mimeType || 'application/octet-stream'
  })

  await sendPacketToPeer(targetIp, {
    type: 'file-offer',
    fileId,
    fileName,
    fileSize: normalizedSize,
    mimeType: mimeType || 'application/octet-stream',
    from: me.username,
    timestamp: outgoingFileOffer.timestamp
  })

  addToHistory(targetIp, outgoingFileOffer)
  return outgoingFileOffer
}

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
  pendingOutgoingFiles.clear()
  incomingFileTransfers.clear()

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

  ipcMain.handle('chat:send-file-offer', async (_, { targetIp, filePath, fileName, fileSize, mimeType }) => {
    try {
      const msg = await registerOutgoingFileOffer(targetIp, {
        filePath,
        fileName,
        fileSize,
        mimeType
      })
      return { success: true, message: msg }
    } catch (err) {
      console.error('[File] Offer error:', err.message)
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('chat:select-files', async () => {
    try {
      const result = await dialog.showOpenDialog(mainWindow, {
        title: 'Pilih file untuk dikirim',
        properties: ['openFile', 'multiSelections']
      })

      if (result.canceled || !result.filePaths?.length) {
        return { success: true, files: [] }
      }

      const files = await Promise.all(
        result.filePaths.map(async (filePath) => {
          const st = await stat(filePath)
          const normalizedPath = filePath.replace(/\\/g, '/')
          const name = normalizedPath.split('/').pop() || 'file'

          return {
            path: filePath,
            name,
            size: st.size,
            type: 'application/octet-stream'
          }
        })
      )

      return { success: true, files }
    } catch (err) {
      console.error('[File] Select file error:', err.message)
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('chat:accept-file-offer', async (_, { peerIp, fileId, fileName }) => {
    try {
      const result = await dialog.showSaveDialog(mainWindow, {
        title: 'Simpan file dari Messenger',
        defaultPath: fileName
      })

      if (result.canceled || !result.filePath) {
        return { success: false, canceled: true }
      }

      incomingFileTransfers.set(fileId, {
        fromIp: peerIp,
        savePath: result.filePath,
        chunks: [],
        totalChunks: 0,
        fileName,
        fileSize: 0,
        mimeType: 'application/octet-stream'
      })

      updateFileOfferStatus(peerIp, fileId, 'accepting')
      await sendPacketToPeer(peerIp, { type: 'file-accept', fileId })
      return { success: true, savePath: result.filePath }
    } catch (err) {
      console.error('[File] Accept error:', err.message)
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('chat:reject-file-offer', async (_, { peerIp, fileId }) => {
    try {
      updateFileOfferStatus(peerIp, fileId, 'rejected')
      await sendPacketToPeer(peerIp, { type: 'file-reject', fileId })
      return { success: true }
    } catch (err) {
      console.error('[File] Reject error:', err.message)
      return { success: false, error: err.message }
    }
  })
}