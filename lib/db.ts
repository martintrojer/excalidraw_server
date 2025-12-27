import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import path from 'path';
import fs from 'fs/promises';
import { getDrawingsDir } from './env';
import type { DrawingMetadata } from './types';

// Get drawings directory from environment variable
const DRAWINGS_DIR = getDrawingsDir();
const DB_PATH = path.join(DRAWINGS_DIR, 'metadata.json');

// Database schema
interface DatabaseSchema {
  drawings: DrawingMetadata[];
}

// Default data structure
const defaultData: DatabaseSchema = {
  drawings: [],
};

// Create database instance
let db: Low<DatabaseSchema> | null = null;

/**
 * Initializes the database, creating it if it doesn't exist
 * @returns The database instance
 */
export async function getDatabase(): Promise<Low<DatabaseSchema>> {
  if (db) {
    return db;
  }

  // Ensure drawings directory exists
  await fs.mkdir(DRAWINGS_DIR, { recursive: true });

  // Initialize LowDB with JSONFile adapter
  const adapter = new JSONFile<DatabaseSchema>(DB_PATH);
  db = new Low<DatabaseSchema>(adapter, defaultData);

  // Read existing data
  await db.read();

  // Ensure the data structure exists
  if (!db.data) {
    db.data = defaultData;
  }
  if (!db.data.drawings) {
    db.data.drawings = [];
  }

  return db;
}

/**
 * Ensures the database is initialized and returns the data
 * @returns The database data
 */
export async function getDatabaseData(): Promise<DatabaseSchema> {
  const database = await getDatabase();
  return database.data;
}

/**
 * Saves the database to disk
 */
export async function saveDatabase(): Promise<void> {
  const database = await getDatabase();
  await database.write();
}
