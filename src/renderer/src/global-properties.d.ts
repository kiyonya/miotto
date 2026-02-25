import { Player } from "./lib/player"

declare module 'vue' {
    interface ComponentCustomProperties {
        $imgrsz: (url: string, r: number) => string,
        $fmtsecond : (second:number)=>string,
        $fmtms : (ms:number)=>string,
        $fmttimestamp2date:(mst:number)=>string,
        $fmtbr:(bitrate:number)=>string,
        $cmpScrollCenterDistance : (item: HTMLElement, container: HTMLElement)=>number
        $player:Player,

    }
}
declare global {
    interface Window{
        $player:Player
    }
}
export { }