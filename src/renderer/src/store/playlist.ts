import { flip, uniq, uniqBy } from "lodash";
import pLimit from "p-limit";
import { defineStore } from "pinia";
import { AppTypes } from "src/types/app";

interface PlaylistState {
    playlists: AppTypes.IPlaylistBrief[]
}

interface DBPlaylistDTO {
    playlistName: string,
    cover?: string,
    isStar?: boolean,
    description?: string
}

const usePlaylistStore = defineStore('playlist', {
    state: (): PlaylistState => ({
        playlists: []
    }),
    actions: {
        async flushPlaylists() {
            this.playlists = await window.electron.ipcRenderer.invoke('db::uplaylist:getAllPlaylistAsBrief')
        },
        async createPlaylist(createPlaylistDTO: DBPlaylistDTO) {
            const playlistId = await window.electron.ipcRenderer.invoke('db::uplaylist:createPlaylist', createPlaylistDTO)
            await this.flushPlaylists()
            return playlistId
        },
        async importLocalMusicToPlaylist(playlistId: string, filePath: string | string[]) {
            const files = Array.isArray(filePath) ? filePath : [filePath]
            const localSongs: AppTypes.ILocalSong[] = await window.localapi.batchGetLocalSong(files)
            for (const song of localSongs) {
                await window.electron.ipcRenderer.invoke('db::uplaylist:addSongToPlaylist', playlistId, song)
            }
            await this.flushPlaylists()
        },
        async importBiliMusicToPlaylist(playlistId: string, biliSong: AppTypes.IBiliSong | AppTypes.IBiliSong[]) {
            const songs = Array.isArray(biliSong) ? biliSong : [biliSong]
            for (const song of songs) {
                await window.electron.ipcRenderer.invoke('db::uplaylist:addSongToPlaylist', playlistId, JSON.parse(JSON.stringify(song)))
            }
            await this.flushPlaylists()
        },
        async getSong(songId: number | string): Promise<AppTypes.ISong> {
            const song = await window.electron.ipcRenderer.invoke('db::uplaylist:getSong', songId)
            if (!song) {
                throw new Error('无法获取歌曲')
            }
            if (!song.cover && song.ncmCover) {
                song.cover = song.ncmCover
            }
            return song
        },
        async getPlaylist(playlistId: string): Promise<AppTypes.IPlaylist> {
            return await window.electron.ipcRenderer.invoke('db::playlist:getPlaylist', playlistId)
        },
        async addSongToPlaylist(playlistId: string, song: AppTypes.ISong) {
            await window.electron.ipcRenderer.invoke('db::uplaylist:addSongToPlaylist', playlistId, song)
            await this.flushPlaylists()
        },
        async init() {
            await this.flushPlaylists()
        },
        async mapTrackIdsToSongs(tracks: AppTypes.ITrackId[], batchSize: number = 500, matchLocal = true): Promise<AppTypes.ISong[]> {
            tracks = uniqBy(tracks, 'id')
            const ids = tracks.map(i => i.id)
            const dataMap = new Map<string | number, AppTypes.ISong>()
            const ncmNeedRequestIds = new Set<number>()
            const localNeedRequestMatchIds = new Map<number, string>()
            for (const track of tracks) {
                if (track.platform === 'bili') {
                    const song = await this.getSong(track.id)
                    if (song) {
                        dataMap.set(track.id, song)
                    }
                }
                else if (track.platform === 'ncm') {
                    ncmNeedRequestIds.add(track.id)
                }
                else if (track.platform === 'local') {
                    const localSong = await this.getSong(track.id) as AppTypes.ILocalSong
                    if (localSong && localSong.type === 'local') {
                        dataMap.set(track.id, localSong)
                        if (localSong.ncmMatchId && matchLocal) {
                            const localId = track.id as string
                            localNeedRequestMatchIds.set(localSong.ncmMatchId, localId)
                        }
                    }
                }
            }

            const ncmRequestIds = [...ncmNeedRequestIds.values(), ...localNeedRequestMatchIds.keys()]
            const requestIds: number[] = uniq(ncmRequestIds)

            if (requestIds.length) {
                const songs = await this._batchGetNcmSong(requestIds, batchSize)
                const songMap = new Map<number, AppTypes.INCMSong>()
                for (const song of songs) {
                    songMap.set(song.id, song)
                }
                for (const ncmId of ncmNeedRequestIds) {
                    if (songMap.has(ncmId)) {
                        dataMap.set(ncmId, songMap.get(ncmId) as AppTypes.INCMSong)
                    }
                }
                for (const [matchId, localId] of localNeedRequestMatchIds.entries()) {
                    const localSong = dataMap.get(localId) as AppTypes.ILocalSong
                    const matchedLocalSong = songMap.get(matchId)
                    if (localSong && matchedLocalSong) {
                        localSong.album = matchedLocalSong.album,
                            localSong.artists = matchedLocalSong.artists,
                            localSong.ncmMatchId = matchedLocalSong.id,
                            localSong.cover = matchedLocalSong.cover,
                            localSong.name = matchedLocalSong.name,
                            localSong.tns = matchedLocalSong.tns
                        dataMap.set(localId, localSong)
                    }
                }
            }

            const results: AppTypes.ISong[] = []
            for (const id of ids) {
                const song = dataMap.get(id)
                song && results.push(song)
            }
            return results
        },
        song2TrackId(song: AppTypes.ISong): AppTypes.ITrackId {
            const platform = song.type
            if (platform === 'ncm') {
                return {
                    id: Number(song.id),
                    platform
                }
            }
            else if (platform === 'bili') {
                return {
                    id: String(song.id),
                    platform
                }
            }
            else if (platform === 'local') {
                return {
                    id: String(song.id),
                    platform,
                    file: song.localPath
                }
            }
            else {
                throw new Error('unsp')
            }
        },
        injectNcmDetailToLocalMusic(localSong: AppTypes.ILocalSong, ncmSong: AppTypes.INCMSong) {
            localSong.artists = ncmSong.artists,
                localSong.ncmMatchId = ncmSong.id,
                localSong.cover = ncmSong.cover,
                localSong.name = ncmSong.name,
                localSong.tns = ncmSong.tns
            return localSong
        },
        async _batchGetNcmSong(ncmids: number[], batchSize = 500): Promise<AppTypes.INCMSong[]> {
            const loadBatch = (ids: number[]) => window.ncmapi.songDetail(ids, true)
            const limit = pLimit(1)
            const batchPromise: Promise<AppTypes.INCMSong[]>[] = []
            for (let i = 0; i < ncmids.length; i += batchSize) {
                const ids = ncmids.slice(i, i + batchSize)
                batchPromise.push(limit(() => loadBatch(ids)))
            }
            const songs = (await Promise.all(batchPromise)).flat(1)
            return songs
        }
    },
    persist: {
        afterHydrate: () => {
            const store = usePlaylistStore()
            store.init()
        }
    }
})

export { usePlaylistStore }