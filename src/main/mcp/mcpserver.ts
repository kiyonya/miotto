import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { defaultDataEmitter } from '../utils/transport'
const server = new McpServer({
    version:'',
    name:''
})
server.registerTool('current_playlist',{
    title:"current_playlist",
    description:"获取当前的播放列表前20首",
},()=>{
    const data = defaultDataEmitter.get('player::playlistUpdate')
    const playlist = data?.[0] || []
    

    return playlist
})