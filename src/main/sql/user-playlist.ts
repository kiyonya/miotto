import { app } from "electron";
import SqliteDatabase from "./sqlite";
import path from "node:path";
import { AppTypes } from "../../types/app";

type IUserPlaylistDatabaseTables = ['playlists', 'playlistTracks', 'songs', 'idx_playlistTracks_playlistId', 'idx_playlist_tracks_lookup']
type IUserPlaylistDatabseStmts = ['createPlaylist', 'getPlaylist', 'getPlaylistTrack', 'getAllPlaylist', 'addSong', 'addTrackRef', 'updatePlaylist', 'deleteTrackRef', 'getSong', 'deletePlaylist', 'setPlaylistCover', 'isTrackInPlaylist', 'getPlaylistLastTrackWithCover']

namespace DBDTO {
    export interface CreatePlaylistOptions {
        playlistName: string,
        cover?: string,
        isStar?: boolean,
        description?: string
    }
    export interface PlaylistEntry {
        id: string,
        cover: string,
        name: string,
        createTime: number,
        updateTime: number,
        description: string,
        type: 'custom',
        isCoverSet: number,
        trackCount: number
        isStar: number
    }
    export interface TrackEntry {
        id: string,
        platform: string,
        file: string,
        playlistId: string
    }
    export interface SongEntry {
        id: string,
        name: string,
        type: 'ncm' | 'bili' | 'local',
        artists: string,
        album: string,
        cover: string | null,
        duration: number,
        localPath: string | null,
        bilicid: number | null,
        ncmMatchId: number | null
        mv: number | null,
        ncmCover: string | null
    }
}

export class UserPlaylistDatabase extends SqliteDatabase<IUserPlaylistDatabaseTables, IUserPlaylistDatabseStmts> {
    constructor() {
        const appData = app.getPath('userData')
        super(path.join(appData, 'Database', 'UserPlaylist.db'), {
            tables: {
                playlists: `CREATE TABLE IF NOT EXISTS playlists (
                    id TEXT PRIMARY KEY,
                    cover TEXT DEFAULT '',
                    name TEXT NOT NULL,
                    createTime INTEGER DEFAULT (strftime('%s', 'now')),
                    updateTime INTEGER DEFAULT (strftime('%s', 'now')),
                    trackCount INTEGER DEFAULT 0,
                    description TEXT DEFAULT '',
                    type TEXT,
                    isCoverSet INTEGER DEFAULT 0,
                    isStar INTEGER DEFAULT 0
                    );`,
                playlistTracks: `CREATE TABLE IF NOT EXISTS playlistTracks (
                    seq INTEGER PRIMARY KEY AUTOINCREMENT,
                    id TEXT NOT NULL,
                    platform TEXT NOT NULL,
                    file TEXT DEFAULT NULL,
                    playlistId TEXT NOT NULL,
                    UNIQUE(playlistId, id)
                    );`,
                songs: `CREATE TABLE IF NOT EXISTS songs (
                    id TEXT PRIMARY KEY NOT NULL,  
                    name TEXT NOT NULL,    
                    type TEXT NOT NULL,            
                    artists TEXT,         
                    album TEXT,           
                    cover TEXT,           
                    duration INTEGER,     
                    localPath TEXT,       
                    bilicid INTEGER,         
                    ncmMatchId INTEGER,      
                    mv INTEGER,              
                    ncmCover TEXT,
                    UNIQUE(id)
                );`,
                idx_playlistTracks_playlistId: `CREATE INDEX IF NOT EXISTS idx_playlistTracks_playlistId ON playlistTracks(playlistId);`,
                idx_playlist_tracks_lookup: 'CREATE INDEX IF NOT EXISTS idx_playlist_tracks_lookup ON playlistTracks(playlistId, id);'
            },
            stmts: {

                createPlaylist: `
                INSERT INTO playlists 
                (id, cover, name, createTime, updateTime, trackCount, description, type, isCoverSet, isStar) 
                VALUES 
                (
                $id,
                $cover,
                $name, 
                COALESCE($createTime, strftime('%s', 'now')), 
                COALESCE($updateTime, strftime('%s', 'now')), 
                COALESCE($trackCount, 0),
                $description, 
                $type,
                $isCoverSet, 
                $isStar
                );`,
                getPlaylist: `SELECT * FROM playlists WHERE id = $id;`,
                getPlaylistTrack: `SELECT * FROM playlistTracks WHERE playlistId = $playlistId ORDER BY seq DESC;`,
                getAllPlaylist: `SELECT * FROM playlists`,
                addTrackRef: `
                INSERT OR IGNORE INTO playlistTracks 
                (id, platform, file, playlistId) 
                VALUES 
                ($id, $platform, $file, $playlistId);
                
                UPDATE playlists SET 
                trackCount = trackCount + 1, 
                updateTime = strftime('%f', 'now') * 1000
                WHERE id = $playlistId;`,

                addSong: `INSERT OR IGNORE INTO songs (id, name, type, artists, album, cover, duration, localPath, bilicid, ncmMatchId, mv, ncmCover) VALUES ($id, $name, $type, $artists, $album, $cover, $duration, $localPath, $bilicid, $ncmMatchId, $mv, $ncmCover);`,

                updatePlaylist: `UPDATE playlists 
                SET 
                    cover = COALESCE($cover, cover),
                    name = COALESCE($name, name),
                    updateTime = COALESCE($updateTime, strftime('%s', 'now')),
                    description = COALESCE($description, description),
                    isCoverSet = COALESCE($isCoverSet, isCoverSet),
                    isStar = COALESCE($isStar, isStar)
                WHERE id = $id;`,

                deleteTrackRef: `
                DELETE FROM playlistTracks WHERE playlistId = $playlistId AND id = $id AND platform = $platform;
                UPDATE playlists SET 
                    trackCount = trackCount - 1, 
                    updateTime = strftime('%s', 'now')
                WHERE id = $playlistId;`,

                getSong: `SELECT * FROM songs WHERE id = $id;`,
                deletePlaylist: `DELETE FROM playlists WHERE id = $id; DELETE FROM playlistTracks WHERE playlistId = $id;`,
                setPlaylistCover: `UPDATE playlists SET cover = $cover WHERE id = $playlistId;`,
                isTrackInPlaylist: `SELECT COUNT(*) as count FROM playlistTracks WHERE playlistId = $playlistId AND id = $id AND platform = $platform;`,

                getPlaylistLastTrackWithCover: `SELECT * FROM playlistTracks WHERE playlistId = $playlistId AND id IN (SELECT id FROM songs WHERE cover IS NOT NULL) ORDER BY seq DESC LIMIT 1;`,

            }
        })
    }

