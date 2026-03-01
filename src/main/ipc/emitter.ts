import { ipcMain } from "electron";
import { AppTypes } from "../../types/app";
import { defaultDataEmitter } from "../utils/transport";

type RestArray<I> = I extends any[] ? I : [I]

export function DataTransport() {

    ipcMain.handle('emitter:post', <K extends keyof AppTypes.AppEvents>(_, key: K, ...args: RestArray<AppTypes.AppEvents[K]>) => {
        defaultDataEmitter.post(key, ...args)
    })
    ipcMain.handle('emitter:set', <K extends keyof AppTypes.AppEvents>(_, key: K, ...args: RestArray<AppTypes.AppEvents[K]>) => {
        defaultDataEmitter.set(key, ...args)
    })
    ipcMain.handle('emitter:get', <K extends keyof AppTypes.AppEvents>(_, key: K) => {
        return defaultDataEmitter.get(key)
    })
    ipcMain.handle('emitter:setPost', <K extends keyof AppTypes.AppEvents>(_, key: K, ...args: RestArray<AppTypes.AppEvents[K]>) => {
        defaultDataEmitter.setPost(key, ...args)
    })
    ipcMain.handle('emitter:delete', <K extends keyof AppTypes.AppEvents>(_, key: K) => {
        return defaultDataEmitter.delete(key)
    })
    ipcMain.handle('emitter:postToGroup', <K extends keyof AppTypes.AppEvents>(_, groupId: string, key: K, ...args: RestArray<AppTypes.AppEvents[K]>) => {
        defaultDataEmitter.postToGroup(groupId, key, ...args)
    })
    ipcMain.handle('emitter:setPostToGroup', <K extends keyof AppTypes.AppEvents>(_, groupId: string, key: K, ...args: RestArray<AppTypes.AppEvents[K]>) => {
        defaultDataEmitter.setPostToGroup(groupId, key, ...args)
    })
    ipcMain.handle('emitter:repostAllEvent', () => defaultDataEmitter.rePostAllEvents())
    ipcMain.handle('emitter:repostGroupEvent', (_, groupId: string) => defaultDataEmitter.group(groupId).rePostGroupEvents())
    
}