import { ipcMain } from "electron"
import { windowManager } from "../window"
import { AppTypes } from "../../types/app"
import { AppProcessController } from "../service/controller"

export function controlIPC() {

    const mainWindow = windowManager.getWindow('main')
    if (mainWindow) {
        ipcMain.handle('control:playerPause', () => {
            AppProcessController.pause()
        })
        ipcMain.handle('control:playerPlay', () => {
            AppProcessController.play()
        })
        ipcMain.handle('control:playerNext', () => {
            AppProcessController.next()
        })
        ipcMain.handle('control:playerPrevious', () => {
            AppProcessController.previous()
        })
        ipcMain.handle('control:playerToggle', () => {
            AppProcessController.togglePlay()
        })
        ipcMain.handle('control:playerSeek', (_, time: number) => {
            AppProcessController.seek(time)
        })
        ipcMain.handle('control:playerSetVolume', (_, volume: number) => {
            AppProcessController.setVolume(volume)
        })
        ipcMain.handle('control:playMode', (_, mode: AppTypes.PlayMode) => {
            AppProcessController.setPlayMode(mode)
        })
        ipcMain.handle('control:playModeSwitch', () => {
            AppProcessController.switchPlayMode()
        })
        ipcMain.handle('control:playerPlayTrack', (_, track: AppTypes.ITrackId) => {
            AppProcessController.playTrack(track)
        })
    }
}