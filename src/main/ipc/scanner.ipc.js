import { deleteJunkFolder, scanForJunkFolders } from '../services/scanner.service'

const { ipcMain, dialog, shell } = require('electron')

export function registerScannerIpc() {
  ipcMain.handle('scanner:scan-directory', async (event, dirPath) => {
    return await scanForJunkFolders(dirPath)
  })

  ipcMain.handle('scanner:select-directory', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
      title: 'Pilih Root Project Directory'
    })
    if (result.canceled) return null
    return result.filePaths[0]
  })

  ipcMain.handle('scanner:delete-junk-folder', async (event, folderPath) => {
    return await deleteJunkFolder(folderPath)
  })

  // Buka folder di File Explorer / Finder / Nautilus
  ipcMain.handle('scanner:open-in-explorer', async (event, folderPath) => {
    await shell.openPath(folderPath)
  })

  // Reveal (highlight) folder di explorer tanpa masuk ke dalamnya
  ipcMain.handle('scanner:show-in-explorer', async (event, folderPath) => {
    shell.showItemInFolder(folderPath)
  })
}
