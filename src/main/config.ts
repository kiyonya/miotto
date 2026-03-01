import Store from 'electron-store'

export interface ConfigStore {
    enableOSC:boolean,
    oscServerPort:number,
    oscClientPort:number
}

const configStore = new Store<ConfigStore>({
    defaults:{
        enableOSC:true,
        oscServerPort:15000,
        oscClientPort:15001
    }  
})

export {configStore}