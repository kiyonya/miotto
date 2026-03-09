import { AppTypes } from "src/types/app";

export function mlyric2Lrc(lyric:AppTypes.ILyric,song?:AppTypes.ISong):string{
    let lrcHead = ``
    if(song){
        if(song.name){
            lrcHead += `[ti:${song.name}]\n`
        }
        if(song.artists && song.artists.length > 0){
            const ars = song.artists.map(i=>i.name).join(',')
            lrcHead += `[ar:${ars}]\n`
        }
        if(song.album && song.album.name){
            lrcHead += `[al:${song.album.name}]\n`
        }
    }
    lrcHead += `[re:Miotto]\n\n`
    let lrc = `${lrcHead}`
    if(lyric.pure){
        lrc += `[00:00.00] 纯音乐`
        return lrc
    }
    const lines = lyric.lyrics || []

    const timeTag = (ms: number) => {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        const milliseconds = ms % 1000;
        return `[${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(milliseconds).padStart(2, '0')}]`
    }

    for(const line of lines){
        const startMS = line.lineStartTime
        const lrcTimestamp = timeTag(startMS)
        if(line.type === 'lyric' || line.type === 'sublyric'){
            lrc += `${lrcTimestamp} ${line.mainLyric.string}\n`
        }
        else if(line.type === 'gap'){
            lrc += `${lrcTimestamp}\n`
        }
    }

    return lrc
}