import SQLite from 'react-native-sqlite-storage';
import {CATEGORIES} from '@/constants/categories';
import {
  CREATE_PLACES_TABLE,
  CREATE_CATEGORIES_TABLE,
  INSERT_CATEGORY_SQL,
} from './schema';

SQLite.enablePromise(true);

let dbInstance: SQLite.SQLiteDatabase | null = null;
let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

type Migration = (db: SQLite.SQLiteDatabase) => Promise<void>;

const MIGRATIONS: Migration[] = [
  async db => {
    await db.executeSql(CREATE_PLACES_TABLE);
    await db.executeSql(CREATE_CATEGORIES_TABLE);
    for (const c of CATEGORIES) {
      await db.executeSql(INSERT_CATEGORY_SQL, [c.id, c.name, c.color, c.emoji]);
    }
  },
];

async function getUserVersion(db: SQLite.SQLiteDatabase): Promise<number> {
  const [res] = await db.executeSql('PRAGMA user_version;');
  return res.rows.item(0).user_version ?? 0;
}

async function runMigrations(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.executeSql('PRAGMA journal_mode=WAL;');
  const current = await getUserVersion(db);
  for (let v = current; v < MIGRATIONS.length; v++) {
    await MIGRATIONS[v](db);
    await db.executeSql(`PRAGMA user_version = ${v + 1};`);
  }
}

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) {
    return dbInstance;
  }
  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = (async () => {
    try {
      const db = await SQLite.openDatabase({
        name: 'geojar.db',
        location: 'default',
      });
      await runMigrations(db);
      dbInstance = db;
      return db;
    } catch (e) {
      dbPromise = null;
      throw e;
    }
  })();

  return dbPromise;
}
