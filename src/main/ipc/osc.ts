import { BrowserWindow, ipcMain } from "electron";
import { disableOSC, enableOSC } from "../osc/oscserver";
import { configStore } from "../config";

export function OSCIPC (mainWindow:BrowserWindow){

    if(configStore.get('enableOSC')){
        console.log('OSC服务已允许')
        enableOSC(mainWindow)
    }

    ipcMain.handle('osc:enableOSC',()=>{
        configStore.set('enableOSC',true)
        enableOSC(mainWindow)
    })

    ipcMain.handle('osc:disableOSC',()=>{
        configStore.set('enableOSC',false)
        disableOSC()
    })

    ipcMain.handle('osc:isOSCEnable',()=>{
        return configStore.get('enableOSC')
    })
}