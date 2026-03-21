import { AppTypes } from "./app"
import { AppEvents } from "./event"

export namespace AppAPI {

    type RestArray<I> = I extends any[] ? I : [I]

    export interface Emitter {
        set: <K extends keyof AppEvents.Events>(key: K, ...args: RestArray<AppEvents.Events[K]>) => Promise<void>
        setPost: <K extends keyof AppEvents.Events>(key: K, ...args: RestArray<AppEvents.Events[K]>) => Promise<void>
        post: <K extends keyof AppEvents.Events>(key: K, ...args: RestArray<AppEvents.Events[K]>) => Promise<void>
        postToGroup: <K extends keyof AppEvents.Events>(groupId: string, key: K, ...args: RestArray<AppEvents.Events[K]>) => Promise<void>
        setPostToGroup:<K extends keyof AppEvents.Events> (groupId: string, key: K, ...args: RestArray<AppEvents.Events[K]>) => Promise<void>
        get: <K extends keyof AppEvents.Events>(key: K) => Promise<AppEvents.Events[K] | undefined>,
        delete: <K extends keyof AppEvents.Events>(key: K) => Promise<void>,
        repostAllEvent:()=>Promise<void>,
        repostGroupEvent:(gid:string)=>Promise<void>
    }

    export interface APP {
        showOpenDialog: (options?: Electron.OpenDialogOptions) => Promise<Electron.OpenDialogReturnValue>,
        showSaveDialog:(options?:Electron.SaveDialogOptions)=>Promise<Electron.SaveDialogReturnValue>,
        writeFile:(filePath: string, data: string | NodeJS.ArrayBufferView | ArrayBuffer, options?:{encoding?: BufferEncoding ;mode?: number;flag?: string;})=>Promise<{success: boolean; error?: string}>,
        minimize: () => void,
        maximize: () => void,
        close: () => void
    }

    export interface Cache {
        cacheAudioTrack:(key:string,track:AppTypes.ISongTrack)=>Promise<void>,
        getCacheDir:()=>Promise<string>,
        clearCache:()=>Promise<void>,
        getAudioTrack:(key:string)=>Promise<AppTypes.ISongTrack | null>,
        cacheLyric:(key:string,lyric:AppTypes.ILyric)=>Promise<void>,
        getLyric:(key:string)=>Promise<AppTypes.ILyric | null>
    }

    export interface NCM {
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
        searchSuggest: (keyword: string) => Promise<AppTypes.ISearchSuggest>,
        searchMatchSuggestKeywords: (keyword: string) => Promise<AppTypes.SearchMatchKeyword[]>,
        searchResultComplex: (keyword: string) => Promise<AppTypes.ISearchComplex>,
        audioFingerprintMatch: (afp: string, duration: number) => Promise<AppTypes.INCMSong[]>,
        album:(id:number)=>Promise<{songs:AppTypes.ISong[],album:AppTypes.IAlbum}>
    }

    export interface Bili {
        songDetail: (bvid: string) => Promise<AppTypes.IBiliSong>
        bvAudioTrack: (bvid: string, cid: number) => Promise<AppTypes.ISongTrack>
    }

    export interface Local {
        readAudioFile: (filePath: string) => Promise<AppTypes.ILocalSong>,
        batchGetLocalSong: (filePathes: string[]) => Promise<AppTypes.ILocalSong[]>,
        getLocalTrack: (file: string) => Promise<AppTypes.ISongTrack>
    }

    export interface Orpheus {
        playSong: (id: number) => Promise<void>,
        playPlaylist: (id: number) => Promise<void>
    }

    export interface Media {
        desktopCapture: (config: Electron.SourcesOptions) => Promise<Electron.DesktopCapturerSource[]>
    }
}