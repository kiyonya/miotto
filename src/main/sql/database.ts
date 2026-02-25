import BetterSqlite3 from 'better-sqlite3'
import fse from 'fs-extra';
import path from 'path';

export interface CreateDatabaseOptions<Statements> {
    dbPath: string,
    tables?: Record<string, string>,
    statements: Record<keyof Statements, string>,
    readonly?: boolean,
    timeout?: number,
    verbose?: boolean
}

export default abstract class ImpDatabase<Statements = {}> {
    protected db: BetterSqlite3.Database;
    private statementDefinations: Record<keyof Statements, string>
    private statements = new Map<keyof Statements, BetterSqlite3.Statement>();
    protected tables: Record<string, string> = {}

    constructor(options: CreateDatabaseOptions<Statements>) {
        const dbPath = options.dbPath
        this.statementDefinations = options.statements
        fse.ensureDirSync(path.dirname(dbPath));
        this.db = new BetterSqlite3(dbPath);

        if (options.readonly === true) {
            this.db.exec('PRAGMA query_only = ON;');
        }
        this.db.exec('PRAGMA foreign_keys = ON;');
        this.db.exec('PRAGMA journal_mode = WAL;');
        this.db.exec('PRAGMA synchronous = NORMAL;');
        if (options.timeout) {
            this.db.exec(`PRAGMA busy_timeout = ${options.timeout};`);
        }

        if (options.tables) {
            this.tables = options.tables
        }
        this.initialize();
        this.prepareStatements()
    }
    private initialize() {
        const schemas = Object.values(this.tables)
        schemas.forEach(schema => {
            try {
                this.db.exec(schema);
            } catch (error) {
                console.error('初始化数据库表失败:', error);
                throw error;
            }
        });
    }
    private prepareStatements() {
        for (const [key, sql] of Object.entries(this.statementDefinations)) {
            try {
                const statement = this.db.prepare(sql as string);
                this.statements.set(key as keyof Statements, statement);
            } catch (error) {
                console.error(`准备语句 ${key} 失败:`, error);
            }
        }
    }
    public getStatement(key: keyof Statements): BetterSqlite3.Statement {
        const stmt = this.statements.get(key)
        if (!stmt) { throw new Error(`cannot find stmt ${String(key)}`) }
        return stmt
    }
    public beginTransaction(): void {
        this.db.exec('BEGIN TRANSACTION');
    }
    public commit(): void {
        this.db.exec('COMMIT');
    }
    public rollback(): void {
        this.db.exec('ROLLBACK');
    }
    public close() {
        this.db.close()
    }
}
