import { app, BrowserWindow, dialog, ipcMain } from "electron";
import fse from "fs-extra"

export function appIpc(mainWindow: BrowserWindow) {
    ipcMain.handle('app:showOpenDialog', async (_, options?: Electron.OpenDialogOptions) => {
        const data = await dialog.showOpenDialog(mainWindow, options || {})
        return data
    })

    ipcMain.handle('app:showSaveDialog', async (__, options?: Electron.SaveDialogOptions) => {
        const data = await dialog.showSaveDialog(options || {})
        return data
    })

    ipcMain.handle('app:writeFile', async (_, filePath: string, data: string | NodeJS.ArrayBufferView | ArrayBuffer, options?:{encoding?: BufferEncoding ;mode?: number;flag?: string;}) => {
        try {
            if(data instanceof ArrayBuffer){
                data = Buffer.from(data)
            }
            await fse.writeFile(filePath, data, options);
            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : '写入文件失败'
            };
        }
    });
    ipcMain.handle('app:close', () => {
        mainWindow.close()
        app.quit()
    })

    ipcMain.handle('app:minimize', () => {
        if (mainWindow.isMinimized()) {
            mainWindow.restore()
        }
        else {
            mainWindow.minimize()
        }
    })

    ipcMain.handle('app:maximize', () => {
        if (mainWindow.isMaximized()) {
            mainWindow.restore()
        }
        else {
            mainWindow.maximize()
        }
    })
}