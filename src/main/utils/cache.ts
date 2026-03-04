import Store from 'electron-store'
import path from "path";
import fse from 'fs-extra'
import { app } from 'electron';
import { AppTypes } from '../../types/app';
import { DownloaderHelper } from 'node-downloader-helper';
import { URLPattern } from 'urlpattern-polyfill'
import zlib from 'zlib'
import ZlibUtil from './zlib';
interface CacheStore {
    audioCacheDir: string,
    lyricCacheDir:string
}
export default abstract class CacheControl {

    private static bvp = new URLPattern('https://*.bilivideo.com/*')
    private static bap = new URLPattern('http://*.hdslb.com/*')
    private static UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0'

    static get DefaultAudioCacheDir(): string {
        const dir = path.join(app.getPath('temp'), 'miotto', 'AudioCache')
        fse.ensureDirSync(dir)
        return dir
    }

    static get DefaultLyricCacheDir(): string {
        const dir = path.join(app.getPath('temp'), 'miotto', 'LyricCache')
        fse.ensureDirSync(dir)
        return dir
    }


    private static getHeader(url: string): object {
        if ([this.bvp, this.bap].some(p => p.test(url))) {
            return {
                Referer: "https://www.bilibili.com/",
                "User-Agent": this.UA
            }
        }
        return {}
    }

    private static store = new Store<CacheStore>({
        defaults: {
            audioCacheDir: this.DefaultAudioCacheDir,
            lyricCacheDir:this.DefaultLyricCacheDir
        }
    })

    public static async cacheAudioTrack(cacheKey: string, track: AppTypes.ISongTrack) {
        const cacheFileDir = this.getAudioCacheDir(cacheKey)
        const url = track.url
        if (!CacheControl.isWebURL(url)) { return track }

        const mediaFileName = `${cacheKey}.media`

        const downloader = new DownloaderHelper(url, cacheFileDir, {
            fileName: mediaFileName,
            removeOnFail: true,
            removeOnStop: true,
            retry: {
                maxRetries: 2,
                delay: 500
            },
            headers: CacheControl.getHeader(url)
        })

        await downloader.start()

        track.url = mediaFileName
        const trackRefFile = path.join(cacheFileDir, `${cacheKey}.track`)

        await fse.writeFile(trackRefFile, JSON.stringify(track), 'utf-8')

        return track
    }

    public static async getAudioTrack(cacheKey: string): Promise<AppTypes.ISongTrack | null> {
        const cacheFileDir = this.getAudioCacheDir(cacheKey)
        const media = path.join(cacheFileDir, `${cacheKey}.media`)
        const track = path.join(cacheFileDir, `${cacheKey}.track`)
        if (fse.existsSync(media) && fse.existsSync(track)) {
            const trackJSON = JSON.parse(fse.readFileSync(track, 'utf-8')) as AppTypes.ISongTrack
            trackJSON.url = media
            return trackJSON
        }
        return null
    }

    public static async cacheLyric(cacheKey: string, lyric: AppTypes.ILyric) {
        const cacheFileDir = this.getLyricCacheDir(cacheKey)
        const lyricFile = path.join(cacheFileDir, `${cacheKey}.lyric`)
        const lyricStr = JSON.stringify(lyric)
        const buf = await ZlibUtil.compressGzipString(lyricStr)
        fse.writeFileSync(lyricFile, buf)
        return lyricFile
    }

    public static async getLyric(cacheKey: string): Promise<AppTypes.ILyric | null> {
        const cacheFileDir = this.getLyricCacheDir(cacheKey)
        const lyricFile = path.join(cacheFileDir, `${cacheKey}.lyric`)
        if (fse.existsSync(lyricFile)) {  
            const lyricBuffer = await fse.readFile(lyricFile)
            const lyricString = await ZlibUtil.decompressGzipBuffer(lyricBuffer,'utf-8')
            const lyricJSON = JSON.parse(lyricString) as AppTypes.ILyric
            return lyricJSON
        }
        return null
    }

    public gzipString(){

    }

    public static async clearCache() {
        const cacheDir = this.store.get('audioCacheDir')
        fse.emptyDirSync(cacheDir)
    }

    public static async getCachePath() {
        const cacheDir = this.store.get('audioCacheDir')
        fse.ensureDirSync(cacheDir)
        return cacheDir
    }

    private static getAudioCacheDir(cacheKey: string) {
        const p = path.join(this.store.get('audioCacheDir'), cacheKey.slice(0, 4))
        fse.ensureDirSync(p)
        return p
    }

    private static getLyricCacheDir(cacheKey: string) {
        const p = path.join(this.store.get('lyricCacheDir'), cacheKey.slice(0, 4))
        fse.ensureDirSync(p)
        return p
    }

    private static isWebURL(url: string): boolean {
        try {
            const u = new URL(url)
            return u.protocol === 'http:' || u.protocol === 'https:'
        }
        catch {
            return false
        }
    }
}