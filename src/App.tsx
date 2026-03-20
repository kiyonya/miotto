import { useReducer, useEffect, type JSX } from "react"
import { TitleBar, Frame } from "@react95/core"
import { Mplayer15 } from "@react95/icons"

import './App.css'
import '@react95/core/themes/win95.css';

import setListeners from "./handleListener.js"
import { reducer, initialization } from "./reducer.js"

import Buttons from "./components/Buttons.js"
import Process from "./components/Process.js"

interface trackName {
    trackName: string;
}

function Title( { trackName }: trackName ): JSX.Element {
    return(<div className="title">
        <div className="titleHead"><Mplayer15 variant="16x16_4" /><p>{ trackName + " - 媒体播放器（正在播放）"}</p></div>
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

function Player() :JSX.Element{
    const [playerState, dispatch] = useReducer(reducer, initialization)
    
    useEffect(()=> {
        setListeners(dispatch)
    },[])

    return (
            <Frame className="main" bgColor={ '$material' } boxShadow= {'$out'}>
                <PlayerFrame trackName={ (playerState.trackInfor===null)? "罟罟冠啊噶" : playerState.trackInfor.name  }/>
                <Process dispatch={ dispatch } playerState={ { currentTime: playerState.currentTime, totalTime: playerState.totalTime} }></Process>
                <Buttons isPause={ playerState.isPlaying }></Buttons>
                <div className="tiem"></div>
            </Frame>
    )
}

export default Player