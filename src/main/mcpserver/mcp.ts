import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StreamableHTTPServerTransport, StreamableHTTPServerTransportOptions } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { z } from 'zod'
import { defaultDataTransEmitter } from '../trans_emitter'
export function createMCPServer() {

    const dataEmitter = defaultDataTransEmitter
    const server = new McpServer({
        name:"Miotto-mcp",
        version:'1.0.0'
    })

    const transport = new StreamableHTTPServerTransport()

    server.connect(transport)

    // server.registerTool()
    server.registerTool('get_current_playlist',{
        description:"获取当前的播放列表",
    },async ()=>{
        const tracks = dataEmitter.getData('playlist')
    })
}