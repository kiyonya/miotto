import sqlite3 from "node:sqlite";
import fse from 'fs-extra'
import path from "node:path";

type SqliteDatabaseOptions<TableList extends Array<string> = [], StmtList extends Array<string> = []> = {
    tables: Record<TableList[number], string>
} & (StmtList extends []
    ? { stmts?: Record<StmtList[number], string> }
    : { stmts: Record<StmtList[number], string> })

export default abstract class SqliteDatabase<TableList extends Array<string> = [], StmtList extends Array<string> = []> {
    private db: sqlite3.DatabaseSync
    private tables: Record<TableList[number], string>
    private stmtSqls: StmtList extends [] ? Record<string, never> | undefined : Record<StmtList[number], string>;
    private stmts = new Map<StmtList[number], sqlite3.StatementSync>()
    constructor(pathLike: string, opt: SqliteDatabaseOptions<TableList, StmtList>) {
        const dir = path.dirname(pathLike)
        fse.ensureDirSync(dir)
        this.db = new sqlite3.DatabaseSync(pathLike)
        this.tables = opt.tables
        if (opt.stmts) {
            this.stmtSqls = opt.stmts as any;
        } else {
            this.stmtSqls = undefined as any;
        }
        this.init()
    }
    private init() {
        for (const sql of Object.values(this.tables)) {
            this.db.exec(sql as string);
        }
        if (this.stmtSqls) {
            for (const [stmtName, stmtsql] of Object.entries(this.stmtSqls)) {
                try {
                    const ns = this.db.prepare(stmtsql as string)
                    this.stmts.set(stmtName, ns)
                } catch (error) {
                }
            }
        }
    }
    public stmt(name: StmtList[number]): sqlite3.StatementSync {
        const i = this.stmts.get(name)
        if (i) { return i }
        else {
            throw new Error(`Statement ${name} Not Found`)
        }
    }
    public close() {
        this.db.close()
    }
    public location() {
        return this.db.location()
    }
    public getDB() {
        return this.db  
    }
    public beginTransaction() {
        this.db.exec('BEGIN TRANSACTION;');
    }

    public commitTransaction() {
        this.db.exec('COMMIT TRANSACTION;');
    }

    public rollbackTransaction() {
        this.db.exec('ROLLBACK TRANSACTION;');
    }
}

