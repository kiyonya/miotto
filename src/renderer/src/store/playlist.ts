import { CustomPlaylistDatabase, ISongEntry } from "@renderer/database/playlist";
import { uniq, uniqBy } from "lodash";
import pLimit from "p-limit";
import { defineStore } from "pinia";
import { AppTypes } from "src/types/app";

interface PlaylistState {
    playlists: AppTypes.IPlaylistBrief[],
    db: CustomPlaylistDatabase
}

const usePlaylistStore = defineStore('playlist', {
    state: (): PlaylistState => ({
        playlists: [],
        db: new CustomPlaylistDatabase()
    }),
    actions: {
        async createPlaylist(playlistName: string) {
            const playlistId = await this.db.createPlaylist(playlistName)
            this.playlists = await this.db.getAllPlaylistAsBrief()
            return playlistId
        },
        async importLocalMusicToPlaylist(playlistId: string, filePath: string | string[]) {
            const files = Array.isArray(filePath) ? filePath : [filePath]
            const localSongs: AppTypes.ILocalSong[] = await window.localapi.batchGetLocalSong(files)
            for (const song of localSongs) {
                await this.db.addSongToPlaylist(playlistId, song)
            }
            this.playlists = await this.db.getAllPlaylistAsBrief()
        },
        async importBiliMusicToPlaylist(playlistId: string, biliSong: AppTypes.IBiliSong | AppTypes.IBiliSong[]) {
            const songs = Array.isArray(biliSong) ? biliSong : [biliSong]
            for (const song of songs) {
                await this.db.addSongToPlaylist(playlistId, song)
            }
            this.playlists = await this.db.getAllPlaylistAsBrief()
        },
        async getSong(songId: number | string): Promise<AppTypes.ISong> {
            const song = await this.db.getSong(songId) as AppTypes.ILocalSong
            if (!song) {
                throw new Error('无法获取歌曲')
            }
            if (!song.cover && song.ncmCover) {
                song.cover = song.ncmCover
            }
            return song
        },
        async getPlaylist(playlistId: string): Promise<AppTypes.IPlaylist> {
            return await this.db.getPlaylist(playlistId)
        },
        async addSongToPlaylist(playlistId: string, song: AppTypes.ISong) {
            await this.db.addSongToPlaylist(playlistId, song)
            this.playlists = await this.db.getAllPlaylistAsBrief()
        },
        async init() {
            this.playlists = await this.db.getAllPlaylistAsBrief()
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
                    const entry = await this.db.getEntry(track.id)
                    if (entry && entry.type === track.platform) {
                        dataMap.set(entry.id, this._transEntry2Song(entry))
                        if (entry.ncmMatchId && matchLocal) {
                            const localId = entry.id as string
                            localNeedRequestMatchIds.set(entry.ncmMatchId, localId)
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
        },
        _transSong2Entry(song: AppTypes.ISong): ISongEntry {
            if (song.type === 'local') {
                const entry: ISongEntry = {
                    name: song.name,
                    album: song.album,
                    artists: song.artists,
                    cover: song.cover,
                    mv: null,
                    ncmMatchId: song.ncmMatchId,
                    bilicid: null,
                    id: song.id,
                    type: 'local',
                    ncmCover: song.ncmCover,
                    duration: song.duration,
                    localPath: song.localPath
                }
                return JSON.parse(JSON.stringify(entry))
            }
            else if (song.type === 'bili') {
                const entry: ISongEntry = {
                    name: song.name,
                    album: song.album,
                    artists: song.artists,
                    cover: song.cover,
                    mv: null,
                    ncmMatchId: null,
                    bilicid: song.bilicid,
                    id: song.id,
                    type: 'bili',
                    ncmCover: null,
                    duration: song.duration,
                    localPath: null,
                }
                return JSON.parse(JSON.stringify(entry))
            }
            else if (song.type === 'ncm') {
                const entry: ISongEntry = {
                    name: song.name,
                    album: song.album,
                    artists: song.artists,
                    cover: song.cover,
                    mv: null,
                    ncmMatchId: null,
                    bilicid: null,
                    id: song.id,
                    type: 'ncm',
                    ncmCover: song.cover,
                    duration: song.duration,
                    localPath: null,
                }
                return JSON.parse(JSON.stringify(entry))
            }
            else throw new Error()
        },
        _transEntry2Song(entry: ISongEntry): AppTypes.ISong {
            if (entry.type === 'local') {
                const song: AppTypes.ILocalSong = {
                    name: entry.name,
                    album: entry.album,
                    artists: entry.artists,
                    cover: entry.cover,
                    ncmMatchId: entry.ncmMatchId,
                    id: String(entry.id),
                    type: 'local',
                    ncmCover: entry.ncmCover,
                    duration: entry.duration,
                    localPath: entry.localPath as string
                }
                return song
            }
            else if (entry.type === 'bili') {
                const song: AppTypes.IBiliSong = {
                    name: entry.name,
                    album: entry.album,
                    artists: entry.artists,
                    cover: entry.cover as string,
                    bilicid: entry.bilicid as number,
                    id: entry.id as string,
                    type: 'bili',
                    duration: entry.duration,
                    mv: entry.mv
                }
                return song
            }
            else if (entry.type === 'ncm') {
                const song: AppTypes.INCMSong = {
                    name: entry.name,
                    album: entry.album,
                    artists: entry.artists,
                    cover: entry.cover as string,
                    id: entry.id as number,
                    type: 'ncm',
                    duration: entry.duration,
                    mv: entry.mv
                }
                return song
            }
            else throw new Error()
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