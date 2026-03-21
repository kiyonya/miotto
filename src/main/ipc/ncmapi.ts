import { ipcMain } from 'electron'
import Store from 'electron-store';
import ncmapi from 'NeteaseCloudMusicApi'
import { AppTypes } from '../../types/app';
import { LRUCache } from 'lru-cache';
import { combinor, parse } from '../utils/mlyric';

interface APIStore {
    cookies?: string,
    proxy?: string
}

export class NCMAPIService {
    private static apiStore = new Store<APIStore>({
        defaults: {
            cookies: '',
            proxy: ''
        }
    });
    private static playlistCache = new LRUCache<number, AppTypes.IPlaylist>({
        max: 10,
    });
    private static songCache = new LRUCache<number, AppTypes.ISong>({ max: 10000 });
    private static lyricCache = new LRUCache<number, AppTypes.ILyric>({ max: 200 });
    public static setCookies(cookies: string) {
        this.apiStore.set('cookies', cookies);
    }
    public static setProxy(proxy: string) {
        this.apiStore.set('proxy', proxy);
    }

    public static clearCookies() {
        this.apiStore.delete('cookies');
    }

    public static async loginQrKey() {
        const qr = await ncmapi.login_qr_key({
            proxy: this.apiStore.get('proxy')
        });
        return qr.body;
    }

    public static async loginQrCreate(unikey: string, qrimg: boolean = true) {
        const qr = await ncmapi.login_qr_create({
            key: unikey,
            qrimg: qrimg
        });
        return qr.body;
    }

    public static async loginQrCheck(unikey: string) {
        const check = await ncmapi.login_qr_check({
            key: unikey,
            proxy: this.apiStore.get('proxy')
        });
        const code = check.body.code;
        if (code === 803) {
            const cookies = check.body.cookie;
            this.apiStore.set('cookies', cookies);
        }
        return check.body;
    }

    public static async loginStatusCheck() {
        const check = await ncmapi.login_status({
            cookie: this.apiStore.get('cookies'),
            proxy: this.apiStore.get('proxy')
        });
        const checkResult = check.body as any;
        console.log(checkResult);
        const anonimousUser = checkResult.data?.account?.anonimousUser;
        const profile = checkResult.data?.profile;
        if (!profile || anonimousUser) {
            this.apiStore.delete('cookies');
        }
        return checkResult;
    }

    public static async userPlaylists(uid: number) {
        const req = await ncmapi.user_playlist({
            uid: uid,
            cookie: this.apiStore.get('cookies'),
            proxy: this.apiStore.get('proxy')
        });
        const playlists = req.body.playlist as any[];
        const result: {
            created: AppTypes.IPlaylistBrief[],
            collected: AppTypes.IPlaylistBrief[]
        } = {
            created: [],
            collected: []
        };
        for (const playlist of playlists || []) {
            const iplaylist: AppTypes.IPlaylistBrief = {
                name: playlist.name,
                id: playlist.id,
                trackCount: playlist.trackCount,
                cover: playlist.coverImgUrl,
                type: 'ncm'
            };
            const isMyCreated = playlist.creator?.userId === uid;
            if (isMyCreated) {
                result.created.push(iplaylist);
            } else {
                result.collected.push(iplaylist);
            }
        }
        return result;
    }

    public static async playlistDetail(playlistId: number, cache: boolean = true) {
        if (cache) {
            const cachePlaylist = this.playlistCache.get(playlistId);
            if (cachePlaylist) {
                return cachePlaylist;
            }
        }
        const playlistDetail = await ncmapi.playlist_detail({
            id: playlistId,
            cookie: this.apiStore.get('cookies'),
            proxy: this.apiStore.get('proxy')
        });
        const playlist = playlistDetail.body as any;
        const iplaylist: AppTypes.IPlaylist = {
            id: playlist.playlist.id,
            name: playlist.playlist.name,
            cover: playlist.playlist.coverImgUrl,
            createTime: playlist.playlist.createTime,
            updateTime: playlist.playlist.updateTime,
            trackCount: playlist.playlist.trackCount,
            description: playlist.playlist.description,
            creator: playlist.playlist.creator,
            tracks: playlist.playlist.trackIds.map(i => ({
                id: i.id,
                platform: 'ncm'
            })) || [],
            type: 'ncm',
            playCount: playlist.playlist.playCount,
            subscribed: playlist.playlist.subscribed
        };
        if (cache) {
            this.playlistCache.set(playlistId, iplaylist);
        }
        return iplaylist;
    }

