import {CATEGORIES} from '@/constants/categories';

export const CREATE_PLACES_TABLE = `
  CREATE TABLE IF NOT EXISTS places (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    category TEXT NOT NULL,
    note TEXT,
    emoji TEXT NOT NULL,
    is_favorite INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`;

export const CREATE_CATEGORIES_TABLE = `
  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL UNIQUE,
    color TEXT NOT NULL,
    emoji TEXT NOT NULL
  );
`;

export const SEED_CATEGORIES = CATEGORIES.map(
  c =>
    `INSERT OR IGNORE INTO categories (id, name, color, emoji) VALUES ('${c.id}', '${c.name}', '${c.color}', '${c.emoji}');`,
);
