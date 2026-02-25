import { app, ipcMain } from 'electron'
import { parseFile } from 'music-metadata'
import { AppTypes } from '../../types/app'
import path from 'path'
import fse from 'fs-extra'
import fs from 'fs'
import { md5File } from '../utils/hash'
import pLimit from 'p-limit'
import ncmapi from 'NeteaseCloudMusicApi'
export function localAPI() {

    const coverStoragePath = path.join(app.getPath('appData'), 'CoverCache')
    fse.ensureDirSync(coverStoragePath)

    ipcMain.handle('localapi:readAudioFile', async (_, filePath: string): Promise<AppTypes.ILocalSong> => {
        console.log(filePath)
        if (!fs.existsSync(filePath)) {
            throw new Error("不存在的文件")
        }
        const md5 = await md5File(filePath)
        const metadata = await parseFile(filePath)
        const common = metadata.common
        const pictures = common.picture
        let coverSavePath: string | null = null
        const coverDumpPath = path.join(coverStoragePath, md5)
        const isCoverExist = await fse.pathExists(coverDumpPath)
        if (isCoverExist) {
            coverSavePath = coverDumpPath
        }
        else if (pictures && pictures.length) {
            const mainCover = pictures[0]
            const coverBuffer = mainCover.data
            await fs.promises.writeFile(coverDumpPath, coverBuffer)
            coverSavePath = coverDumpPath
        }

        const artists: AppTypes.IArtistBrief[] = []
        if (common.artists) {
            for (const ar of common.artists) {
                artists.push({
                    id: 0,
                    alias: [],
                    tns: [],
                    platform: 'unk',
                    name: ar
                })
            }
        }

        const localISong: AppTypes.ILocalSong = {
            name: common.title || '',
            cover: coverSavePath,
            id: md5,
            type: 'local',
            artists: artists,
            album: {
                id: 0,
                tns: [],
                name: common.album || '',
                cover: ''
            },
            duration: metadata.format.duration || 0,
            ncmMatchId: null,
            ncmCover:null,
            localPath: filePath
        }
        return localISong
    })

    ipcMain.handle('localapi:batchGetLocalSong', async (_, filePathes: string[]): Promise<AppTypes.ILocalSong[]> => {
        for (const filePath of filePathes) {
            if (!fs.existsSync(filePath)) {
                throw new Error(`不存在文件${filePath}`)
            }
        }
        const readMetaLimit = pLimit(16)
        const readMeta = async (filePath: string) => {
            const metadata = await parseFile(filePath)
            const md5 = await md5File(filePath)
            const common = metadata.common
            const pictures = common.picture
            let coverSavePath: string | null = null
            const coverDumpPath = path.join(coverStoragePath, md5)
            const isCoverExist = await fse.pathExists(coverDumpPath)
            if (isCoverExist) {
                coverSavePath = coverDumpPath
            }
            else if (pictures && pictures.length) {
                const mainCover = pictures[0]
                const coverBuffer = mainCover.data
                await fs.promises.writeFile(coverDumpPath, coverBuffer)
                coverSavePath = coverDumpPath
            }

            const artists: AppTypes.IArtistBrief[] = []
            if (common.artists) {

                for (const ar of common.artists) {
                    const nsp = ar.split('/')
                    for (const name of nsp) {
                        artists.push({
                            id: 0,
                            alias: [],
                            tns: [],
                            platform: 'unk',
                            name: name
                        })
                    }
                }
            }

            const localISong: AppTypes.ILocalSong = {
                name: common.title || '',
                cover: coverSavePath,
                id: md5,
                type: 'local',
                artists: artists,
                album: {
                    id: 0,
                    tns: [],
                    name: common.album || '',
                    cover: ''
                },
                duration: metadata.format.duration || 0,
                ncmMatchId: null,
                ncmCover:null,
                localPath: filePath
            }
            return localISong
        }
        const metas: AppTypes.ILocalSong[] = await Promise.all(filePathes.map(file => readMetaLimit(() => readMeta(file))))

        type MatchItem = {
            title: string,
            album: string,
            duration: string,
            artist: string,
            md5: string
        }

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

            console.log(result)
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
    })

    ipcMain.handle('localapi:getLocalTrack', async (_, file: string): Promise<AppTypes.ISongTrack> => {
        if (!fs.existsSync(file)) {
            throw new Error(`不存在文件${file}`)
        }
        const fileStat = await fs.promises.stat(file)
        const metadata = await parseFile(file)
        const itrack: AppTypes.ISongTrack = {
            id: '',
            url: file,
            type: 'local',
            bitRate: metadata.format.bitrate || 0,
            size: fileStat.size,
            gain: metadata.format.trackGain || 0,
            peek: metadata.format.trackPeakLevel || 0,
            level: metadata.format.lossless ? 'lossless' : 'standard',
            encodeType: metadata.format.container || path.extname(file),
            sampleRate: metadata.format.sampleRate || 0
        }
        return itrack
    })

}