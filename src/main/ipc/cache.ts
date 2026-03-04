import { ipcMain } from "electron";
import { AppTypes } from "../../types/app";
import CacheControl from "../utils/cache";

export function CacheIPC() {

    ipcMain.handle('cacheapi:cacheAudioTrack',(_,key:string,track:AppTypes.ISongTrack)=>{return CacheControl.cacheAudioTrack(key,track)})
    
    ipcMain.handle('cacheapi:getCacheDir',()=>{return CacheControl.getCachePath()})

    ipcMain.handle('cacheapi:clearCache',()=>{return CacheControl.clearCache()})

    ipcMain.handle('cacheapi:getAudioTrack',(_,key:string)=>{return CacheControl.getAudioTrack(key)})

    ipcMain.handle('cacheapi:cacheLyric',(_,key:string,lyric:AppTypes.ILyric)=>{return CacheControl.cacheLyric(key,lyric)})

    ipcMain.handle('cacheapi:getLyric',(_,key:string)=>{return CacheControl.getLyric(key)})
}