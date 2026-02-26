
import fse from 'fs-extra'
import path from 'path'
import { windowManager } from './window'
import httpServer from 'http-server'
import { Server } from 'http'

interface WebBrowserOptions {
    userAgent?: string
}

interface MiniPlayerManifest {
    name: string,
    version: string,
    author?: string,
    url?: string,
    thumbnail?: string,
    dev: {
        openDevTool: boolean,
        port: number,
        openLocalServer?: boolean,
    },
    window?: {
        width?: number,
        height?: number,
        x?: number,
        y?: number,
        frame?: boolean,
        browser?: WebBrowserOptions,
    },
    entry: string
}

export async function createPluginProject(projectDir: string, projectName: string, devPort: number) {
    const manifestJSON: MiniPlayerManifest = {
        name: projectName || "YOUR MINI PROJECT",
        version: "1.0.0",
        author: "YOUR NAME",
        url: "www.example.com",
        dev: {
            openDevTool: true,
            port: devPort || 3000
        },
        window: {
            width: 500,
            height: 250,
            frame: true,
        },
        entry: 'index.html'
    }
    fse.ensureDir(projectDir)
    await fse.writeFile(path.join(projectDir, 'manifest.json'), JSON.stringify(manifestJSON, null, 4), 'utf-8')
}

export async function runPluginProject(manifest: string, openOnDev: boolean = false) {

    if (!fse.existsSync(manifest)) { throw new Error('manifest not found') }
    try {
        const manifestJSON: MiniPlayerManifest = JSON.parse(fse.readFileSync(manifest, 'utf-8'))
        if (!manifestJSON.name || !manifestJSON.entry || !manifestJSON.version) {
            throw new Error('NO MANIFEST')
        }
        const window = windowManager.createWindow(manifestJSON.name, {
            width: manifestJSON.window?.width || 500,
            height: manifestJSON.window?.height || 250,
            x: manifestJSON.window?.x || undefined,
            y: manifestJSON.window?.y || undefined,
            frame: manifestJSON.window?.frame ?? true,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: true,
                webSecurity: true,
                preload: path.join(__dirname, '../preload/plugin.mjs'),
            }
        }, 'plugin')

        if (openOnDev && manifestJSON.dev) {
            const localPort = manifestJSON.dev.port || 3000

            if (manifestJSON.dev.openDevTool) {
                window.webContents.openDevTools()
            }

            if (manifestJSON.dev.openLocalServer) {
                const server = await createDevServer(path.dirname(manifest), localPort)
                manifestJSON.dev.port = localPort
                if (server) {
                    console.log('Server Running On ' + localPort)
                }
            }

            if (!manifestJSON.dev.port) {
                if (manifestJSON.entry.startsWith('http://') || manifestJSON.entry.startsWith('https://')) {
                    throw new Error('Entry URL is not supported, please use local file path or enable dev mode')
                }
                const entryPath = path.isAbsolute(manifestJSON.entry) ? manifestJSON.entry : path.join(path.dirname(manifest), manifestJSON.entry)
                await window.loadFile(entryPath)
            }
            else {
                await window.loadURL(`http://localhost:${localPort}`, {
                    userAgent: manifestJSON.window?.browser?.userAgent || undefined
                })
            }

        } else {
            if (manifestJSON.entry.startsWith('http://') || manifestJSON.entry.startsWith('https://')) {
                throw new Error('Entry URL is not supported, please use local file path or enable dev mode')
            }
            const entryPath = path.isAbsolute(manifestJSON.entry) ? manifestJSON.entry : path.join(path.dirname(manifest), manifestJSON.entry)
            await window.loadFile(entryPath)
        }

    } catch (error) {
        console.error('Failed to run plugin project:', error)
        throw error
    }
}

function createDevServer(root: string, port: number) {
    return new Promise<Server>((resolve, reject) => {
        const server = httpServer.createServer({
            root,
            cache: 3600,
            headers: {
                'Access-Control-Allow-Origin': '*'
            },
            robots: 'noindex, nofollow, noarchive, nosnippet, noodp, noydir',
            gzip: true
        })
        server.listen(port, 'localhost', () => {
            resolve(server)
        })
        server.on('error', reject)
    })

}