    public static async songDetail(song: number | number[], cache: boolean = true): Promise<AppTypes.ISong[]> {
        const ids: number[] = Array.isArray(song) ? song : [song];
        const isongMap = new Map<number, AppTypes.ISong>();

        if (cache) {
            for (const id of ids) {
                const song = this.songCache.get(id);
                if (song) {
                    isongMap.set(id, song);
                }
            }
        }

        const noCacheSongIds: number[] = ids.filter(id => !isongMap.has(id));
        if (noCacheSongIds.length) {
            const req = await ncmapi.song_detail({
                ids: noCacheSongIds.join(','),
                cookie: this.apiStore.get('cookies'),
                proxy: this.apiStore.get('proxy')
            });
            const songs = req.body.songs as any[];
            for (const song of songs) {
                const isong = this.transNcmFullSong2ISong(song);
                const id = isong.id;
                isongMap.set(id, isong);
                if (cache) {
                    this.songCache.set(id, isong);
                }
            }
        }

        const songList: AppTypes.ISong[] = [];
        for (const id of ids) {
            const song = isongMap.get(id);
            song && songList.push(song);
        }
        return songList;
    }

    public static async songUrl(id: number, level: AppTypes.SongQuiltyLevels): Promise<AppTypes.ISongTrack> {
        const req = await ncmapi.song_url_v1({
            id: id,
            level: level as any,
            cookie: this.apiStore.get('cookies'),
            proxy: this.apiStore.get('proxy')
        });
        const track = (req.body.data as any)?.[0];
        const itrack: AppTypes.ISongTrack = {
            type: 'ncm',
            id: track.id,
            url: track.url,
            bitRate: track.br,
            sampleRate: track.sr,
            md5: track.md5,
            size: track.size,
            gain: track.gain,
            peek: track.peek,
            level: track.level,
            encodeType: track.encodeType
        };
        return itrack;
    }

    public static async songLyric(id: number): Promise<AppTypes.ILyric> {
        try {
            if (this.lyricCache.has(id)) {
                return this.lyricCache.get(id) as AppTypes.ILyric;
            }

            const req = await ncmapi.lyric_new({
                id: id,
                cookie: this.apiStore.get('cookies'),
                proxy: this.apiStore.get('proxy')
            });
            const lyricMap = req.body as any;
            const isPure: boolean = lyricMap.pureMusic;

            if (isPure) {
                const lyric = {
                    pure: true,
                    lyrics: []
                };
                this.lyricCache.set(id, lyric);
                return lyric;
            }

            const isTimelineParseMode = Boolean(lyricMap?.yrc?.lyric);
            let lyric;
            if (isTimelineParseMode) {
                const lyrics = combinor(
                    parse(lyricMap?.yrc?.lyric),
                    parse(lyricMap?.ytlrc?.lyric),
                    parse(lyricMap?.yromalrc?.lyric)
                );
                lyric = {
                    pure: false,
                    lyrics: lyrics
                };
            } else {
                const lyrics = combinor(
                    parse(lyricMap?.lrc?.lyric),
                    parse(lyricMap?.tlyric.lyric),
                    parse(lyricMap?.romalrc?.lyric)
                );
                lyric = {
                    pure: false,
                    lyrics: lyrics
                };
            }

            this.lyricCache.set(id, lyric);
            return lyric;
        } catch (error) {
            return {
                pure: true,
                lyrics: []
            }
        }
    }

    public static async artistDetail(artistId: number): Promise<AppTypes.IArtist> {
        const req = await ncmapi.artist_detail({
            id: artistId
        });
        const data = req.body.data as any;
        const artist = data.artist as any;
        const artistDetail: AppTypes.IArtist = {
            platform: 'ncm',
            name: artist.name,
            cover: artist.cover,
            avatar: artist.avatar,
            alias: artist.alias || [],
            transNames: artist.transNames || [],
            briefDesc: artist.briefDesc,
            musicSize: artist.musicSize,
            ablumSize: artist.albumSize,
            mvSize: artist.mvSize,
            id: artist.id
        };
        return artistDetail;
    }

