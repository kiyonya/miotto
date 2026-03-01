import { ipcMain } from "electron";
import { configStore } from "../config";
import { OSCProtocalService } from "../osc/osc";

export function OSCIPC (){

    const oscService = new OSCProtocalService()
    if(configStore.get('enableOSC')){
        console.log('OSC服务已允许')
        oscService.startOSC()
    }

    ipcMain.handle('osc:enableOSC',async ()=>{
        configStore.set('enableOSC',true)
        await oscService.startOSC()
    })

    ipcMain.handle('osc:disableOSC',async ()=>{
        configStore.set('enableOSC',false)
        await oscService.closeOSC()
    })

    ipcMain.handle('osc:isOSCEnable',()=>{
        return oscService.isOSCEnable
    })
}