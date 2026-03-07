import { ipcMain } from "electron"
import { windowManager } from "../utils/window"
import { IPCMainRepostControls } from "../../types/data"

export function controlIPC() {

    const mainWindow = windowManager.getWindow('main')
    if (mainWindow) {

        for (const ctl of IPCMainRepostControls) {
            ipcMain.handle(`ctl:${ctl}`, (_, ...args: any[]) => {
                mainWindow.webContents.send(`ctl:${ctl}`, ...args)
            })
        }

    }
}