import SQLite from 'react-native-sqlite-storage';
import {
  CREATE_PLACES_TABLE,
  CREATE_CATEGORIES_TABLE,
  SEED_CATEGORIES,
} from './schema';

SQLite.enablePromise(true);

let dbInstance: SQLite.SQLiteDatabase | null = null;

async function runMigrations(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.executeSql('PRAGMA journal_mode=WAL;');
  await db.executeSql(CREATE_PLACES_TABLE);
  await db.executeSql(CREATE_CATEGORIES_TABLE);
  for (const sql of SEED_CATEGORIES) {
    await db.executeSql(sql);
  }
}

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) {
    return dbInstance;
  }

  const db = await SQLite.openDatabase({
    name: 'geojar.db',
    location: 'default',
  });

  await runMigrations(db);
  dbInstance = db;
  return db;
}
