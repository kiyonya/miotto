import { ipcMain } from "electron";
import { createPluginProject, runPluginProject } from "../plugin";
import { defaultDataTransEmitter } from "../trans_emitter";
import { windowManager } from "../window";
import { AppTypes } from "../../types/app";

export function pluginIPC() {

    const audioEvents: (keyof AppTypes.DefaultTransData)[] = ['audioCanplay', 'audioDuration', 'audioEnd', 'audioMute', 'audioPause', 'audioPlay', 'audioPlaystateUpdate', 'audioSeek', 'audioTimeUpdate', 'audioUserRequestPause', 'audioUserRequestPlay', 'audioVolumeChange']

    const playerEvents: (keyof AppTypes.DefaultTransData)[] = ['playerNextSong', 'playerPlaySong', 'playerPlaylistUpdate', 'playerPlaymodeUpdate', 'playerPreviousSong', 'playingLyricUpdate', 'playingSongUpdate', 'playingTrackIdUpdate', 'playingTrackUpdate','appThemeUpdate','appRenderMount','appRenderReady']

    ipcMain.handle('plugin:createPluginProject', async (_, projectDir: string, projectName: string, dp: number) => {
        await createPluginProject(projectDir, projectName, dp)
    })

    ipcMain.handle('plugin:runPluginProject', async (_, manifest: string, devMode: boolean = false) => {
        await runPluginProject(manifest, devMode)
    })

    ipcMain.handle('plugin:getAllData',<T extends keyof AppTypes.DefaultTransData>(_)=>{
        const data:Record<T,AppTypes.DefaultTransData[T]> = {} as any
        for(const key of [...audioEvents,...playerEvents]){
            const stv = defaultDataTransEmitter.get(key)
            if(stv){
                data[key] = stv
            }
        }
        return data
    })

    ipcMain.handle('plugin:getData',<T extends keyof AppTypes.DefaultTransData>(_,key:T)=>{
        return defaultDataTransEmitter.get(key)
    })

    audioEvents.forEach(eventName => {
        defaultDataTransEmitter.on(eventName, (...args: any[]) => {
            windowManager.getGroupWindows('plugin').forEach(win => {
                win.webContents.send(`ev:${eventName}`, ...args)
            })
        })
    })

    playerEvents.forEach(eventName => {
        defaultDataTransEmitter.on(eventName, (...args: any[]) => {
            windowManager.getGroupWindows('plugin').forEach(win => {
                win.webContents.send(`ev:${eventName}`, ...args)
            })
        })
    })

}