import { Range } from "@react95/core" 
import { type Action } from "../reducer.js"

interface processValue {
    value: string | readonly string[] | number | undefined;
    dispatch: React.ActionDispatch< [Action] >;
    playerState: { currentTime: number, totalTime: number};
}

export default function Process( { value, dispatch, playerState }: processValue ){
        function handleProgress(e: React.ChangeEvent<HTMLInputElement,HTMLInputElement>) :void{
            let progress = isNaN(Number(e.target.value)) ? playerState.currentTime : Number(e.target.value)           
            dispatch({
                type: "setProgress",
                currentTime: progress/100*playerState.totalTime
            })
    }

    return (
    <div className="progress">
        <Range value={ value } onChange={ handleProgress }>
        </Range>
    </div>)
}