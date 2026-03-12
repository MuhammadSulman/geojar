import {v4 as uuid} from 'uuid';
import {Place, CategoryName} from '@/types';
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

export async function toggleFavorite(
  id: string,
  current: boolean,
): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  await db.executeSql(
    'UPDATE places SET is_favorite = ?, updated_at = ? WHERE id = ?;',
    [current ? 0 : 1, now, id],
  );
}

export async function getAllPlacesForExport(): Promise<Place[]> {
  const db = await getDatabase();
  const results = await db.executeSql(
    'SELECT * FROM places ORDER BY created_at ASC;',
  );
  return extractRows<PlaceRow>(results).map(rowToPlace);
}

export async function importPlaces(places: Place[]): Promise<void> {
  const db = await getDatabase();
  for (const p of places) {
    const id = p.id || uuid();
    const now = new Date().toISOString();
    await db.executeSql(
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
}

export async function deleteAllPlaces(): Promise<void> {
  const db = await getDatabase();
  await db.executeSql('DELETE FROM places;');
}
