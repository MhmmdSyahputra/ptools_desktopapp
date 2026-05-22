import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  device: {
    deviceName: async () => await ipcRenderer.invoke('get-device-label'),
    deviceUuid: async () => await ipcRenderer.invoke('get-device-uuid'),
    deviceBrand: async () => await ipcRenderer.invoke('get-device-brand'),
    deviceInfo: async () => await ipcRenderer.invoke('get-device-info')
  },

  scanner: {
    scanDirectory: (dirPath) => ipcRenderer.invoke('scanner:scan-directory', dirPath),
    selectDirectory: () => ipcRenderer.invoke('scanner:select-directory'),
    deleteJunkFolder: (folderPath) => ipcRenderer.invoke('scanner:delete-junk-folder', folderPath),
    openInExplorer: (folderPath) => ipcRenderer.invoke('scanner:open-in-explorer', folderPath),
    showInExplorer: (folderPath) => ipcRenderer.invoke('scanner:show-in-explorer', folderPath)
  },

  windowNotification: {
    show: async (payload) => {
      if (process.platform === 'linux') {
        try {
          if (typeof Notification !== 'undefined') {
            if (Notification.permission === 'granted') {
              new Notification(payload.title || 'Ptools Notification', {
                body: payload.body || '',
                silent: Boolean(payload.silent)
              })
              return { status: true, source: 'html5' }
            } else if (Notification.permission !== 'denied') {
              const permission = await Notification.requestPermission()
              if (permission === 'granted') {
                new Notification(payload.title || 'Ptools Notification', {
                  body: payload.body || '',
                  silent: Boolean(payload.silent)
                })
                return { status: true, source: 'html5' }
              }
            }
          }
        } catch (e) {
          console.error('[Notification] Renderer fallback failed:', e)
        }
        return { status: false, message: 'HTML5 notifications not available or blocked' }
      }
      return ipcRenderer.invoke('window:show-notification', payload)
    }
  },

  // ─── Discovery ─────────────────────────────────────────────────────────────
  discovery: {
    getPeers: () => ipcRenderer.invoke('discovery:get-peers'),
    getMyInfo: () => ipcRenderer.invoke('discovery:get-my-info'),
    onPeersUpdated: (callback) => {
      const handler = (_event, peers) => callback(peers)
      ipcRenderer.on('discovery:peers-updated', handler)
      return () => ipcRenderer.removeListener('discovery:peers-updated', handler)
    }
  },

  // ─── Chat ──────────────────────────────────────────────────────────────────
  chat: {
    // Ambil history chat dengan peer tertentu
    getHistory: (peerIp) => ipcRenderer.invoke('chat:get-history', peerIp),

    // Kirim pesan ke peer
    sendMessage: (targetIp, text) => ipcRenderer.invoke('chat:send-message', { targetIp, text }),

    // Kirim tawaran file (belum transfer data sampai penerima accept)
    sendFileOffer: (targetIp, payload) =>
      ipcRenderer.invoke('chat:send-file-offer', { targetIp, ...payload }),

    // Buka native file picker agar dapat absolute path di Electron
    selectFiles: () => ipcRenderer.invoke('chat:select-files'),

    // Penerima setuju menerima file
    acceptFileOffer: (peerIp, fileId, fileName) =>
      ipcRenderer.invoke('chat:accept-file-offer', { peerIp, fileId, fileName }),

    // Penerima menolak file
    rejectFileOffer: (peerIp, fileId) =>
      ipcRenderer.invoke('chat:reject-file-offer', { peerIp, fileId }),

    // Listen pesan masuk (dari siapapun), return cleanup fn
    onMessageReceived: (callback) => {
      const handler = (_event, msg) => callback(msg)
      ipcRenderer.on('chat:message-received', handler)
      return () => ipcRenderer.removeListener('chat:message-received', handler)
    },

    onFileOfferUpdated: (callback) => {
      const handler = (_event, payload) => callback(payload)
      ipcRenderer.on('chat:file-offer-updated', handler)
      return () => ipcRenderer.removeListener('chat:file-offer-updated', handler)
    }
  },

  getMyConfig: async () => await ipcRenderer.invoke('get-my-config'),
  getImage: async () => await ipcRenderer.invoke('get-assets-path'),
  getNotificationSoundPath: async () => await ipcRenderer.invoke('get-notification-sound-path'),

  printOrderReceipt(data) {
    ipcRenderer.send('print-order-receipt', data)
  },

  checkForUpdates: () => ipcRenderer.send('check-for-updates'),

  onUpdateNotification: (callback) => {
    const handler = (_event, message, severity) => callback(message, severity)
    ipcRenderer.on('update:notification', handler)
    return () => ipcRenderer.removeListener('update:notification', handler)
  },

  onUpdateProgress: (callback) => {
    const handler = (_event, percent) => callback(percent)
    ipcRenderer.on('update:download-progress', handler)
    return () => ipcRenderer.removeListener('update:download-progress', handler)
  },

  checkNetworkStatus: async () => await ipcRenderer.invoke('check-network-status'),

  onNetworkStatusChanged: (callback) => {
    const handler = (_event, isOnline) => callback(isOnline)
    ipcRenderer.on('network-status-changed', handler)
    return () => ipcRenderer.removeListener('network-status-changed', handler)
  },

  printThermalLan: async (data) => await ipcRenderer.invoke('print-thermal-lan', data),

  testThermalPrinter: async ({ printerIp, printerPort = 9100 }) =>
    await ipcRenderer.invoke('test-thermal-printer', { printerIp, printerPort }),

  getAppVersion: async () => await ipcRenderer.invoke('get-app-version')
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}
