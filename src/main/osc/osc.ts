import { Client, Server } from 'node-osc'
import { configStore } from '../config'
import { PlayerController } from '../utils/player-controller'
import { defaultDataEmitter } from '../utils/transport'
import net from 'node:net'
import { AppEvents } from '../../types/event'
import { AppTypes } from '../../types/app'

export class OSCProtocalService {

    private server: Server | null = null
    private client: Client | null = null
    public isOSCEnable: boolean = false
    private oscAvailbleEvents: (keyof AppEvents.Events)[] = [
        'audioMute',
        'audioVolumeChange',
        'audioTimeUpdate',
        'audioCanplay',
        'audioEnd',
        'audioDuration',
        'audioPlaystateUpdate',
        'audioPause',
        'audioPlay',
        'audioSeek',
        'audioUserRequestPause',
        'audioUserRequestPlay',
        'playingTrackUpdate',
        'playingSongUpdate',
        'playingTrackIdUpdate',
        'playerPlaySong',
        'playingLyricUpdate',
        'playerPlaymodeUpdate',
        'playerPlaylistUpdate',
        'playerNextSong',
        'playerPreviousSong',
        'appMusicplayerOpen',
        'appMusicplayerClose',
        'appRouterUpdate',
        'appRenderReady',
        'appRenderMount',
        'appThemeUpdate',
        'playerEqualizerUpdate'
    ]

    public async startOSC() {
        if (this.isOSCEnable) { return }
        const serverPort = configStore.get('oscServerPort')
        const clientPort = configStore.get('oscClientPort')
        const portAvailable = (await Promise.all([this.isPortAvailable(serverPort), this.isPortAvailable(clientPort)])).every(Boolean)
        if (portAvailable) {
            this.server = new Server(serverPort, '127.0.0.1', () => {
                this.server?.on('message', this.serverMessageHandler)
            })
            this.client = new Client('127.0.0.1', clientPort)
            
            const oscGroup = defaultDataEmitter.group('osc')
            for(const eventName of this.oscAvailbleEvents){
                oscGroup.on(eventName,(...args:any[])=>{
                    this.clientMessageSender(eventName,args as any)
                })
            }
            this.isOSCEnable = true
        }
        else {
            throw new Error('Port Busy')
        }
    }

    public async closeOSC() {
        if (!this.isOSCEnable) { return }
        defaultDataEmitter.group('osc').removeAllListeners()
        if (this.server) { this.server.close() }
        if (this.client) { this.client.close() }
        this.server = this.client = null
        this.isOSCEnable = false
    }

    private serverMessageHandler(message: any[]) {
        const address = message.shift()
        const args = message
        switch (address) {
            case '/player/pause':
                PlayerController.pause()
                break
            case '/player/play':
                PlayerController.play()
                break
            case '/player/toggle':
                PlayerController.togglePlay()
                break
            case '/player/playmode':
                const playMode = args[0]
                PlayerController.setPlayMode(playMode)
                break
            case '/player/playmode/switch':
                PlayerController.switchPlayMode()
                break
            case '/player/next':
                PlayerController.next()
                break
            case '/player/previous':
                PlayerController.previous()
                break
            case '/player/play/track':
                const itrackB64 = args[0] || ''
                const sb64 = itrackB64?.replace(/-/g, '+').replace(/_/g, '/');
                const str = Buffer.from(sb64, 'base64').toString('utf-8');
                try {
                    const itrack: AppTypes.ITrackId = JSON.parse(str)
                    PlayerController.playTrack(itrack)
                } catch (error) {
                    console.warn(error)
                }
                break
            case '/player/volume':
                const volume = args[0]
                PlayerController.setVolume(volume)
                break
            case '/player/seek':
                const seek = args[0]
                PlayerController.seek(seek)
                break
            case '/init':
                defaultDataEmitter.group('osc').rePostGroupEvents()
                break
        }
    }

    private clientMessageSender<K extends keyof AppEvents.Events>(key: K, value: AppEvents.Events[K]) {
        if (key && this.oscAvailbleEvents.includes(key)) {
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
                this.client?.send(route)
            }
            else {
                this.client?.send(route, val)
            }
        }
    }

    private isPortAvailable(port: number, host: string = '127.0.0.1') {
        return new Promise<boolean>((resolve) => {
            const server = net.createServer();
            server.once('error', (err: any) => {
                if (err.code === 'EADDRINUSE') {
                    resolve(false);
                } else {
                    resolve(false);
                }
            });
            server.once('listening', () => {
                server.close(() => {
                    resolve(true);
                });
            });
            server.listen(port, host);
        });
    }
}