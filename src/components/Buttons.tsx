import { type JSX } from "react"
import { Button } from "@react95/core"

interface Buttons {
    isPause: boolean;
}

export default function Buttons( { isPause }: Buttons ):JSX.Element { 

    function handlePause() :void{
        window.port.invoke(isPause? "ctl:player::pause" : "ctl:player::play")
        
    }

    function handleStop() :void{
        window.port.invoke("ctl:player::seek",0)
        window.port.invoke("ctl:player::pause")
    }

    function handlePrevious() :void{
        window.port.invoke("ctl:player::previous")
    }

    function handleNext() :void{
        window.port.invoke("ctl:player::next")
    }

    return(<div className="buttons">
        <div><Button className="button" onClick={ handlePause }></Button>
            <Button className="button" onClick={ handleStop }></Button>
            <Button className="button"></Button>
        </div>
        <div><Button className="button" onClick={ handlePrevious }></Button>
            <Button className="button"></Button>
            <Button className="button"></Button>
            <Button className="button" onClick={ handleNext }></Button>
        </div>
        <div><Button className="button"></Button>
            <Button className="button"></Button>
        </div>
        
    </div>)
}