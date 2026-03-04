import { song2TrackId } from "@renderer/utils/quickplay";
import Dexie from "dexie";
import { AppTypes } from "src/types/app";
import { v1 } from 'uuid'

export interface ISongEntry {
    id: number | string,
    name: string,
    type: 'ncm' | 'bili' | 'local',
    artists: AppTypes.IArtistBrief[],
    album: AppTypes.IAlbumBrief,
    cover: string | null,
    duration: number,
    localPath: string | null,
    bilicid: number | null,
    ncmMatchId: number | null
    mv: number | null,
    ncmCover:string | null
}

export class CustomPlaylistDatabase {
    private db: Dexie
    constructor() {
        this.db = new Dexie('custom_playlist')
        this.db.version(1).stores({
            playlists: `id,song,cover,name,createTime,updateTime,trackCount,description,tracks,type,isCoverSet`,
            songs: `id,name,type,artists,album,cover,duration,localPath,bilicid,ncmMatchId,mv,ncmCover`
        })
    }
    public async createPlaylist(playlistName: string): Promise<string> {
        const playlistId = v1()
        await this.db.table('playlists').add({
            id: playlistId,
            name: playlistName,
            cover: '',
            createTime: Date.now(),
            updateTime: Date.now(),
            trackCount: 0,
            description: '',
            tracks: [],
            type: 'custom',
            isCoverSet: false,
        })
        return playlistId
    }
    public async getPlaylist(playlistId: string): Promise<AppTypes.IPlaylist> {
        const data = await this.db.table('playlists').get(playlistId)
        const iplaylist: AppTypes.IPlaylist = {
            name: data.name,
            id: data.id,
            cover: data.cover,
            createTime: data.createTime,
            updateTime: data.updateTime,
            trackCount: data.trackCount,
            description: data.description,
            tracks: data.tracks?.reverse() || [],
            type: data.type || 'custom',
            playCount: 0,
            subscribed: false
        }
        return iplaylist
    }
    public async getAllPlaylists(): Promise<AppTypes.IPlaylist[]> {
        const data = await this.db.table('playlists').toArray()
        return data.map((item) => ({
            name: item.name,
            id: item.id,
            cover: item.cover,
            createTime: item.createTime,
            updateTime: item.updateTime,
            trackCount: item.trackCount,
            description: item.description,
            tracks: item.tracks || [],
            type: item.type || 'custom',
            playCount: 0,
            subscribed: false
        }))
    }
    public async getAllPlaylistAsBrief(): Promise<AppTypes.IPlaylistBrief[]> {
        const data = await this.db.table('playlists').toArray()
        const playlistBriefs: AppTypes.IPlaylistBrief[] = []
        for (const playlist of data) {
            const ip: AppTypes.IPlaylistBrief = {
                name: playlist.name,
                id: playlist.id,
                cover: playlist.cover,
                trackCount: playlist.trackCount,
                type: playlist.type || 'custom',
            }
            playlistBriefs.push(ip)
        }
        return playlistBriefs
    }

    public async addSongToPlaylist(playlistId: string, song: AppTypes.ISong): Promise<void> {
        const playlist = await this.db.table('playlists').get(playlistId)
        if (!playlist) {
            throw new Error('Playlist not found')
        }
        const trackId = song2TrackId(song)
        if (playlist.tracks?.some(i => i.id === trackId.id)) {
            console.warn('Song already in playlist')
            return
        }
        playlist.tracks.push(trackId)
        playlist.updateTime = Date.now()
        playlist.trackCount = playlist.tracks.length

        if (!playlist.isCoverSet) {
            if (song.type === 'local') {
                if(song.cover){
                    playlist.cover = song.cover
                }
                else if(song.ncmCover){
                    playlist.cover = song.ncmCover
                }
            }
            else if(song.cover) {
                playlist.cover = song.cover
            }
        }
        await this.db.table('playlists').put(playlist)
        const existingSong = await this.db.table('songs').get(song.id)
        if (!existingSong) {
            const transformedSong = this.transSong2Entry(song)
            await this.db.table('songs').add(transformedSong)
        }
    }

    private transSong2Entry(song: AppTypes.ISong): ISongEntry {
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
                ncmCover:song.ncmCover,
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
                ncmCover:null,
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
                ncmCover:song.cover,
                duration: song.duration,
                localPath: null,
            }
            return JSON.parse(JSON.stringify(entry))
        }
        else throw new Error()
    }

    private transEntry2Song(entry: ISongEntry): AppTypes.ISong {
        if (entry.type === 'local') {
            const song: AppTypes.ILocalSong = {
                name: entry.name,
                album: entry.album,
                artists: entry.artists,
                cover: entry.cover,
                ncmMatchId: entry.ncmMatchId,
                id: String(entry.id),
                type: 'local',
                ncmCover:entry.ncmCover,
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


    public async removeSongFromPlaylist(playlistId: string, songId: number | string): Promise<void> {
        const playlist = await this.db.table('playlists').get(playlistId)
        if (!playlist) {
            throw new Error('Playlist not found')
        }
        playlist.tracks = playlist.tracks.filter((id: number | string) => id !== songId)
        playlist.updateTime = Date.now()
        playlist.trackCount = playlist.tracks.length
        await this.db.table('playlists').put(playlist)
    }

    public async getSong(songId: number | string): Promise<AppTypes.ISong | null> {
        const songEntry = await this.db.table('songs').get(songId)
        if (!songEntry) {
            return null
        }
        return this.transEntry2Song(songEntry)
    }

    public async getEntry(songId: number | string): Promise<ISongEntry | null> {
        const songEntry = await this.db.table('songs').get(songId)
        if (!songEntry) {
            return null
        }
        return songEntry
    }
}
