import { type JSX } from "react"
import { Button } from "@react95/core"

interface Buttons {
    isPause: boolean;
}

export default function Buttons( { isPause }: Buttons ):JSX.Element { 
    function handlePause() {
        window.port.invoke(isPause? "ctl:player::pause" : "ctl:player::play")
    }

    return(<div className="buttons">
        <div><Button className="button" onClick={ handlePause }></Button>
            <Button className="button"></Button>
            <Button className="button"></Button>
        </div>
        <div><Button className="button"></Button>
            <Button className="button"></Button>
            <Button className="button"></Button>
            <Button className="button"></Button>
        </div>
        <div><Button className="button"></Button>
            <Button className="button"></Button>
        </div>
        
    </div>)
}