
import { AppTypes } from "src/types/app";

export  function song2TrackId(song:AppTypes.ISong):AppTypes.ITrackId{
    const platform = song.type
    if(platform === 'ncm'){
        return {
            id:Number(song.id),
            platform
        }
    }
    else if(platform==='bili'){
        return {
            id:String(song.id),
            platform
        }
    }
    else if(platform === 'local'){
        return {
            id:String(song.id),
            platform,
            file:song.localPath
        }
    }
    else{
        throw new Error('unsp')
    }
}

export function isISong(song: AppTypes.ISong | AppTypes.ITrackId): song is AppTypes.ISong {
  return 'name' in song && 'artists' in song
}

export function isITrackId(song: AppTypes.ISong | AppTypes.ITrackId): song is AppTypes.ITrackId {
  return 'id' in song && 'trackId' in song
}