    public createPlaylist(options: DBDTO.CreatePlaylistOptions) {
        const playlistId = crypto.randomUUID()
        const insertEntry = {
            $id: playlistId,
            $name: options.playlistName,
            $cover: options.cover || null,
            $isCoverSet: Boolean(options.cover) ? 1 : 0,
            $description: options.description || null,
            $type: 'custom',
            $isStar: Boolean(options.isStar) ? 1 : 0,
            $trackCount: 0
        }
        this.stmt('createPlaylist').run(insertEntry)
        return playlistId
    }

    public getPlaylist(playlistId: string): AppTypes.IPlaylist | null {
        const data = this.stmt('getPlaylist').get({ $id: playlistId })
        if (!data) {
            return null
        }
        const playlist = data as unknown as DBDTO.PlaylistEntry
        const tracks = (this.stmt('getPlaylistTrack').all({ $playlistId: playlistId }) || []) as unknown as DBDTO.TrackEntry[]
        if (!playlist.cover) {
            const cover = this.findPlaylistCover(playlistId)
            playlist.cover = cover || ''
        }
        return this.transPlaylistEntry2IPlaylist(playlist, tracks)

    }

    public getAllPlaylists(): AppTypes.IPlaylist[] {
        const datas = this.stmt('getAllPlaylist').all()
        if (!datas || !datas.length) {
            return []
        }
        const iplaylists: AppTypes.IPlaylist[] = []
        for (const data of datas) {
            const playlist = data as unknown as DBDTO.PlaylistEntry
            if (!playlist.cover) {
                const cover = this.findPlaylistCover(playlist.id)
                playlist.cover = cover || ''
            }
            const tracks = (this.stmt('getPlaylistTrack').all({ $playlistId: playlist.id }) || []) as unknown as DBDTO.TrackEntry[]
            iplaylists.push(this.transPlaylistEntry2IPlaylist(playlist, tracks))
        }
        return iplaylists
    }

