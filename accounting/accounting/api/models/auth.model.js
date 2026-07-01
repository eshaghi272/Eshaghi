import db from '../db.js';
import { hash } from '../core/hash.js';

export function findUserByNationalCode(nationalCode) {
  return db.prepare(`SELECT * FROM tblusers WHERE nationalCode = ?`).get(nationalCode.trim());
}

export function findDoctorByNationalCode(nationalCode) {
  return db.prepare(`SELECT * FROM tbldoctors WHERE nationalCode = ?`).get(nationalCode.trim());
}

export function findPatientByNationalCode(nationalCode) {
  return db.prepare(`SELECT * FROM tblpatients WHERE nationalCode = ?`).get(nationalCode.trim());
}

export async function createUserFromDoctorOrPatient({ nationalCode, doctor, patient }, dbInstance = db) {
  const role = doctor ? 2 : patient ? 4 : null;
  if (!role) return null;

  const firstName = doctor?.firstName ?? patient?.firstName ?? '';
  const lastName = doctor?.lastName ?? patient?.lastName ?? '';
  const rawPassword = Math.floor(100000 + Math.random() * 900000).toString();
  const passwordHash = await hash(rawPassword);

  const userName = nationalCode.trim();
  const phoneNumber = doctor?.phoneNumber ?? patient?.phoneNumber ?? `09${nationalCode.slice(1)}`;
  const email = doctor?.email ?? patient?.email ?? `user${nationalCode}@clinic.local`;

  const imageUrl = doctor?.imageUrl ?? patient?.imageUrl ?? null;
  const groupid = doctor?.groupid ?? patient?.groupid ?? null;
  const address = doctor?.address ?? patient?.address ?? null;
  const meta = doctor?.meta ?? patient?.meta ?? null;

  const exists = dbInstance.prepare(`
    SELECT 1 FROM tblusers WHERE userName = ? OR phoneNumber = ? OR email = ?
  `).get(userName, phoneNumber, email);

  if (exists) {
    console.warn('❌ کاربری با اطلاعات مشابه قبلاً ثبت شده');
    return null;
  }

  dbInstance.prepare(`
    INSERT INTO tblusers (
      firstName, lastName, nationalCode, userName,
      phoneNumber, email, imageUrl, groupid, meta,
      passwordHash, role, status, createdAt, updatedAt, address
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', DATETIME('now'), DATETIME('now'), ?
    )
  `).run(
    firstName.trim(),
    lastName.trim(),
    nationalCode.trim(),
    userName,
    phoneNumber.trim(),
    email.trim(),
    imageUrl,
    groupid,
    meta ? JSON.stringify(meta) : null,
    passwordHash,
    role,
    address?.trim() ?? null
  );

  const user = dbInstance.prepare(`SELECT * FROM tblusers WHERE nationalCode = ?`).get(nationalCode.trim());
  return { user, rawPassword };
}

export async function resetUserPassword(userId) {
  const rawPassword = Math.floor(100000 + Math.random() * 900000).toString();
  const passwordHash = await hash(rawPassword);

  db.prepare(`
    UPDATE tblusers SET passwordHash = ?, updatedAt = DATETIME('now') WHERE id = ?
  `).run(passwordHash, userId);

  return rawPassword;
}
