import { ipcMain } from "electron";
import { userPlaylistDatabase } from "../sql/user-playlist";
import { AppTypes } from "../../types/app";

interface DBPlaylistDTO {
    playlistName: string,
    cover?: string,
    isStar?: boolean,
    description?: string
}
export function databaseIPC() {
    ipcMain.handle('db::uplaylist:createPlaylist', (_, playlistDTO: DBPlaylistDTO) => {
        const id = userPlaylistDatabase.createPlaylist(playlistDTO)
        return id
    })
    ipcMain.handle('db::playlist:getPlaylist', (_, playlistId: string) => {
        return userPlaylistDatabase.getPlaylist(playlistId)
    })
    ipcMain.handle('db:uplaylist:getAllPlaylists', () => {
        return userPlaylistDatabase.getAllPlaylists()
    })
    ipcMain.handle('db::uplaylist:getAllPlaylistAsBrief', () => {
        return userPlaylistDatabase.getAllPlaylistBrief()
    })
    ipcMain.handle('db::uplaylist:addSongToPlaylist', (_, playlistId: string, song: AppTypes.ISong) => {
        return userPlaylistDatabase.addSongToPlaylist(playlistId, song)
    })
    ipcMain.handle('db::uplaylist:removeSongFromPlaylist', (_, playlistId: string, id: string | number, platform: AppTypes.AllPlatform) => {
        return userPlaylistDatabase.deleteSongFromPlaylist(playlistId, String(id), platform)
    })
    ipcMain.handle('db::uplaylist:getSong', (_, songId: number | string) => {
        return userPlaylistDatabase.getSongById(String(songId))
    })
    ipcMain.handle('db::uplaylist:updatePlaylist', (_, playlistId: string, updateData: Partial<DBPlaylistDTO>) => {
        return userPlaylistDatabase.updatePlaylist(playlistId, updateData)
    })
    ipcMain.handle('db::uplaylist:deletePlaylist', (_, playlistId: string) => {
        return userPlaylistDatabase.deletePlaylist(playlistId)
    })
    ipcMain.handle('db::uplaylist:getPlaylistTracks', async (_, playlistId: string) => {
        const tracks = userPlaylistDatabase.getPlaylistTracks(playlistId)
        return tracks
    })
    ipcMain.handle('db::uplaylist:getSongsByIds', async (_, songIds: (string | number)[]) => {
        const songs = await userPlaylistDatabase.getSongsByIds(songIds.map(String))
        return songs
    })

}