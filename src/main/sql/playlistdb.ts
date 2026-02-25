import { app } from "electron";
import ImpDatabase from "./database";
import path from "path";

export class CustomPlaylistDatabase extends ImpDatabase {
    constructor() {
        super({
            dbPath: path.join(app.getPath('appData'), 'database', 'playlists.db'),
            tables: {
                playlists: `CREATE TABLE IF NOT EXISTS playlists (
                id INTEGER PRIMARY KEY AUTOINCREMENT UNIQUE,
                playlist_id VARCHAR(255) NOT NULL UNIQUE,
                cover TEXT,
                name TEXT NOT NULL,
                create_time INTEGER NOT NULL,
                update_time INTEGER NOT NULL,
                track_count INTEGER NOT NULL,
                description TEXT,
                )`,
                songs: `CREATE TABLE IF NOT EXISTS songs (
                id INTEGER PRIMARY KEY AUTOINCREMENT UNIQUE,
                type ENUM('local','ncm','bili')
                song_id TEXT NOT NULL UNIQUE,
                song_data TEXT NOT NULL,
                )`
            },
            //加入本地音乐 buildtrack war id -, insertIntoPlst(id)
            statements: {

            }
        })
    }
}

const customPlaylistDatabase = new CustomPlaylistDatabase()
export { customPlaylistDatabase }