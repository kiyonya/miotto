export function resize(url:string,r:number = 200){
    if(/https:\/\/.*\.music\.126\.net\/.*\.jpg/.test(url)){
        return url+`?param=${r}y${r}&webp=true`
    }
    return url
}