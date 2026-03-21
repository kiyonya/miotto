import { ElectronAPI } from '@electron-toolkit/preload'
import { WebFrame } from 'electron/renderer'
import {NCMAPI,BiliAPI,LocalAPI, CacheAPI, OrpheusAPI, TransAPI, MediaAPI} from './apitype'
import { AppAPI } from 'src/types/api'
import { AppEvents } from 'src/types/event'

declare global {
  interface Window {
    electron: ElectronAPI
    ncmapi:AppAPI.NCM,
    biliapi:BiliAPI,
    localapi:LocalAPI,
    appapi:AppAPI.APP,
    cacheapi:AppAPI.Cache,
    orpheusapi:OrpheusAPI,
    mediaapi:MediaAPI,
    emitter:AppAPI.Emitter
  }
}
