export default function InvoiceSummary({ total, discount }) {
  const final = total - Number(discount || 0);

  return (
    <div className="flex justify-end items-center gap-x-6 text-sm text-gray-800 dark:text-gray-100 pt-2 border-t">
      <span>جمع کل: <strong>{total.toLocaleString("fa-IR")} تومان</strong></span>
      <span>تخفیف: <strong>{Number(discount).toLocaleString("fa-IR")} تومان</strong></span>
      <span>مبلغ نهایی: <strong>{final.toLocaleString("fa-IR")} تومان</strong></span>
    </div>
  );
}
