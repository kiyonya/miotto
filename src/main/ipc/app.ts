import { app, BrowserWindow, dialog, ipcMain} from "electron";

export function appIpc(mainWindow:BrowserWindow){
    ipcMain.handle('app:showOpenDialog',async (_,options?:Electron.OpenDialogOptions)=>{
        const data = await dialog.showOpenDialog(mainWindow,options || {})
        return data
    })

    ipcMain.handle('app:close',()=>{
        mainWindow.close()
        app.quit()
    })

    ipcMain.handle('app:minimize',()=>{
        if(mainWindow.isMinimized()){
            mainWindow.restore()
        }
        else{
            mainWindow.minimize()
        }
    })

    ipcMain.handle('app:maximize',()=>{
        if(mainWindow.isMaximized()){
            mainWindow.restore()
        }
        else{
            mainWindow.maximize()
        }
    })
}