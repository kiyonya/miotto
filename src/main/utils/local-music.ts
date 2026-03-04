
import fse from 'fs-extra'
import path from 'path'
import { md5File } from './hash'
import { parseFile } from 'music-metadata'
import { app } from 'electron'
import { AppTypes } from '../../types/app'
import pLimit from 'p-limit'
import ncmapi from 'NeteaseCloudMusicApi'
type MatchItem = {
    title: string,
    album: string,
    duration: string,
    artist: string,
    md5: string
}

export default abstract class LocalMusic  {

    public static LocalCoverDir = (() => {
        const coverPath = path.join(app.getAppPath(), 'LocalCover')
        fse.ensureDirSync(coverPath)
        return coverPath
    })()

    public static async readAudioFileAsSong(filePath: string): Promise<AppTypes.ILocalSong> {
        this.checkExist(filePath)
        const md5 = await md5File(filePath)
        const metadata = await parseFile(filePath)
        const common = metadata.common
        const pictures = common.picture

        const coverStoragePath = path.join(this.LocalCoverDir, md5.slice(0, 4), md5.slice(5))
        if (!fse.existsSync(coverStoragePath) && pictures) {
            const mainCover = pictures[0]
            const coverBuffer = mainCover.data
            await fse.writeFile(coverStoragePath, coverBuffer)
        }

        const artists: AppTypes.IArtistBrief[] = []
        for (const ar of (common.artists || [])) {
            artists.push({
                id: 0,
                alias: [],
                tns: [],
                platform: 'unk',
                name: ar || '未知艺术家'
            })
        }
        const localISong: AppTypes.ILocalSong = {
            name: common.title || '',
            cover: coverStoragePath,
            id: md5,
            type: 'local',
            artists: artists,
            album: {
                id: 0,
                tns: [],
                name: common.album || '',
                cover: ''
            },
            duration: (metadata.format.duration || 0) * 1000,
            ncmMatchId: null,
            ncmCover: null,
            localPath: filePath
        }
        return localISong
    }

    public static async batchMatchAudioFile(filePathes: string[]): Promise<AppTypes.ILocalSong[]> {

        this.checkExist(filePathes)
        const readMetaLimit = pLimit(16)
        const metas: AppTypes.ILocalSong[] = await Promise.all(filePathes.map(file => readMetaLimit(() => this.readAudioFileAsSong(file))))
        try {
            const md5Lists: string[] = metas.map(i => i.id)
            const metaMap = new Map<string, AppTypes.ILocalSong>()
            const matchList: MatchItem[] = []
            for (const meta of metas) {
                metaMap.set(meta.id, meta)
                matchList.push({
                    md5: meta.id,
                    album: meta.album.name || '',
                    artist: meta.artists.map(i => i.name).join(','),
                    duration: String(meta.duration),
                    title: meta.name
                })
            }
            const matchReq = await ncmapi.search_match({
                songs: matchList
            })
            const result = matchReq.body.result as { songs: any[], ids: string[] }
            const ids = result.ids || []
            const songs = result.songs || []

            for (let i = 0; i < ids.length; i++) {
                const md5 = ids[i]
                const matchedSong = songs[i]
                const ncmMatchId = matchedSong?.id as number
                const ncmCover = matchedSong?.album?.picUrl as string
                const meta = metaMap.get(md5)
                if (meta) {
                    meta.ncmMatchId = ncmMatchId
                    meta.ncmCover = ncmCover || null
                    metaMap.set(md5, meta)
                }
            }

            const processedResults: AppTypes.ILocalSong[] = []
            for (const id of md5Lists) {
                const song = metaMap.get(id)
                song && processedResults.push(song)
            }

            return processedResults

        } catch (error) {
            console.log(error)
            throw new Error('匹配失败')
        }
    }

    public static async readAudioFileAsTrack(filePath: string): Promise<AppTypes.ISongTrack> {
        this.checkExist(filePath)
        const fileStat = await fse.stat(filePath)
        const metadata = await parseFile(filePath)
        const itrack: AppTypes.ISongTrack = {
            id: '',
            url: filePath,
            type: 'local',
            bitRate: metadata.format.bitrate || 0,
            size: fileStat.size,
            gain: metadata.format.trackGain || 0,
            peek: metadata.format.trackPeakLevel || 0,
            level: metadata.format.lossless ? 'lossless' : 'standard',
            encodeType: metadata.format.container || path.extname(filePath),
            sampleRate: metadata.format.sampleRate || 0
        }
        return itrack
    }

    private static async checkExist(file: string | string[]) {
        const afile = Array.isArray(file) ? file : [file]
        for (const f of afile) {
            if (!fse.existsSync(f)) {
                throw new Error(`${f} NOT EXIST`)
            }
        }
    }

}
