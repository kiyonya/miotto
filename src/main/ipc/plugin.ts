import { ipcMain } from "electron";
import { createPluginProject, runPluginProject } from "../plugin";
import { defaultDataEmitter } from "../utils/transport";
import { AppEvents } from "../../types/event";
import { windowManager } from "../utils/window";

const pluginAvailbleEvents: (keyof AppEvents.Events)[] = ['audioCanplay', 'audioDuration', 'audioEnd', 'audioMute', 'audioPause', 'audioPlay', 'audioPlaystateUpdate', 'audioSeek', 'audioTimeUpdate', 'audioUserRequestPause', 'audioUserRequestPlay', 'audioVolumeChange', 'playerNextSong', 'playerPlaySong', 'playerPlaylistUpdate', 'playerPlaymodeUpdate', 'playerPreviousSong', 'playingLyricUpdate', 'playingSongUpdate', 'playingTrackIdUpdate', 'playingTrackUpdate', 'appThemeUpdate', 'appRenderMount', 'appRenderReady']


export function pluginIPC() {

    ipcMain.handle('plugin:createPluginProject', async (_, projectDir: string, projectName: string, dp: number) => {
        await createPluginProject(projectDir, projectName, dp)
    })

    ipcMain.handle('plugin:runPluginProject', async (_, manifest: string, devMode: boolean = false) => {
        const {window,winId} = await runPluginProject(manifest, devMode)
        console.log(winId)
        pluginAvailbleEvents.forEach((eventName: string) => {
            defaultDataEmitter.group(winId).on(eventName, (...args: any[]) => {
                window.webContents.send(`event:${eventName}`, ...args)
            })
        })
        window.on('close', () => {
            defaultDataEmitter.group(winId).removeAllListeners()
        })
    })

    ipcMain.handle('plugin:repostWinEvents', (_, winId:string) => {
        defaultDataEmitter.group(winId).rePostGroupEvents()
        console.log("重新发送给Group",winId)
    })

    ipcMain.handle('plugin:getWinInfo',(_,winId:string)=>{
        const win = windowManager.getWindow(winId)
        if(!win){throw new Error(`No Win With Id:${winId}`)}

        const info:{
            bounds:Electron.Rectangle,
            contentBounds:Electron.Rectangle,
            zoom:number,
            hwnd:Buffer<ArrayBufferLike>,
            title:string,
            id:number
        } = {
           bounds:win.getBounds(),
           contentBounds:win.getContentBounds(),
           zoom:win.webContents.zoomFactor,
           hwnd:win.getNativeWindowHandle(),
           id:win.id,
           title:win.getTitle()
        }

        return info
    })
}