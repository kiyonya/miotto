import { app, shell, BrowserWindow, ipcMain, session, desktopCapturer } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { registerNCMApiIPC } from './ipc/ncmapi'
import { biliApi } from './ipc/biliapi'
import { localAPI } from './ipc/localapi'
import { appIpc } from './ipc/app'
import { CacheIPC } from './ipc/cache'
import { ncmOrpheus } from './ipc/orpheus'
import { DataTransport } from './ipc/emitter'
import { OSCIPC } from './ipc/osc'
import { MediaIpc } from './ipc/media'
import { pluginIPC } from './ipc/plugin'
import { windowManager } from './utils/window'
import { controlIPC } from './ipc/control'

function startAPP(){

  const mainWindow = windowManager.createWindow('main',{
    width: 1060,
    height: 720,
    show: false,
    frame: false,
    backgroundMaterial: 'mica',
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      sandbox: false,
      webSecurity: false
    }
  })
  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
  appIpc(mainWindow)
  
}

app.whenReady().then(() => {
  startAPP()
  electronApp.setAppUserModelId('com.electron')
  
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  OSCIPC()
  registerNCMApiIPC()
  biliApi()
  localAPI()
  CacheIPC()
  ncmOrpheus()
  DataTransport()
  MediaIpc()
  pluginIPC()
  controlIPC()

  session.defaultSession.setDisplayMediaRequestHandler((request, callback) => {
    desktopCapturer.getSources({ types: ['screen'] }).then((sources) => {
      callback({ video: sources[0], audio: 'loopback' })
    })
  }, { useSystemPicker: true })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

