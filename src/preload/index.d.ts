import { ElectronAPI } from '@electron-toolkit/preload'
import { WebFrame } from 'electron/renderer'
import {NCMAPI,BiliAPI,LocalAPI, AppAPI, CacheAPI, OrpheusAPI, TransAPI, MediaAPI} from './apitype'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {

    },
    ncmapi: NCMAPI,
    biliapi:BiliAPI,
    localapi:LocalAPI,
    appapi:AppAPI,
    cacheapi:CacheAPI,
    orpheusapi:OrpheusAPI,
    transapi:TransAPI,
    mediaapi:MediaAPI
    clearCache:()=>void,
    gc:()=>void
  }
}
