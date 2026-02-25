import { ipcMain } from "electron";
import { AppTypes } from "../../types/app";
import { defaultDataTransEmitter } from "../trans_emitter";

export function DataTransport() {
    const dataEmitter = defaultDataTransEmitter

    ipcMain.handle('trans:set',async <K extends keyof AppTypes.DefaultTransData> (_,key:K,value:AppTypes.DefaultTransData[K],emit:boolean = true):Promise<void>=>{
        dataEmitter.set(key,value,emit)
    })

    ipcMain.handle('trans:get',async <K extends keyof AppTypes.DefaultTransData>(_,key:K):Promise<AppTypes.DefaultTransData[K] | undefined>=>{
        return dataEmitter.get(key)
    })

    ipcMain.handle('trans:update',async <K extends keyof AppTypes.DefaultTransData>(_,key:K,newVal:AppTypes.DefaultTransData[K])=>{
        dataEmitter.update(key,newVal)
    })

    ipcMain.handle('trans:delete',async <K extends keyof AppTypes.DefaultTransData>(_,key:K)=>{
        dataEmitter.delete(key)
    })

    ipcMain.handle('trans:toEmit',async <K extends keyof AppTypes.DefaultTransData> (_,key:K,value:AppTypes.DefaultTransData[K]):Promise<void>=>{
        dataEmitter.toEmit(key,value)
    })
}