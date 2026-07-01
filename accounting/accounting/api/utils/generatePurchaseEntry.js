import db from '../db.js';
import { createAccountingEntry } from '../services/accounting.service.js';
import { getAccountSetting } from './accounting.js';

/**
 * صدور سند حسابداری برای فاکتور خرید
 * @param {number} purchaseId - شناسه فاکتور خرید
 */
export function generatePurchaseEntry(purchaseId) {
  const purchase = db.prepare(`
    SELECT PurchaseId, SupplierName, SupplierCode, ItemName, Quantity, UnitPrice, PurchaseDate
    FROM tblPurchase
    WHERE PurchaseId = ?
  `).get(purchaseId);

  if (!purchase) {
    console.warn(`⚠️ فاکتور خرید با شناسه ${purchaseId} یافت نشد`);
    return;
  }

  const amount = (Number(purchase.Quantity) || 0) * (Number(purchase.UnitPrice) || 0);
  if (!amount || isNaN(amount)) {
    console.warn(`⚠️ مبلغ نامعتبر برای PurchaseId ${purchaseId}`);
    return;
  }

  const debitAcc = getAccountSetting('purchaseDebitAccount');   // موجودی کالا یا هزینه
  const creditAcc = getAccountSetting('purchaseCreditAccount'); // بستانکاران یا نقدی

  if (!debitAcc || !creditAcc) {
    console.warn('⚠️ حساب‌های خرید در تنظیمات تعریف نشده‌اند');
    return;
  }

  const entryId = createAccountingEntry({
    date: purchase.PurchaseDate,
    docNumber: `PUR-${purchase.PurchaseId}`,
    description: `خرید ${purchase.ItemName} از ${purchase.SupplierName}`,
    sourceTable: 'tblPurchase',
    sourceId: purchase.PurchaseId,
    entries: [
      {
        AccountCode: debitAcc,
        DebitAmount: amount,
        CreditAmount: 0
      },
      {
        AccountCode: creditAcc,
        DebitAmount: 0,
        CreditAmount: amount,
        SubsidiaryId: purchase.SupplierCode || null
      }
    ]
  });

  console.log(`✅ سند خرید ثبت شد → EntryId ${entryId}`);
}
