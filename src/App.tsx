import { useReducer, useEffect, type JSX } from "react"
import './App.css'
import '@react95/core/themes/win95.css';
import setListeners from "./handleListener.js"
import { reducer, initialization } from "./reducer.js"
import { Range, TitleBar, Frame, Button } from "@react95/core"
import { Mplayer15 } from "@react95/icons"
import { Icon } from "@iconify/react"

interface Buttons {
    isPause: boolean;
}

interface trackName {
    trackName: string;
}

function Title( { trackName }: trackName ): JSX.Element {
    return(<div className="title">
        <div className="titleHead"><Mplayer15 variant="16x16_4" /><p>{ trackName + "（媒体播放器）"}</p></div>
            <div className="titleButtons">
                <TitleBar.Minimize className="titleMinimzie"></TitleBar.Minimize>
                <TitleBar.Maximize></TitleBar.Maximize>
                <TitleBar.Close></TitleBar.Close>
            </div>
        </div>
    )
}

function Options():JSX.Element {
    const list: Array<string> = ["看看", "猫猫", "cpp"];
    const renderList = list.map(( option ) =>  <li> { option } </li>);
    return(
    <ul className= "options"> { renderList } </ul>)
}

function PlayerFrame( { trackName }: trackName):JSX.Element {
    return(
    <>  
        <div className="titleContainer"><TitleBar className="titleBar" title={" "}><Title trackName= {trackName}/></TitleBar></div>
        <Options />
    </>)
}

function Buttons( { isPause }: Buttons ):JSX.Element { 
    function handlePause() {
        window.port.invoke(isPause? "ctl:player::pause" : "ctl:player::play")
    }

    return(<div className="buttons">
        <Button className="button" onClick={ handlePause }><Icon className="icon"   icon="material-symbols:play-arrow"></Icon></Button>
        <Button className="button"></Button>
        <Button className="button"></Button>
        
    </div>)
}

function Player() :JSX.Element{
    const [playerState, dispatch] = useReducer(reducer, initialization)
    
    useEffect(()=> {
        setListeners(dispatch)
    },[])

    function handleProgress(e: React.ChangeEvent<HTMLInputElement,HTMLInputElement>) :void{
        if(!playerState){ throw new Error("incomplete initialization")}
        let progress = isNaN(Number(e.target.value)) ? playerState.currentTime : Number(e.target.value)           
        dispatch({
            type: "setProgress",
            currentTime: progress/100*playerState.totalTime
        })
    }

    return (
            <Frame className="main" bgColor={ '$material' } boxShadow= {'$out'}>
                <PlayerFrame trackName={ (playerState.trackInfor===null)? "罟罟冠啊噶" : playerState.trackInfor.name  }/>
                <div className="progress"><Range value={ playerState.currentTime/playerState.totalTime*100 } onChange={ handleProgress }>
                </Range></div>
                <Buttons isPause={ playerState.isPlaying }></Buttons>
            </Frame>
    )
}

export default Player