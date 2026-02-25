import { app, ipcMain } from "electron";
import Store from 'electron-store'
import path from "path";
import fse from 'fs-extra'
import crypto from 'crypto'
import { DownloaderHelper } from 'node-downloader-helper'
import { URLPattern } from "urlpattern-polyfill";
import { AppTypes } from "../../types/app";
interface CacheStore {
    audioCacheDir: string
}

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0'

export function CacheIPC() {

    const defaultAudioCacheDir = path.join(app.getPath('temp'), 'miotto', 'AudioCache')
    fse.ensureDirSync(defaultAudioCacheDir)

    const bvp = new URLPattern('https://*.bilivideo.com/*')
    const bap = new URLPattern('http://*.hdslb.com/*')

    function getHeader(url: string): object {
        if ([bvp, bap].some(p => p.test(url))) {
            return {
                Referer: "https://www.bilibili.com/",
                "User-Agent": UA
            }
        }
        return {}
    }
    
    function md5Str(str: string): string {
        return crypto.createHash('md5').update(str).digest('hex')
    }

    const store = new Store<CacheStore>({
        defaults: {
            audioCacheDir: defaultAudioCacheDir
        }
    })

    ipcMain.handle('cache:getAudioCacheDir', () => {
        return store.get('audioCacheDir')
    })

    ipcMain.handle('cache:cacheTrack', async (_, key: string, track: AppTypes.ISongTrack):Promise<AppTypes.ISongTrack> => {
        const hash = md5Str(key)
        const cacheDir = path.join(store.get('audioCacheDir'), hash.slice(0, 4))
        fse.ensureDirSync(cacheDir)
        const url = track.url
        const downloader = new DownloaderHelper(url, cacheDir, {
            fileName: `${hash}.media`,
            removeOnFail: true,
            removeOnStop: true,
            retry: {
                maxRetries: 2,
                delay: 500
            },
            headers: getHeader(url)
        })
        await downloader.start()
        track.url = `${hash}.media`
        const trackRefFile = path.join(cacheDir, `${hash}.track`)
        await fse.writeFile(trackRefFile, JSON.stringify(track), 'utf-8')
        return track
    })

    ipcMain.handle('cache:getTrackCache', async (_, key: string):Promise<AppTypes.ISongTrack | null> => {
        const hash = md5Str(key)
        const cacheDir = path.join(store.get('audioCacheDir'), hash.slice(0, 4))
        const f = path.join(cacheDir,  `${hash}.media`)
        const ref = path.join(cacheDir,`${hash}.track`)
        if (fse.existsSync(f) && fse.existsSync(ref)) {
            const track = JSON.parse(fse.readFileSync(ref,'utf-8')) as AppTypes.ISongTrack
            track.url = f
            return track
        }
        return null
    })



    ipcMain.handle('cache:cacheUrl', async (_, key: string, url: string): Promise<string> => {
        const buff = Buffer.from(key, 'utf-8')
        const b64 = buff.toString('base64')
        const filename = b64
        const cacheDir = path.join(store.get('audioCacheDir'), b64.slice(0, 4))
        fse.ensureDir(cacheDir)
        const downloader = new DownloaderHelper(url, cacheDir, {
            fileName: filename,
            removeOnFail: true,
            removeOnStop: true,
            retry: {
                maxRetries: 2,
                delay: 500
            },
            headers: getHeader(url)
        })
        await downloader.start()
        return filename
    })

    ipcMain.handle('cache:getCache', async (_, key: string) => {
        const buff = Buffer.from(key, 'utf-8')
        const b64 = buff.toString('base64')
        const filename = b64
        const cacheDir = path.join(store.get('audioCacheDir'), b64.slice(0, 4))
        const f = path.join(cacheDir, filename)
        if (fse.existsSync(f)) {
            return f
        }
        return null
    })
}