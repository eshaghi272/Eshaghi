import db from './db.js';

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS tblusers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      firstName TEXT NOT NULL,
      lastName TEXT NOT NULL,
      userName TEXT NOT NULL UNIQUE,
      nationalCode TEXT NOT NULL UNIQUE,
      phoneNumber TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      imageUrl TEXT,
      groupid TEXT,
      meta TEXT,
      passwordHash TEXT NOT NULL,
      role INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      createdAt TEXT NOT NULL DEFAULT (DATETIME('now')),
      updatedAt TEXT NOT NULL DEFAULT (DATETIME('now')),
      address TEXT
    );

    CREATE TABLE IF NOT EXISTS tblpersons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nationalCode TEXT NOT NULL UNIQUE,
      firstName TEXT NOT NULL,
      lastName TEXT NOT NULL,
      phoneNumber TEXT,
      email TEXT,
      birthDate TEXT,
      gender TEXT CHECK(gender IN ('0','1', '2')),
      address TEXT,
      createdAt TEXT DEFAULT (DATETIME('now')),
      updatedAt TEXT DEFAULT (DATETIME('now'))
    );

    CREATE TABLE IF NOT EXISTS tblaccount_groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS tblgeneral_ledgers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      group_id INTEGER NOT NULL,
      FOREIGN KEY (group_id) REFERENCES tblaccount_groups(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS tblsubsidiary_ledgers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      general_id INTEGER NOT NULL,
      FOREIGN KEY (general_id) REFERENCES tblgeneral_ledgers(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS tbldetailed_ledgers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      subsidiary_id INTEGER NOT NULL,
      FOREIGN KEY (subsidiary_id) REFERENCES tblsubsidiary_ledgers(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS tblaccounting_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL CHECK(length(date) >= 8),
      description TEXT,
      debit INTEGER NOT NULL DEFAULT 0 CHECK(debit >= 0),
      credit INTEGER NOT NULL DEFAULT 0 CHECK(credit >= 0),
      detailed_ledger_id INTEGER NOT NULL,
      FOREIGN KEY (detailed_ledger_id) REFERENCES tbldetailed_ledgers(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS tblcontactmessages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      message TEXT NOT NULL,
      reply TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log('✅ جداول دیتابیس با موفقیت ساخته شدند.');
}
