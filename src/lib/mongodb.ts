// src/lib/mongodb.ts - نسخه نهایی و اصلاح شده

import { MongoClient, Db } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI;
// ✅ از یک دیتابیس واحد برای همه چیز استفاده می‌کنیم
const DB_NAME = process.env.DB_NAME || 'dao-vc';

if (!MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(MONGODB_URI);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  client = new MongoClient(MONGODB_URI);
  clientPromise = client.connect();
}

// ✅ NEW: تابع کمکی برای دریافت آبجکت db
let dbInstance: Db | null = null;
export async function getDb(): Promise<Db> {
  if (dbInstance) {
    return dbInstance;
  }
  const client = await clientPromise;
  dbInstance = client.db(DB_NAME);
  return dbInstance;
}

export default clientPromise;