    public getPlaylistBrief(playlistId: string): AppTypes.IPlaylistBrief | null {
        const playlist = this.stmt('getPlaylist').get({ $id: playlistId }) as unknown as DBDTO.PlaylistEntry
        if (!playlist) {
            return null
        }
        if (!playlist.cover) {
            const cover = this.findPlaylistCover(playlistId)
            playlist.cover = cover || ''
        }
        return this.transPlaylistEntry2IPlaylistBrief(playlist)
    }

    public getAllPlaylistBrief(): AppTypes.IPlaylistBrief[] {
        const datas = this.stmt('getAllPlaylist').all() as unknown as DBDTO.PlaylistEntry[]
        if (!datas || !datas.length) { return [] }

        for (const data of datas) {
            if (!data.cover) {
                const cover = this.findPlaylistCover(data.id)
                data.cover = cover || ''
            }
        }

        return datas.map(this.transPlaylistEntry2IPlaylistBrief)
    }

    public getPlaylistTracks(playlistId: string): AppTypes.ITrackId[] {
        const tracks = (this.stmt('getPlaylistTrack').all({ $playlistId: playlistId }) || []) as unknown as DBDTO.TrackEntry[]
        return tracks.map(this.transTrackEntry2ITrack)
    }

    public addSongToPlaylist(playlistId: string, song: AppTypes.ISong) {
        const playlist = this.stmt('getPlaylist').get({ $id: playlistId }) as unknown as DBDTO.PlaylistEntry
        if (!playlist) {
            throw new Error('Playlist Not Found')
        }
        const isExist = this.stmt('isTrackInPlaylist').get({
            $playlistId: playlistId,
            $id: String(song.id),
            $platform: song.type
        }) as { count: number }
        if (isExist.count > 0) {
            console.warn('歌曲已存在歌单中，跳过添加')
            return
        }
        try {
            this.beginTransaction();

            const songEntry = this.transSong2Entry(song);

            this.stmt('addSong').run({
                $id: String(song.id),
                $name: songEntry.name,
                $type: songEntry.type,
                $artists: songEntry.artists,
                $album: songEntry.album,
                $cover: songEntry.cover,
                $duration: songEntry.duration,
                $localPath: songEntry.localPath,
                $bilicid: songEntry.bilicid,
                $ncmMatchId: songEntry.ncmMatchId,
                $mv: songEntry.mv,
                $ncmCover: songEntry.ncmCover
            });

            this.stmt('addTrackRef').run({
                $id: String(song.id),
                $platform: song.type || 'local',
                $file: song.type === 'local' ? song.localPath : null,
                $playlistId: playlistId
            });

            this.commitTransaction()
        }
        catch (error) {
            this.rollbackTransaction()
            throw error;
        }
    }

    public deleteSongFromPlaylist(playlistId: string, id: string, platform: string) {
        try {
            this.beginTransaction()
            this.stmt('deleteTrackRef').run({
                $playlistId: playlistId,
                $id: id,
                $platform: platform
            })
            this.commitTransaction()
        } catch (error) {
            this.rollbackTransaction()
        }
    }

    public updatePlaylist(playlistId: string, options: Partial<DBDTO.CreatePlaylistOptions>) {
        const updateFields: Record<string, any> = {
            $id: playlistId,
            $name: options.playlistName || null,
            $description: options.description || null
        }

        if (options.cover !== undefined) {
            updateFields.$cover = options.cover
            updateFields.$isCoverSet = Boolean(options.cover) ? 1 : 0
        }
        this.stmt('updatePlaylist').run(updateFields)
    }

    public getSongById(id: string): AppTypes.ISong | null {
        const data = this.stmt('getSong').get({ $id: id }) as unknown as DBDTO.SongEntry
        if (!data) {
            return null
        }
        return this.transEntry2Song(data)
    }

    public getSongsByIds(ids: string[]): AppTypes.ISong[] {
        if (ids.length === 0) return []

        const placeholders = ids.map(() => '?').join(',')
        const stmt = this.getDB().prepare(`SELECT * FROM songs WHERE id IN (${placeholders})`)
        const songs = stmt.all(...ids) as unknown as DBDTO.SongEntry[]

        return songs.map(song => this.transEntry2Song(song))
    }

    public deletePlaylist(playlistId: string) {
        this.stmt('deletePlaylist').run({ $id: playlistId })
    }

