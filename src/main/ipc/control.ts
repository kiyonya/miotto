import { ipcMain } from "electron"
import { windowManager } from "../utils/window"
import { AppTypes } from "../../types/app"
import { PlayerController } from "../utils/player-controller"

export function controlIPC() {

    const mainWindow = windowManager.getWindow('main')
    if (mainWindow) {
        ipcMain.handle('control:playerPause', () => {
            PlayerController.pause()
        })
        ipcMain.handle('control:playerPlay', () => {
            PlayerController.play()
        })
        ipcMain.handle('control:playerNext', () => {
            PlayerController.next()
        })
        ipcMain.handle('control:playerPrevious', () => {
            PlayerController.previous()
        })
        ipcMain.handle('control:playerToggle', () => {
            PlayerController.togglePlay()
        })
        ipcMain.handle('control:playerSeek', (_, time: number) => {
            PlayerController.seek(time)
        })
        ipcMain.handle('control:playerSetVolume', (_, volume: number) => {
            PlayerController.setVolume(volume)
        })
        ipcMain.handle('control:playMode', (_, mode: AppTypes.PlayMode) => {
            PlayerController.setPlayMode(mode)
        })
        ipcMain.handle('control:playModeSwitch', () => {
            PlayerController.switchPlayMode()
        })
        ipcMain.handle('control:playerPlayTrack', (_, track: AppTypes.ITrackId) => {
            PlayerController.playTrack(track)
        })
    }
}