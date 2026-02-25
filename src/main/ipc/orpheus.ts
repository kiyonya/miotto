import { ipcMain } from "electron";
import { shell } from "electron";

function string2b64(str:string){
    return Buffer.from(str).toString('base64')
}

export function ncmOrpheus(){
    ipcMain.handle('orpheus:playSong',async (_,id:number)=>{
        const cmd = {type:'song',id:String(id),cmd:'play'}
        const orpheus = string2b64(JSON.stringify(cmd))
        const url = `orpheus://${orpheus}`
        await shell.openExternal(url)
    })
    ipcMain.handle('orpheus:playPlaylist',async (_,id:number)=>{
        const cmd = {type:'playlist',id:String(id),cmd:'play'}
        const orpheus = string2b64(JSON.stringify(cmd))
        const url = `orpheus://${orpheus}`
        await shell.openExternal(url)
    })
}