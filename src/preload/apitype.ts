import { AppTypes } from "../types/app"
export interface NCMAPI {
    loginQrKey: () => Promise<{
        data: {
            code: number,
            unikey: string
        }
    }>
    loginQrCreate: (unikey: string, qrimg: boolean) => Promise<{
        data: {
            qrimg: string,
            qrurl: string
        }
    }>
    loginQrCheck: (unikey: string) => Promise<{
        code: 801 | 802 | 803 | 800,
        message: string,
        cookie: string
    }>
    loginStatusCheck: () => Promise<{
        data: {
            code: number,
            account: AppTypes.NCMTypes.IUserAccount,
            profile: AppTypes.NCMTypes.IUserProfile | null
        }
    }>
    playlistDetail: (playlistId: number, cache: boolean) => Promise<AppTypes.IPlaylist>,
    songDetail: (song: number | number[], cache: boolean) => Promise<AppTypes.INCMSong[]>,
    songUrl: (id: number, level: AppTypes.SongQuiltyLevels) => Promise<AppTypes.ISongTrack>,
    songLyric: (id: number) => Promise<AppTypes.ILyric>,
    userPlaylists: (uid: number) => Promise<{
        created: AppTypes.IPlaylistBrief[],
        collected: AppTypes.IPlaylistBrief[]
    }>,
    artistDetail: (artistId: number) => Promise<AppTypes.IArtist>,
    artistAlbum: (artistId: number, limit?: number, offset?: number) => Promise<AppTypes.IAlbum[]>,
    artistHotSong: (artistId: number) => Promise<AppTypes.ISong[]>,
    artistSimi: (artistId: number) => Promise<AppTypes.IArtist[]>,
    recommendSongs: () => Promise<AppTypes.INCMSong[]>,
    recommendPlaylists: () => Promise<AppTypes.IPlaylistBrief[]>,
    recommendHomepage: (blockOrderList?: AppTypes.NCMTypes.HomePageBlockCodeOrder[] | AppTypes.NCMTypes.HomePageBlockCodeOrder, refresh?: boolean) => Promise<any>,
    recommendStyleSongs: (refresh?: boolean, cache?: boolean) => Promise<AppTypes.INCMSong[]>,
    searchSuggest:(keyword:string)=>Promise<AppTypes.ISearchSuggest>,
    searchMatchSuggestKeywords:(keyword:string)=>Promise<AppTypes.SearchMatchKeyword[]>,
    searchResultComplex:(keyword:string)=>Promise<AppTypes.ISearchComplex>,
    audioFingerprintMatch:(afp:string,duration:number)=>Promise<AppTypes.INCMSong[]>
}

export interface BiliAPI {
    songDetail: (bvid: string) => Promise<AppTypes.IBiliSong>
    bvAudioTrack: (bvid: string, cid: number) => Promise<AppTypes.ISongTrack>
}

export interface LocalAPI {
    readAudioFile: (filePath: string) => Promise<AppTypes.ILocalSong>,
    batchGetLocalSong: (filePathes: string[]) => Promise<AppTypes.ILocalSong[]>,
    getLocalTrack: (file: string) => Promise<AppTypes.ISongTrack>
}

export interface AppAPI {
    showOpenDialog: (options?: Electron.OpenDialogOptions) => Promise<Electron.OpenDialogReturnValue>,
    minimize: () => void,
    maximize: () => void,
    close: () => void
}

export interface CacheAPI {
    getAudioCacheDir: () => Promise<string>,
    cacheTrack: (key: string, track: AppTypes.ISongTrack) => Promise<AppTypes.ISongTrack>,
    getTrackCache: (key: string) => Promise<AppTypes.ISongTrack | null>
}

export interface OrpheusAPI {
    playSong: (id: number) => Promise<void>,
    playPlaylist: (id: number) => Promise<void>
}

export interface AudioStateTrans {
    playing: boolean,
    muted: boolean,
    volume: number,
    currentTime: number,
    duration?: number,
}

export interface TransAPI {
    set:<K extends keyof AppTypes.DefaultTransData>(key:K,value:AppTypes.DefaultTransData[K],store?:boolean)=>Promise<void>,
    get:<K extends keyof AppTypes.DefaultTransData>(key:K)=>Promise<void>,
    update:<K extends keyof AppTypes.DefaultTransData>(key:K,newVal:Partial<AppTypes.DefaultTransData[K]>)=>Promise<void>,
    delete:<K extends keyof AppTypes.DefaultTransData>(key:K)=>Promise<void>,
    toEmit:<K extends keyof AppTypes.DefaultTransData>(key:K,value:AppTypes.DefaultTransData[K])=>Promise<void>
}

export interface TransData {
    audioState?: AudioStateTrans
    track?: AppTypes.ISongTrack
    song?: AppTypes.ISong
    playMode?: 'shuffle' | 'list' | 'loop' | 'listloop'
    playlist?: AppTypes.ITrackId[]
    trackId?: AppTypes.ITrackId
}

export interface MediaAPI {
    desktopCapture:(config:Electron.SourcesOptions)=>Promise<Electron.DesktopCapturerSource[]>
}

export type TransEventType = keyof TransData