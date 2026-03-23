declare module NeteaseCloudMusicApi {
    export interface APIBaseResponse {
        code: number
        cookie: string
        [index: string]: unknown
    }
    export interface Response<Body = APIBaseResponse> {
        status: number // The Http Response Code
        body: Body // API Response body
        cookie: string[]
    }
    export interface RequestBaseConfig {
        cookie?: string
        realIP?: string // IPv4/IPv6 filled in X-Real-IP
        proxy?: string // HTTP proxy
    }
    export function song_dynamic_cover(params: { id: string | number } & RequestBaseConfig): Promise<Response>
}
