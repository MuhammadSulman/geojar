import SQLite from 'react-native-sqlite-storage';
import {v4 as uuid} from 'uuid';
import {Place, CategoryName} from '@/types';
import {CATEGORIES} from '@/constants/categories';
import {getDatabase} from './db';

interface PlaceRow {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  category: string;
  note: string | null;
  emoji: string;
  is_favorite: number;
  created_at: string;
  updated_at: string;
}

function rowToPlace(row: PlaceRow): Place {
  return {
    id: row.id,
    name: row.name,
    latitude: row.latitude,
    longitude: row.longitude,
    category: row.category as CategoryName,
    note: row.note ?? undefined,
    emoji: row.emoji,
    isFavorite: row.is_favorite === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function extractRows<T>(results: [SQLite.ResultSet]): T[] {
  const rows: T[] = [];
  const {rows: resultRows} = results[0];
  for (let i = 0; i < resultRows.length; i++) {
    rows.push(resultRows.item(i) as T);
  }
  return rows;
}

export async function getAllPlaces(): Promise<Place[]> {
  const db = await getDatabase();
  const results = await db.executeSql(
    'SELECT * FROM places ORDER BY created_at DESC;',
  );
  return extractRows<PlaceRow>(results).map(rowToPlace);
}

export async function getPlaceById(id: string): Promise<Place | null> {
  const db = await getDatabase();
  const results = await db.executeSql('SELECT * FROM places WHERE id = ?;', [
    id,
  ]);
  const rows = extractRows<PlaceRow>(results);
  return rows.length > 0 ? rowToPlace(rows[0]) : null;
}

export async function createPlace(
  data: Omit<Place, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<Place> {
  const db = await getDatabase();
  const id = uuid();
  const now = new Date().toISOString();

  await db.executeSql(
    `INSERT INTO places (id, name, latitude, longitude, category, note, emoji, is_favorite, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      id,
      data.name,
      data.latitude,
      data.longitude,
      data.category,
      data.note ?? null,
      data.emoji,
      data.isFavorite ? 1 : 0,
      now,
      now,
    ],
  );

  return {
    ...data,
    id,
    createdAt: now,
    updatedAt: now,
  };
}

export async function updatePlace(
  id: string,
  data: Partial<Place>,
): Promise<Place> {
  const db = await getDatabase();
  const now = new Date().toISOString();

  const fields: string[] = [];
  const values: (string | number | null)[] = [];

  if (data.name !== undefined) {
    fields.push('name = ?');
    values.push(data.name);
  }
  if (data.latitude !== undefined) {
    fields.push('latitude = ?');
    values.push(data.latitude);
  }
  if (data.longitude !== undefined) {
    fields.push('longitude = ?');
    values.push(data.longitude);
  }
  if (data.category !== undefined) {
    fields.push('category = ?');
    values.push(data.category);
  }
  if (data.note !== undefined) {
    fields.push('note = ?');
    values.push(data.note ?? null);
  }
  if (data.emoji !== undefined) {
    fields.push('emoji = ?');
    values.push(data.emoji);
  }
  if (data.isFavorite !== undefined) {
    fields.push('is_favorite = ?');
    values.push(data.isFavorite ? 1 : 0);
  }

  fields.push('updated_at = ?');
  values.push(now);
  values.push(id);

  await db.executeSql(
    `UPDATE places SET ${fields.join(', ')} WHERE id = ?;`,
    values,
  );

  const updated = await getPlaceById(id);
  if (!updated) {
    throw new Error(`Place with id ${id} not found after update`);
  }
  return updated;
}

export async function deletePlace(id: string): Promise<void> {
  const db = await getDatabase();
  await db.executeSql('DELETE FROM places WHERE id = ?;', [id]);
}

export async function searchPlaces(
  query: string,
  category?: CategoryName,
): Promise<Place[]> {
  const db = await getDatabase();
  const pattern = `%${query}%`;

  let sql = 'SELECT * FROM places WHERE (name LIKE ? OR note LIKE ?)';
  const params: (string | number)[] = [pattern, pattern];

  if (category) {
    sql += ' AND category = ?';
    params.push(category);
  }

  sql += ' ORDER BY created_at DESC;';

  const results = await db.executeSql(sql, params);
  return extractRows<PlaceRow>(results).map(rowToPlace);
}

export async function getPlacesByCategory(
  category: CategoryName,
): Promise<Place[]> {
  const db = await getDatabase();
  const results = await db.executeSql(
    'SELECT * FROM places WHERE category = ? ORDER BY created_at DESC;',
    [category],
  );
  return extractRows<PlaceRow>(results).map(rowToPlace);
}

export async function getFavoritePlaces(): Promise<Place[]> {
  const db = await getDatabase();
  const results = await db.executeSql(
    'SELECT * FROM places WHERE is_favorite = 1 ORDER BY created_at DESC;',
  );
  return extractRows<PlaceRow>(results).map(rowToPlace);
}

export async function toggleFavorite(id: string): Promise<boolean> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  await db.executeSql(
    'UPDATE places SET is_favorite = 1 - is_favorite, updated_at = ? WHERE id = ?;',
    [now, id],
  );
  const results = await db.executeSql(
    'SELECT is_favorite FROM places WHERE id = ?;',
    [id],
  );
  const row = results[0].rows.length > 0 ? results[0].rows.item(0) : null;
  return row ? row.is_favorite === 1 : false;
}

export async function getAllPlacesForExport(): Promise<Place[]> {
  const db = await getDatabase();
  const results = await db.executeSql(
    'SELECT * FROM places ORDER BY created_at ASC;',
  );
  return extractRows<PlaceRow>(results).map(rowToPlace);
}

export interface ImportResult {
  imported: number;
  skipped: number;
}

const VALID_CATEGORY_NAMES = new Set<string>(CATEGORIES.map(c => c.name));

function isValidPlace(p: unknown): p is Place {
  if (!p || typeof p !== 'object') {
    return false;
  }
  const r = p as Record<string, unknown>;
  if (typeof r.name !== 'string' || r.name.trim() === '') {
    return false;
  }
  if (
    typeof r.latitude !== 'number' ||
    !Number.isFinite(r.latitude) ||
    r.latitude < -90 ||
    r.latitude > 90
  ) {
    return false;
  }
  if (
    typeof r.longitude !== 'number' ||
    !Number.isFinite(r.longitude) ||
    r.longitude < -180 ||
    r.longitude > 180
  ) {
    return false;
  }
  if (typeof r.category !== 'string' || !VALID_CATEGORY_NAMES.has(r.category)) {
    return false;
  }
  if (typeof r.emoji !== 'string' || r.emoji === '') {
    return false;
  }
  return true;
}

export async function importPlaces(places: unknown[]): Promise<ImportResult> {
  const db = await getDatabase();
  const valid: Place[] = [];
  let skipped = 0;
  for (const p of places) {
    if (isValidPlace(p)) {
      valid.push(p);
    } else {
      skipped++;
    }
  }
  if (valid.length === 0) {
    return {imported: 0, skipped};
  }

  await new Promise<void>((resolve, reject) => {
    db.transaction(
      (tx: SQLite.Transaction) => {
        const now = new Date().toISOString();
        for (const p of valid) {
          const id = p.id || uuid();
          tx.executeSql(
            `INSERT OR REPLACE INTO places (id, name, latitude, longitude, category, note, emoji, is_favorite, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
            [
              id,
              p.name,
              p.latitude,
              p.longitude,
              p.category,
              p.note ?? null,
              p.emoji,
              p.isFavorite ? 1 : 0,
              p.createdAt || now,
              p.updatedAt || now,
            ],
          );
        }
      },
      (err: unknown) => reject(err),
      () => resolve(),
    );
  });

  return {imported: valid.length, skipped};
}

export async function deleteAllPlaces(): Promise<void> {
  const db = await getDatabase();
  await db.executeSql('DELETE FROM places;');
}
