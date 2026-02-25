import { contextBridge, ipcRenderer, webFrame } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { AppTypes } from '../types/app'
import { AppAPI, AudioStateTrans, BiliAPI, CacheAPI, LocalAPI, MediaAPI, NCMAPI, OrpheusAPI, TransAPI } from './apitype'

const api = {
}

const appapi: AppAPI = {
  showOpenDialog: (options?: Electron.OpenDialogOptions) => ipcRenderer.invoke('app:showOpenDialog', options),
  minimize: () => ipcRenderer.invoke('app:minimize'),
  maximize: () => ipcRenderer.invoke('app:maximize'),
  close: () => ipcRenderer.invoke('app:close')
}

const ncmapi: NCMAPI = {
  loginQrKey: () => ipcRenderer.invoke('ncmapi:loginQrKey'),
  loginQrCreate: (unikey: string, qrimg: boolean = true) => ipcRenderer.invoke('ncmapi:loginQrCreate', unikey, qrimg),
  loginQrCheck: (unikey: string) => ipcRenderer.invoke('ncmapi:loginQrCheck', unikey),
  loginStatusCheck: () => ipcRenderer.invoke('ncmapi:loginStatusCheck'),
  playlistDetail: (playlistId: number, cache: boolean = true) => ipcRenderer.invoke('ncmapi:playlistDetail', playlistId, cache),
  songDetail: (song: number | number[], cache: boolean = true) => ipcRenderer.invoke('ncmapi:songDetail', song, cache),
  songUrl: (id: number, level: AppTypes.SongQuiltyLevels = 'standard') => ipcRenderer.invoke('ncmapi:songUrl', id, level),
  songLyric: (id: number) => ipcRenderer.invoke('ncmapi:songLyric', id),
  userPlaylists: (uid: number) => ipcRenderer.invoke('ncmapi:userPlaylists', uid),
  artistAlbum: (id: number, limit: number = 30, offset: number = 0) => ipcRenderer.invoke('ncmapi:artistAlbum', id, limit, offset),
  artistDetail: (id: number) => ipcRenderer.invoke('ncmapi:artistDetail', id),
  artistHotSong: (id: number) => ipcRenderer.invoke('ncmapi:artistHotSong', id),
  artistSimi: (id: number) => ipcRenderer.invoke('ncmapi:artistSimi', id),
  recommendSongs: () => ipcRenderer.invoke('ncmapi:recommendSongs'),
  recommendHomepage: (block?: AppTypes.NCMTypes.HomePageBlockCodeOrder[] | AppTypes.NCMTypes.HomePageBlockCodeOrder, refresh?: boolean) => ipcRenderer.invoke('ncmapi:recommendHomepage', block, refresh),
  recommendPlaylists: () => ipcRenderer.invoke('ncmapi:recommendPlaylists'),
  recommendStyleSongs: (refresh?: boolean, cache?: boolean) => ipcRenderer.invoke('ncmapi:recommendStyleSongs', refresh, cache),
  searchSuggest:(keyword:string)=>ipcRenderer.invoke('ncmapi:searchSuggest',keyword),
  searchMatchSuggestKeywords:(keyword:string)=>ipcRenderer.invoke('ncmapi:searchMatchSuggestKeywords',keyword),
  searchResultComplex:(keyword:string)=>ipcRenderer.invoke('ncmapi:searchResultComplex',keyword),
  audioFingerprintMatch:(afp:string,duration:number = 3)=>ipcRenderer.invoke('ncmapi:audioFingerprintMatch',afp,duration)
}

const biliapi: BiliAPI = {
  songDetail: (bvid: string) => ipcRenderer.invoke('biliapi:songDetail', bvid),
  bvAudioTrack: (bvid: string, cid: number) => ipcRenderer.invoke('biliapi:bvAudioTrack', bvid, cid)
}

const localapi: LocalAPI = {
  readAudioFile: (file: string) => ipcRenderer.invoke('localapi:readAudioFile', file),
  batchGetLocalSong: (files: string[]) => ipcRenderer.invoke('localapi:batchGetLocalSong', files),
  getLocalTrack: (f: string) => ipcRenderer.invoke('localapi:getLocalTrack', f)
}

const cacheapi: CacheAPI = {
  getAudioCacheDir: () => ipcRenderer.invoke('cache:getAudioCacheDir'),
  cacheTrack: (key: string, track: AppTypes.ISongTrack) => ipcRenderer.invoke('cache:cacheTrack', key, track),
  getTrackCache: (key: string) => ipcRenderer.invoke('cache:getTrackCache', key)
}

const orpheusapi: OrpheusAPI = {
  playPlaylist: (id: number) => ipcRenderer.invoke('orpheus:playPlaylist', id),
  playSong: (id: number) => ipcRenderer.invoke('orpheus:playSong', id)
}

const transapi: TransAPI = {
  set: <K extends keyof AppTypes.DefaultTransData>(key: K, value: AppTypes.DefaultTransData[K], store?: boolean) => ipcRenderer.invoke('trans:set', key, value, store),
  get: <K extends keyof AppTypes.DefaultTransData>(key: K) => ipcRenderer.invoke('trans:get', key),
  update: <K extends keyof AppTypes.DefaultTransData>(key: K, newVal:Partial<AppTypes.DefaultTransData[K]>) => ipcRenderer.invoke('trans:update', key, newVal),
  delete: <K extends keyof AppTypes.DefaultTransData>(key: K) => ipcRenderer.invoke('trans:update', key),
  toEmit:<K extends keyof AppTypes.DefaultTransData>(key: K, value: AppTypes.DefaultTransData[K]) =>ipcRenderer.invoke('trans:toEmit',key,value)
}

const mediaapi:MediaAPI = {
  desktopCapture:(config:Electron.SourcesOptions)=>ipcRenderer.invoke('media:desktopCapture',config)
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
    contextBridge.exposeInMainWorld('appapi', appapi)
    contextBridge.exposeInMainWorld('ncmapi', ncmapi)
    contextBridge.exposeInMainWorld('biliapi', biliapi)
    contextBridge.exposeInMainWorld('localapi', localapi)
    contextBridge.exposeInMainWorld('cacheapi', cacheapi)
    contextBridge.exposeInMainWorld('orpheusapi', orpheusapi)
    contextBridge.exposeInMainWorld('transapi', transapi)
    contextBridge.exposeInMainWorld('mediaapi',mediaapi)
    contextBridge.exposeInMainWorld('clearCache', webFrame.clearCache)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
  // @ts-ignore (define in dts)
  window.appapi = appapi
  // @ts-ignore (define in dts)
  window.ncmapi = ncmapi
  // @ts-ignore (define in dts)
  window.biliapi = biliapi
  // @ts-ignore (define in dts)
  window.localapi = localapi
  // @ts-ignore (define in dts)
  window.cacheapi = cacheapi
  // @ts-ignore (define in dts)
  window.orpheusapi = orpheusapi
  // @ts-ignore (define in dts)
  window.transapi = transapi
  // @ts-ignore (define in dts)
  window.mediaapi = mediaapi
  // @ts-ignore (define in dts)
  window.clearCache = webFrame.clearCache
}
