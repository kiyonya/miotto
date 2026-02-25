import { desktopCapturer, ipcMain } from "electron";

export function MediaIpc(){
    
    ipcMain.handle('media:desktopCapture',async (_,config:Electron.SourcesOptions):Promise<Electron.DesktopCapturerSource[]>=>{
        return await desktopCapturer.getSources(config)
    })
}