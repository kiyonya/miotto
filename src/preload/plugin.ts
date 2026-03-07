
import { contextBridge, ipcRenderer } from 'electron'
import { PluginAvailableEvents,PluginAvailableControls } from '../types/data'

const ALLOWED_EVENTS = new Set<string>(PluginAvailableEvents.map(k => `event:${k}`))
const ALLOW_EMITS = new Set<string>(PluginAvailableControls.map(k=>`ctl:${k}`))

let winId: string = sessionStorage.getItem('winId') || ''

ipcRenderer.once('winId', (_, id) => {
    winId = id
    sessionStorage.setItem('winId', id)
})

const getWindowId = () => winId

const syncEvents = async () => {
    await ipcRenderer.invoke('plugin:repostWinEvents', winId)
}
const getWindowInfo = () => ipcRenderer.invoke('plugin:getWinInfo', winId)

const whenReady = async (): Promise<string> => {
    if (winId) { return winId }
    else {
        const w = await new Promise<string>((resolve, _) => {
            const onWinId = (_, id) => {
                ipcRenderer.off('winId', onWinId)
                resolve(id)
            }
            ipcRenderer.on('winId', onWinId)
        })
        winId = w
        sessionStorage.setItem('winId', winId)
        return w
    }
}

const port = {
    on: (channel: string, listener: (...args: any[]) => void) => {
        if (!ALLOWED_EVENTS.has(channel)) {
            return
        }
        ipcRenderer.on(channel, listener)
    },
    once: (channel: string, listener: (...args: any[]) => void) => {
        if (!ALLOWED_EVENTS.has(channel)) {
            return
        }
        ipcRenderer.once(channel, listener)
    },
    removeListener: (channel: string, listener: (...args: any[]) => void) => {
        if (ALLOWED_EVENTS.has(channel)) {
            ipcRenderer.removeListener(channel, listener)
        }
    },
    removeAllListeners: (channel?: string) => {
        if (channel) {
            if (ALLOWED_EVENTS.has(channel)) {
                ipcRenderer.removeAllListeners(channel)
            }
        } else {
            ALLOWED_EVENTS.forEach(allowedChannel => {
                ipcRenderer.removeAllListeners(allowedChannel)
            })
        }
    },
    send: (channel: string, ...args: any[]) => {
        if (!ALLOW_EMITS.has(channel)) {
            return
        }
        ipcRenderer.send(channel, ...args)
    },
    sendSync: (channel: string, ...args: any[]) => {
        if (!ALLOW_EMITS.has(channel)) {
            return
        }
        ipcRenderer.sendSync(channel, ...args)
    },
    invoke: (channel: string, ...args: any[]): Promise<any> => {
        if (!ALLOW_EMITS.has(channel)) {
            return Promise.reject(new Error(`Channel "${channel}" is not allowed`))
        }
        return ipcRenderer.invoke(channel, ...args)
    },
    whatEventCanIListen: () => {
        return Array.from(ALLOWED_EVENTS)
    },
    whatEventCanISend: () => {
        return Array.from(ALLOW_EMITS)
    }
}

if (process.contextIsolated) {
    try {
        contextBridge.exposeInMainWorld('port', port)
        contextBridge.exposeInMainWorld('getWindowId', getWindowId)
        contextBridge.exposeInMainWorld('syncEvents', syncEvents)
        contextBridge.exposeInMainWorld('getWindowInfo', getWindowInfo)
        contextBridge.exposeInMainWorld('whenReady', whenReady)
    } catch (error) {
        console.error(error)
    }
} else {
    // @ts-ignore (define in dts)
    window.port = port
}