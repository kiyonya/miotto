import { ipcMain, session } from "electron";
import { Axios } from 'axios'
import { AppTypes } from "../../types/app";

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0'

export function biliApi() {

    const axiosClient = new Axios({
        baseURL: "https://api.bilibili.com/x/",
        headers: {
            Referer: "https://www.bilibili.com/",
            "User-Agent": UA
        },
        responseType: 'json',
        transformResponse:[(data)=>JSON.parse(data)]
    })

    const filter = {
        urls: ['https://*.bilivideo.com/*','http://*.hdslb.com/*']
    }
    session.defaultSession.webRequest.onBeforeSendHeaders(filter, (details, callback) => {
        details.requestHeaders['Referer'] = 'https://www.bilibili.com/'
        callback({ requestHeaders: details.requestHeaders })
    })

    ipcMain.handle('biliapi:songDetail', async (_, bvid: string) => {
        const req = await axiosClient.get(`/web-interface/view?bvid=${bvid}`,{responseType:'json'})
        const data = req.data.data as Record<any, any>
        const isong: AppTypes.IBiliSong = {
            name: data.title,
            id: data.bvid,
            bilicid: data.cid,
            type: 'bili',
            cover: data.pic,
            album: {
                name: data.title,
                id: data.bvid,
                cover: data.pic,
                tns: []
            },
            artists: [
                {
                    name: data.owner.name,
                    alias: [],
                    id: data.owner.mid,
                    tns: [],
                    platform: 'bili'
                }
            ],
            duration: data.duration
        }
        return isong
    })

    ipcMain.handle('biliapi:bvAudioTrack', async (_, bvid: string, cid: number): Promise<AppTypes.ISongTrack> => {
        const req = await axiosClient.get(`/player/playurl?cid=${cid}&bvid=${bvid}&fnval=4048`,{responseType:'json'})
        const audios = req.data.data.dash.audio as any[]
        const duration = req.data.data.dash.duration as number
        const matchAudio = audios.sort((a, b) => Number(b.bandwidth) - Number(a.bandwidth))?.[0]
        const itrack: AppTypes.ISongTrack = {
            id: bvid,
            type: 'bili',
            url: matchAudio.baseUrl,
            bitRate: matchAudio.bandwidth,
            size: duration * matchAudio.bandwidth,
            gain: 0,
            sampleRate: 44100,
            peek: 0,
            level: 'standard',
            encodeType: matchAudio.codecs
        }
        return itrack
    })
}