    public static async artistHotSong(artistId: number, cache: boolean = true): Promise<AppTypes.ISong[]> {
        const req = await ncmapi.artists({
            id: artistId,
            cookie: this.apiStore.get('cookies'),
            proxy: this.apiStore.get('proxy')
        });
        const hotSongs = req.body.hotSongs as any[];
        const ids: number[] = hotSongs.map(i => i.id);
        const isongMap = new Map<number, AppTypes.ISong>();

        if (cache) {
            for (const id of ids) {
                const song = this.songCache.get(id);
                if (song) {
                    isongMap.set(id, song);
                }
            }
        }

        const noCacheSongIds: number[] = ids.filter(id => !isongMap.has(id));
        if (noCacheSongIds.length) {
            const req = await ncmapi.song_detail({
                ids: noCacheSongIds.join(','),
                cookie: this.apiStore.get('cookies'),
                proxy: this.apiStore.get('proxy')
            });
            const songs = req.body.songs as any[];
            for (const song of songs) {
                const isong = this.transNcmFullSong2ISong(song);
                const id = isong.id;
                isongMap.set(id, isong);
                if (cache) {
                    this.songCache.set(id, isong);
                }
            }
        }

        const songList: AppTypes.ISong[] = [];
        for (const id of ids) {
            const song = isongMap.get(id);
            song && songList.push(song);
        }
        return songList;
    }

    public static async artistAlbum(artistId: number, limit: number = 30, offset: number = 0): Promise<AppTypes.IAlbum[]> {
        const req = await ncmapi.artist_album({
            id: artistId,
            limit: limit,
            offset: offset,
            cookie: this.apiStore.get('cookies'),
            proxy: this.apiStore.get('proxy')
        });
        const hotAlbums = req.body.hotAlbums as any[];
        const albums: AppTypes.IAlbum[] = [];

        for (const album of hotAlbums) {
            const artists: AppTypes.IArtistBrief[] = (album.artists || []).map(i => ({
                name: i.name,
                id: i.id,
                alias: i.alias || [],
                tns: i.tns || [],
                platform: 'ncm'
            }));

            const ialbum: AppTypes.IAlbum = {
                name: album.name,
                id: album.id,
                type: album.type,
                cover: album.picUrl,
                company: album.company,
                publishTime: album.publishTime,
                artist: {
                    name: album.artist.name,
                    id: album.artist.id,
                    alias: album.artist.alias || [],
                    tns: album.artist.tns || [],
                    platform: 'ncm'
                },
                artists: artists
            };
            albums.push(ialbum);
        }
        return albums;
    }

    public static async artistSimi(artistId: number): Promise<AppTypes.IArtist[]> {
        const req = await ncmapi.simi_artist({
            id: artistId,
            cookie: this.apiStore.get('cookies'),
            proxy: this.apiStore.get('proxy')
        });
        const artists = req.body.artists as any[];
        const iartists: AppTypes.IArtist[] = [];

        for (const artist of artists) {
            const iartist: AppTypes.IArtist = {
                id: artist.id,
                name: artist.name,
                cover: artist.picUrl,
                avatar: artist.img1v1Url,
                alias: artist.alias || [],
                ablumSize: artist.albumSize,
                musicSize: artist.musicSize,
                mvSize: artist.mvSize,
                briefDesc: '',
                transNames: artist.tns || [],
                platform: 'ncm'
            };
            iartists.push(iartist);
        }
        return iartists;
    }

    public static async recommendSongs(): Promise<AppTypes.INCMSong[]> {
        const req = await ncmapi.recommend_songs({
            cookie: this.apiStore.get('cookies'),
            proxy: this.apiStore.get('proxy')
        });
        const data = req.body.data as any;
        const dailySongs = data.dailySongs as any[];
        const songs = dailySongs.map(song => this.transNcmFullSong2ISong(song));
        return songs;
    }

    public static async recommendPlaylists(): Promise<AppTypes.IPlaylistBrief[]> {
        const req = await ncmapi.recommend_resource({
            cookie: this.apiStore.get('cookies'),
            proxy: this.apiStore.get('proxy')
        });
        const rec = req.body.recommend as any[];
        const iplaylists: AppTypes.IPlaylistBrief[] = [];

        for (const pl of rec) {
            iplaylists.push({
                name: pl.name,
                id: pl.id,
                cover: pl.picUrl,
                trackCount: pl.trackCount,
                type: 'ncm'
            });
        }
        return iplaylists;
    }

