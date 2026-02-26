
import { contextBridge, ipcRenderer } from 'electron'

const ALLOWED_EVENTS = new Set<string>([
    'ev:audioCanplay',
    'ev:audioDuration',
    'ev:audioEnd',
    'ev:audioMute',
    'ev:audioPause',
    'ev:audioPlay',
    'ev:audioPlaystateUpdate',
    'ev:audioSeek',
    'ev:audioTimeUpdate',
    'ev:audioUserRequestPause',
    'ev:audioUserRequestPlay',
    'ev:audioVolumeChange',
    'ev:playerNextSong',
    'ev:playerPlaySong',
    'ev:playerPlaylistUpdate',
    'ev:playerPlaymodeUpdate',
    'ev:playerPreviousSong',
    'ev:playingLyricUpdate',
    'ev:playingSongUpdate',
    'ev:playingTrackIdUpdate',
    'ev:playingTrackUpdate',
    'ev:appThemeUpdate',
    'ev:appRenderMount',
    'ev:appRenderReady'
])

const ALLOW_EMITS = new Set<string>([
    'plugin:getAllData',
    'plugin:getData',
    'control:playerPause',
    'control:playerPlay',
    'control:playerNext',
    'control:playerPrevious',
    'control:playerToggle',
    'control:playerSeek',
    'control:playerSetVolume',
    'control:playMode',
    'control:playModeSwitch',
    'control:playerPlayTrack'
])

const secureIpc = {
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
        contextBridge.exposeInMainWorld('ipcRenderer', secureIpc)
    } catch (error) {
        console.error(error)
    }
} else {
    // @ts-ignore (define in dts)
    window.ipc = secureIpc
}