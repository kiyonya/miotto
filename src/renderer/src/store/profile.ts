import { defineStore } from "pinia";
import { AppTypes } from "src/types/app";
interface ProfileState {
    profile:AppTypes.NCMTypes.IUserProfile | null,
    account:AppTypes.NCMTypes.IUserAccount | null,
    isLogin:boolean
}
const useProfileStore = defineStore('profile',{

    state:():ProfileState=>({
        account:null,
        profile:null,
        isLogin:false
    }),

    actions:{
        setLoginStatus(isLogin:boolean = false){
            this.isLogin = isLogin
        },
        setUserProfile(profile:AppTypes.NCMTypes.IUserProfile | null){
            this.profile = profile
        },
        setUserAccount(account:AppTypes.NCMTypes.IUserAccount | null){
            this.account = account
        }
    },
    persist:{
        pick:['profile','account']
    }
})

export {useProfileStore}