    public static async recommendHomepage(
        blockOrderList: AppTypes.NCMTypes.HomePageBlockCodeOrder[] | AppTypes.NCMTypes.HomePageBlockCodeOrder = [],
        refresh: boolean = false
    ) {
        const orderList = Array.isArray(blockOrderList) ? blockOrderList : [blockOrderList];
        const cursor = { blockCodeOrderList: orderList };
        const req = await ncmapi.homepage_block_page({
            cursor: JSON.stringify(cursor),
            refresh: refresh,
            cookie: this.apiStore.get('cookies'),
            proxy: this.apiStore.get('proxy')
        });
        return req.body;
    }

    public static async recommendStyleSongs(refresh: boolean = false, cache: boolean = true): Promise<AppTypes.INCMSong[]> {
        const orderList: AppTypes.NCMTypes.HomePageBlockCodeOrder[] = ['HOMEPAGE_BLOCK_STYLE_RCMD'];
        const cursor = { blockCodeOrderList: orderList };
        const req = await ncmapi.homepage_block_page({
            cursor: JSON.stringify(cursor),
            refresh: refresh,
            cookie: this.apiStore.get('cookies'),
            proxy: this.apiStore.get('proxy')
        });
        const data = req.body.data as any;
        const exposedResource = data.exposedResource as string;

        try {
            if (!exposedResource) { return []; }
            const parsed = JSON.parse(exposedResource) as { song: string[], playlist: string[] };
            const sids = parsed.song.map(Number);

            const isongMap = new Map<number, AppTypes.INCMSong>();
            const requestIds: number[] = [];

            if (cache) {
                for (const id of sids) {
                    const song = this.songCache.get(id);
                    if (song && song.type === 'ncm') {
                        isongMap.set(id, song as AppTypes.INCMSong);
                    } else {
                        requestIds.push(id);
                    }
                }
            }

            if (requestIds.length) {
                const r = await ncmapi.song_detail({
                    ids: requestIds.join(','),
                    cookie: this.apiStore.get('cookies'),
                    proxy: this.apiStore.get('proxy')
                });
                const songs = r.body.songs as any[];
                for (const song of songs) {
                    const isong = this.transNcmFullSong2ISong(song);
                    const id = isong.id;
                    isongMap.set(id, isong);
                    if (cache) {
                        this.songCache.set(id, isong);
                    }
                }
            }

            const songList: AppTypes.INCMSong[] = [];
            for (const id of sids) {
                const song = isongMap.get(id);
                song && songList.push(song);
            }
            return songList;
        } catch (error) {
            console.error(error);
            return [];
        }
    }

    public static async searchSuggest(keyword: string): Promise<AppTypes.ISearchSuggest> {
        const mobileReq = ncmapi.search_suggest({
            keywords: keyword,
            type: "mobile" as any,
            cookie: this.apiStore.get('cookies'),
            proxy: this.apiStore.get('proxy')
        })
        const pcReq = ncmapi.search_suggest({
            keywords: keyword,
            type: "pc" as any,
            cookie: this.apiStore.get('cookies'),
            proxy: this.apiStore.get('proxy')
        })
        const [mobileRes, pcRes] = await Promise.all([mobileReq, pcReq])
        const result: AppTypes.ISearchSuggest = {
            keywords: [],
            songs: [],
            playlists: [],
            albums: []
        }
        const keywordsResult = mobileRes.body.result as { allMatch: any[] }
        for (const match of keywordsResult.allMatch || []) {
            result.keywords.push({
                keyword: match.keyword,
                platform: 'ncm'
            })
        }
        const pcResult = pcRes.body.result as any
        if (pcResult.songs && Array.isArray(pcResult.songs)) {
            for (const song of pcResult.songs) {
                result.songs.push({
                    id: song.id,
                    name: song.name,
                    platform: 'ncm'
                })
            }
        }
        if (pcResult.albums && Array.isArray(pcResult.albums)) {
            for (const album of pcResult.albums) {
                result.albums.push({
                    name: album.name,
                    id: album.id,
                    platform: 'ncm'
                })
            }
        }
        if (pcResult.playlists && Array.isArray(pcResult.playlists)) {
            for (const playlist of pcResult.playlists) {
                result.playlists.push({
                    name: playlist.name,
                    id: playlist.id,
                    platform: 'ncm'
                })
            }
        }
        return result
    }

    public static async searchMatchSuggestKeywords(keyword: string): Promise<AppTypes.SearchMatchKeyword[]> {
        const req = await ncmapi.search_suggest({
            keywords: keyword,
            type: "mobile" as any,
            cookie: this.apiStore.get('cookies'),
            proxy: this.apiStore.get('proxy')
        })
        const result = req.body.result as { allMatch: any[] }
        const allMatch = result.allMatch || []
        const kws: AppTypes.SearchMatchKeyword[] = []
        for (const match of allMatch) {
            kws.push({
                keyword: match.keyword,
                platform: 'ncm'
            })
        }
        return kws
    }

