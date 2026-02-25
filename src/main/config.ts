import Store from 'electron-store'

export interface ConfigStore {
    enableOSC:boolean
}

const configStore = new Store<ConfigStore>({
    defaults:{
        enableOSC:true
    }  
})

export {configStore}