import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
    history: createWebHistory('/'),
    routes: [
        {
            name: "PlaylistNcm",
            path: '/playlist/ncm/:id',
            component: () => import("@renderer/views/playlist/PlaylistNcm.vue"),
            props: true
        },
        {
            name:"PlaylistCustom",
            path:'/playlist/custom/:id',
            component:()=>import('@renderer/views/playlist/PlaylistCustom.vue'),
            props:true
        },
        {
            name: "ArtistNcm",
            path: '/artist/ncm/:id',
            component: () => import('@renderer/views/artist/ArtistNcm.vue'),
            props: true
        },{
            name:"Home",
            path:'/',
            component:()=>import('@renderer/views/home/Home.vue'),
        },{
            name:"DailySongs",
            path:'/dailysongs',
            component:()=>import('@renderer/views/dailysongs/DailySongs.vue')
        },{
            name:"Config",
            path:"/config",
            component:()=>import('@renderer/views/config/Config.vue'),
            meta:{
                keepAlive:false
            }
        },{
            name:"SearchResult",
            path:"/search/result/:keyword",
            component:()=>import('@renderer/views/search/SearchResult.vue'),
            props:true
        }
    ]
})

router.beforeEach((to,from,next)=>{
    window.transapi.toEmit('appRouterUpdate',{from:from.fullPath,to:to.fullPath})
    next()
})

export { router }