    public static async searchResultComplex(keyword: string): Promise<AppTypes.ISearchComplex> {
        const req = await ncmapi.search({
            keywords: keyword,
            limit: 30,
            type: 1018,
            cookie: this.apiStore.get('cookies'),
            proxy: this.apiStore.get('proxy')
        })
        const result = req.body.result as any
        const processed: AppTypes.ISearchComplex = {
            songs: (result?.song?.songs || []).map(this.transNcmFullSong2ISong),
            playlists: (result?.playList?.playLists || []).map(this.transNcmPlaylist2IPlaylistBrief),
            albums: (result?.album?.albums || []).map(this.transNcmAlbum2IAlbumBrief),
            artists: (result?.artist?.artists || []).map(this.transNcmArtist2IArtistBrief)
        }
        return processed
    }

    public static async audioFingerprintMatch(afp: string, duration: number = 3) {
        const req = await ncmapi.audio_match({
            duration: duration,
            audioFP: afp
        })
        const data = req.body.data as any
        const result = data.result as any[]
        if (!result) { return [] }
        const songs = result.map(i => i.song)
        return songs.map(this.transNcmFullSong2ISong)
    }

    public static async album(albumId: number): Promise<{ songs: AppTypes.ISong[], album: AppTypes.IAlbum }> {
        const req = await ncmapi.album({
            id: albumId,
            cookie: this.apiStore.get('cookies'),
            proxy: this.apiStore.get('proxy')
        })
        const data = req.body as any
        const songs = (data.songs || []) as any[]
        const isongs = songs.map(this.transNcmFullSong2ISong)
        const album: AppTypes.IAlbum = {
            name: data?.album.name,
            description: data?.album?.description,
            publishTime: data?.album?.publishTime,
            company: data?.album?.company,
            id: data?.album?.id,
            cover: data?.album?.picUrl,
            artist: this.transNcmArtist2IArtistBrief(data?.album?.artist),
            artists: (data?.album?.artists || []).map(this.transNcmArtist2IArtistBrief)
        }
        const albumCover = album.cover
        for (const song of isongs) {
            song.cover = albumCover,
                song.album.cover = albumCover
        }
        return {
            album: album,
            songs: isongs
        }
    }


    private static transNcmFullSong2ISong(song: any): AppTypes.INCMSong {
        const artistsProp = song.ar || song.artists
        const artists: AppTypes.IArtistBrief[] = artistsProp.map((a: any) => {
            return {
                id: a.id,
                name: a.name,
                tns: a.tns,
                alias: a.alias,
                platform: 'ncm'
            };
        });
        const ablumProp = song.al || song.album
        const album = {
            id: ablumProp.id,
            name: ablumProp.name,
            cover: ablumProp.picUrl,
            tns: ablumProp.tns,
        }
        const isong: AppTypes.INCMSong = {
            type: 'ncm',
            name: song.name,
            mainTitle: song.mainTitle,
            additionalTitle: song.additionalTitle,
            id: song.id,
            artists: artists,
            album: album,
            cover: ablumProp.picUrl,
            mv: song.mv || null,
            tns: song.tns || song.transNames || [],
            duration: (song.dt || song.duration) / 1000
        };
        return isong;
    }

    private static transNcmPlaylist2IPlaylistBrief(playlist: any): AppTypes.IPlaylistBrief {
        const iplaylist: AppTypes.IPlaylistBrief = {
            cover: playlist?.picUrl || playlist.coverImgUrl || '',
            name: playlist.name,
            id: playlist.id,
            type: 'ncm',
            trackCount: playlist.trackCount
        }
        return iplaylist
    }

    private static transNcmAlbum2IAlbumBrief(album: any): AppTypes.IAlbumBrief {
        const ialbum: AppTypes.IAlbumBrief = {
            name: album.name,
            id: album.id,
            tns: album.transNames || album.tns || [],
            cover: album.coverImgUrl || album.picUrl || album.blurPicUrl || ''
        }
        return ialbum
    }

