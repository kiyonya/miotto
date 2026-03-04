import { ipcMain } from 'electron'
import { AppTypes } from '../../types/app'
import LocalMusic from '../utils/local-music'
export function localAPI() {

    ipcMain.handle('localapi:readAudioFile', async (_, filePath: string): Promise<AppTypes.ILocalSong> => {
        return LocalMusic.readAudioFileAsSong(filePath)
    })

    ipcMain.handle('localapi:batchGetLocalSong', async (_, filePathes: string[]): Promise<AppTypes.ILocalSong[]> => {
        return LocalMusic.batchMatchAudioFile(filePathes)
    })

    ipcMain.handle('localapi:getLocalTrack', async (_, filePath: string): Promise<AppTypes.ISongTrack> => {
        return LocalMusic.readAudioFileAsTrack(filePath)
    })

}