    public findPlaylistCover(playlistId: string): string | null {
        const data = this.stmt('getPlaylistLastTrackWithCover').get({ $playlistId: playlistId }) as unknown as DBDTO.TrackEntry
        if (data) {
            const songData = this.stmt('getSong').get({ $id: data.id }) as unknown as DBDTO.SongEntry
            return songData.cover || songData.ncmCover || null
        }
        return null
    }

    private transPlaylistEntry2IPlaylist(playlist: DBDTO.PlaylistEntry, tracks: DBDTO.TrackEntry[] = []): AppTypes.IPlaylist {
        const iplaylist: AppTypes.IPlaylist = {
            name: playlist.name,
            id: playlist.id,
            cover: playlist.cover || '',
            createTime: playlist.createTime * 1000,
            updateTime: playlist.updateTime * 1000,
            trackCount: tracks.length || playlist.trackCount,
            description: playlist.description || '',
            tracks: tracks.map(this.transTrackEntry2ITrack) || [],
            type: playlist.type || 'custom',
            playCount: 0,
            subscribed: true
        }
        return iplaylist
    }

    private transPlaylistEntry2IPlaylistBrief(playlist: DBDTO.PlaylistEntry): AppTypes.IPlaylistBrief {
        const ipb: AppTypes.IPlaylistBrief = {
            name: playlist.name,
            cover: playlist.cover,
            id: playlist.id,
            type: playlist.type || 'custom',
            trackCount: playlist.trackCount,
        }
        return ipb
    }

    private transTrackEntry2ITrack(trackEntry: DBDTO.TrackEntry): AppTypes.ITrackId {
        if (trackEntry.id) {
            if (trackEntry.platform === 'ncm') {
                return {
                    platform: 'ncm',
                    id: Number(trackEntry.id)
                }
            }
            else if (trackEntry.platform === 'bili') {
                return {
                    platform: 'bili',
                    id: String(trackEntry.id)
                }
            }
            else if (trackEntry.platform === 'local' && trackEntry.file) {
                return {
                    platform: 'local',
                    id: String(trackEntry.id),
                    file: trackEntry.file
                }
            }
        }
        throw new Error('无法转换的id')
    }

    private transSong2Entry(song: AppTypes.ISong): DBDTO.SongEntry {
        if (song.type === 'local') {
            const entry: DBDTO.SongEntry = {
                name: song.name,
                album: JSON.stringify(song.album),
                artists: JSON.stringify(song.artists),
                cover: song.cover,
                mv: null,
                ncmMatchId: song.ncmMatchId || null,
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
            const entry: DBDTO.SongEntry = {
                name: song.name,
                album: JSON.stringify(song.album),
                artists: JSON.stringify(song.artists),
                cover: song.cover,
                mv: null,
                ncmMatchId: null,
                bilicid: song.bilicid,
                id: String(song.id),
                type: 'bili',
                ncmCover: null,
                duration: song.duration,
                localPath: null,
            }
            return JSON.parse(JSON.stringify(entry))
        }
        else if (song.type === 'ncm') {
            const entry: DBDTO.SongEntry = {
                name: song.name,
                album: JSON.stringify(song.album),
                artists: JSON.stringify(song.artists),
                cover: song.cover,
                mv: song.mv || null,
                ncmMatchId: null,
                bilicid: null,
                id: String(song.id),
                type: 'ncm',
                ncmCover: song.cover,
                duration: song.duration,
                localPath: null,
            }
            return JSON.parse(JSON.stringify(entry))
        }
        else throw new Error()
    }

    private transEntry2Song(entry: DBDTO.SongEntry): AppTypes.ISong {
        if (entry.type === 'local') {
            const song: AppTypes.ILocalSong = {
                name: entry.name,
                album: JSON.parse(entry.album),
                artists: JSON.parse(entry.artists),
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
                album: JSON.parse(entry.album),
                artists: JSON.parse(entry.artists),
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
                album: JSON.parse(entry.album),
                artists: JSON.parse(entry.artists),
                cover: entry.cover as string,
                id: Number(entry.id),
                type: 'ncm',
                duration: entry.duration,
                mv: entry.mv
            }
            return song
        }
        else throw new Error()
    }
    
}

const userPlaylistDatabase = new UserPlaylistDatabase()
export { userPlaylistDatabase }