    private static transNcmArtist2IArtistBrief(artist: any): AppTypes.IArtistBrief {
        const iar: AppTypes.IArtistBrief = {
            name: artist.name,
            id: artist.id,
            tns: artist.transNames || artist.tns || [],
            alias: artist.alias || [],
            platform: 'ncm',
            avatar: artist.picUrl || artist.img1v1Url || undefined
        }
        return iar
    }




    public static clearAllCaches() {
        this.playlistCache.clear();
        this.songCache.clear();
        this.lyricCache.clear();
    }

    public static getCacheStats() {
        return {
            playlistCache: this.playlistCache.size,
            songCache: this.songCache.size,
            lyricCache: this.lyricCache.size
        };
    }
}


export function registerNCMApiIPC() {
    ipcMain.handle('ncmapi:loginQrKey', async (_) => {
        return await NCMAPIService.loginQrKey();
    });

    ipcMain.handle('ncmapi:loginQrCreate', async (_, unikey: string, qrimg: boolean = true) => {
        return await NCMAPIService.loginQrCreate(unikey, qrimg);
    });

    ipcMain.handle('ncmapi:loginQrCheck', async (_, unikey: string) => {
        return await NCMAPIService.loginQrCheck(unikey);
    });

    ipcMain.handle('ncmapi:loginStatusCheck', async (_) => {
        return await NCMAPIService.loginStatusCheck();
    });


    ipcMain.handle('ncmapi:userPlaylists', async (_, uid: number) => {
        return await NCMAPIService.userPlaylists(uid);
    });


    ipcMain.handle('ncmapi:playlistDetail', async (_, playlistId: number, cache: boolean = true) => {
        return await NCMAPIService.playlistDetail(playlistId, cache);
    });

    ipcMain.handle('ncmapi:songDetail', async (_, song: number | number[], cache: boolean = true) => {
        return await NCMAPIService.songDetail(song, cache);
    });

    ipcMain.handle('ncmapi:songUrl', async (_, id: number, level: AppTypes.SongQuiltyLevels) => {
        return await NCMAPIService.songUrl(id, level);
    });

    ipcMain.handle('ncmapi:songLyric', async (_, id: number) => {
        return await NCMAPIService.songLyric(id);
    });

    ipcMain.handle('ncmapi:artistDetail', async (_, artistId: number) => {
        return await NCMAPIService.artistDetail(artistId);
    });

    ipcMain.handle('ncmapi:artistHotSong', async (_, artistId: number, cache: boolean = true) => {
        return await NCMAPIService.artistHotSong(artistId, cache);
    });

    ipcMain.handle('ncmapi:artistAlbum', async (_, artistId: number, limit: number = 30, offset: number = 0) => {
        return await NCMAPIService.artistAlbum(artistId, limit, offset);
    });

    ipcMain.handle('ncmapi:artistSimi', async (_, artistId: number) => {
        return await NCMAPIService.artistSimi(artistId);
    });

    ipcMain.handle('ncmapi:recommendSongs', async (_) => {
        return await NCMAPIService.recommendSongs();
    });

    ipcMain.handle('ncmapi:recommendPlaylists', async (_) => {
        return await NCMAPIService.recommendPlaylists();
    });

    ipcMain.handle('ncmapi:recommendHomepage', async (
        _,
        blockOrderList: AppTypes.NCMTypes.HomePageBlockCodeOrder[] | AppTypes.NCMTypes.HomePageBlockCodeOrder = [],
        refresh: boolean = false
    ) => {
        return await NCMAPIService.recommendHomepage(blockOrderList, refresh);
    });

    ipcMain.handle('ncmapi:recommendStyleSongs', async (_, refresh: boolean = false, cache: boolean = true) => {
        return await NCMAPIService.recommendStyleSongs(refresh, cache);
    });

    ipcMain.handle('ncmapi:searchSuggest', async (_, keyword: string) => {
        return await NCMAPIService.searchSuggest(keyword)
    })

    ipcMain.handle('ncmapi:searchMatchSuggestKeywords', async (_, keyword: string) => {
        return await NCMAPIService.searchMatchSuggestKeywords(keyword)
    })

    ipcMain.handle('ncmapi:searchResultComplex', async (_, keyword: string) => {
        return await NCMAPIService.searchResultComplex(keyword)
    })

    ipcMain.handle('ncmapi:audioFingerprintMatch', async (_, afp: string, duration: number) => {
        return await NCMAPIService.audioFingerprintMatch(afp, duration)
    })

    ipcMain.handle('ncmapi:album', async (_, albumId: number) => {
        return await NCMAPIService.album(albumId)
    })
}