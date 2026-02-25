import { Client, Server } from 'node-osc'
import { defaultDataTransEmitter } from '../trans_emitter'
import { AppTypes } from '../../types/app'
import { BrowserWindow } from 'electron'

const OSCSERVERPORT = 15051
const OSCCLIENTPORT = 15050

let oscServer: Server | null = null
let oscClient: Client | null = null

const oscClientSender = <K extends keyof AppTypes.DefaultTransData>(key: K, value: AppTypes.DefaultTransData[K]) => {
    if (key) {
        const route: string = '/' + key.replace(/([A-Z])/g, '/$1').toLowerCase()
        let val: number | string | boolean | null = null

        if (!value) {
            val = null
        }
        else if (typeof value === 'boolean' || typeof value === 'number' || typeof value === 'string') {
            val = value
        }
        else if (typeof value === 'object' || Array.isArray(value)) {
            val = JSON.stringify(value)
        }

        if (!val) {
            oscClient?.send(route)
        }
        else {
            oscClient?.send(route, val)
        }

    }
}

export function enableOSC(mainWindow: BrowserWindow, serverPort: number = 15051, clientPort: number = 15050) {
    if (oscServer || oscClient) {
        console.log("已经打开了")
        return
    }
    const dataEmitter = defaultDataTransEmitter
    const serverMessageHandler = (msg: any[]) => {
        const address = msg.shift()
        const args = msg
        console.log(address, args)
        switch (address) {
            case '/player/pause':
                mainWindow.webContents.send('osc:playerPause')
                break
            case '/player/play':
                mainWindow.webContents.send('osc:playerPlay')
                break
            case '/player/toggle':
                mainWindow.webContents.send('osc:playerToggle')
                break
            case '/player/playmode':
                const playMode = args[0]
                mainWindow.webContents.send('osc:playMode', playMode)
                break
            case '/player/playmode/switch':
                mainWindow.webContents.send('osc:playModeSwitch')
                break
            case '/player/next':
                mainWindow.webContents.send('osc:playerNext')
                break
            case '/player/previous':
                mainWindow.webContents.send('osc:playerPrevious')
                break
            case '/player/play/track':
                const itrackB64 = args[0]
                mainWindow.webContents.send('osc:playerPlayTrack', itrackB64)
                break
            case '/player/volume':
                const volume = args[0]
                mainWindow.webContents.send('osc:playerVolume', volume)
                break
            case '/player/seek':
                const seek = args[0]
                mainWindow.webContents.send('osc:playerSeek', seek)
                break
            case '/app/open/musicplayer':
                mainWindow.webContents.send('osc:appOpenMusicplayer')
                break
            case '/init':
                dataEmitter.emitAll()
                console.log('重新释放信息')
                break
        }
    }
    try {
        oscServer = new Server(serverPort || OSCSERVERPORT, '127.0.0.1', () => {
            const server = oscServer as Server
            server.on('message', serverMessageHandler)
        })
    } catch (error) {
        console.log(error)
    }

    oscClient = new Client('127.0.0.1', clientPort || OSCCLIENTPORT)
    dataEmitter.on('event', oscClientSender)

}

export function disableOSC() {
    const dataEmitter = defaultDataTransEmitter
    dataEmitter.off('event', oscClientSender)
    if (oscServer) {
        oscServer.removeAllListeners()
        oscServer.close()
        oscServer = null
    }
    if (oscClient) {
        oscClient.removeAllListeners()
        oscClient.close()
        oscClient = null
    }
}