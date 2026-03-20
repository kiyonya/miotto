import React, { useRef } from "react"
import { Input, Cursor } from "@react95/core" 
import { type Action } from "../reducer.js"
import "./Process.css"

class Prop {
    x: number;
    y: number;
    range: number;
    color: string;
    constructor( y: number, range: number, color: string, x: number = 0,){
        this.x = x;
        this.y = y;
        this.range = range;
        this.color = color;
    }
}

interface processValue {
    dispatch: React.ActionDispatch< [Action] >;
    playerState: { currentTime: number, totalTime: number};
}

function fillPx( ctx:CanvasRenderingContext2D, x:number, y:number ,range:number, color: string ): void {
    for(y; y < range; y++) {
        ctx.fillStyle = color ;
        ctx.fillRect(x*2, y*2, 2, 2)
    }
}

function drawPointer( canvas: HTMLCanvasElement ) :void {
    canvas.width = 24;
    canvas.height = 36;

    const ctx = canvas.getContext("2d")
    if( ctx ) {
        ctx.clearRect(1,1,100,100)
        ctx.beginPath()

        // fillPx(ctx, 0, 0, 18, "rgb(0, 0, 0)")
        const draw: Prop[] = [
            new Prop(0,13,"white"),
            new Prop(1,13,"rgb(192,192,192)"),
            new Prop(1,14,"rgb(192,192,192)"),
            new Prop(1,15,"rgb(192,192,192)"),
            new Prop(1,16,"rgb(192,192,192)"),
            new Prop(1,17,"rgb(192,192,192)"),
            new Prop(1,17,"rgb(192,192,192)"),
            new Prop(1,16,"rgb(192,192,192)"),
            new Prop(1,15,"rgb(192,192,192)"),
            new Prop(1,15,"rgb(192,192,192)"),
            new Prop(1,13,"rgb(128,128,128)"),
            new Prop(0,13,"rgb(0,0,0)"),
        ]    
        draw.forEach((v,k) => {
            fillPx(ctx, k, v.y, v.range, v.color)
        });

        for(let i = 0; i < 11; i++){
            ctx.fillStyle = "white"
            ctx.fillRect(i*2, 0, 2, 2)
            if(i < 4){
                ctx.fillRect( 2+i*2, 26+i*2, 2, 2)
                ctx.fillStyle = "rgb(128,128,128)"
                ctx.fillRect( 18-i*2, 26+i*2, 2, 2)
                ctx.fillStyle = "black"
                ctx.fillRect( 20-i*2, 26+i*2, 2, 2)
            }
        }
        ctx.fillStyle = "black"
        ctx.fillRect(12,34,2,2)
    } 
}

export default function Process( { dispatch, playerState }: processValue ){
    const pointerRef = useRef<HTMLCanvasElement>(null)
    const processRef = useRef<HTMLInputElement>(null)

    const processWidth = processRef.current?.clientWidth
    const processNum = !processWidth ? 0 : playerState.currentTime/playerState.totalTime*processWidth

    if( pointerRef.current ) { drawPointer(pointerRef.current) }
    function handleProgress(e: React.ChangeEvent<HTMLInputElement,HTMLInputElement>) :void{
        let progress = isNaN(Number(e.target.value)) ? playerState.currentTime : Number(e.target.value)           
        dispatch({
            type: "setProgress",
            currentTime: progress/100*playerState.totalTime
        })
    }

    return (
    <div className="progress">
        {/* <Range value={ playerState.currentTime/playerState.totalTime*100 } onChange={ handleProgress }>
        </Range> */}
        <div className="input"><canvas ref={ pointerRef } style={{ translate: Math.floor(processNum) }}  className="pointer"></canvas><Input ref={ processRef } disabled></Input></div>
    </div>)
}