
import { BrowserWindow } from 'electron'
import { windowManager } from '../window'
import { AppTypes } from '../../types/app'

export class AppProcessController {
    private static getMainWindow(): BrowserWindow | undefined {
        return windowManager.getWindow('main')
    }

    static sendToMain(channel: string, ...args: any[]): void {
        const mainWindow = this.getMainWindow()
        if (mainWindow) {
            mainWindow.webContents.send(channel, ...args)
        }
    }

    public static pause(): void {
        this.sendToMain('control:playerPause')
    }

    public static play(): void {
        this.sendToMain('control:playerPlay')
    }

    public static next(): void {
        this.sendToMain('control:playerNext')
    }

    public static previous(): void {
        this.sendToMain('control:playerPrevious')
    }

    public static togglePlay(): void {
        this.sendToMain('control:playerToggle')
    }

    public static seek(time: number): void {
        if (typeof time !== 'number' || isNaN(time)) return
        this.sendToMain('control:playerSeek', time)
    }

    public static setVolume(volume: number): void {
        if (typeof volume !== 'number' || isNaN(volume)) return
        this.sendToMain('control:playerSetVolume', volume)
    }

    public static setPlayMode(mode: AppTypes.PlayMode): void {
        if (!['list', 'listloop', 'loop', 'shuffle'].includes(mode)) return
        this.sendToMain('control:playMode', mode)
    }

    public static switchPlayMode(): void {
        this.sendToMain('control:playModeSwitch')
    }

    public static playTrack(track: AppTypes.ITrackId): void {
        this.sendToMain('control:playerPlayTrack', track)
    }
}