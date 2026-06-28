
import { useEffect, useState } from "react";
const format = (val) =>
  Number(val || 0).toLocaleString("fa-IR", { maximumFractionDigits: 0 });

function AccountRow({ node, level = 0, onShowJournals }) {
  const [expanded, setExpanded] = useState(false);
  const indent = { paddingRight: `${level * 2}rem` };

  const format = (val) => Number(val || 0).toLocaleString("fa-IR");

  const levelName = level === 0 ? "گروه" : level === 1 ? "کل" : "معین";

  return (
    <>
      <tr
        onClick={() => setExpanded(!expanded)}
        style={{ cursor: node.children.length > 0 ? "pointer" : "default" }}
      >
        <td style={indent}>
          {node.TitleFa}
          {level === 2 && (
            <button
              className="ml-2 text-blue-600 underline"
              onClick={(e) => {
                e.stopPropagation();
                onShowJournals(node.AccountCode);
              }}
            >
              📜 نمایش اسناد
            </button>
          )}
        </td>
        <td>{node.AccountCode}</td>
        <td>{levelName}</td>
        <td className="text-right">{format(node.TotalDebit)}</td>
        <td className="text-right">{format(node.TotalCredit)}</td>
        <td className="text-right">{format(node.Balance)}</td>
      </tr>

      {expanded &&
        node.children.map((child) => (
          <AccountRow
            key={child.AccountCode}
            node={child}
            level={level + 1}
            onShowJournals={onShowJournals}
          />
        ))}
    </>
  );
}

export default function TrialBalanceTreeTable() {
  const [tree, setTree] = useState([]);
  const [journals, setJournals] = useState([]);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [entryDetails, setEntryDetails] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/trialbalance/tree")
      .then((res) => res.json())
      .then(setTree)
      .catch(() => {});
  }, []);

  const showJournals = async (accountCode) => {
    const res = await fetch(
      `http://localhost:5000/api/trialbalance/journals/${accountCode}`
    );
    const data = await res.json();
    setJournals(data);
    setSelectedEntry(null);
    setEntryDetails([]);
  };

  const showEntryDetails = async (entryId) => {
    const res = await fetch(
      `http://localhost:5000/api/trialbalance/journal/${entryId}`
    );
    const data = await res.json();
    setEntryDetails(data);
    setSelectedEntry(entryId);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h2 className="text-xl font-bold mb-4">
        📊 تراز آزمایشی چندسطحی (گروه → کل → معین → اسناد)
      </h2>

      <table className="min-w-full text-sm text-right border">
        <thead>
          <tr>
            <th>عنوان حساب</th>
            <th>کد حساب</th>
            <th>سطح</th>
            <th>بدهکار</th>
            <th>بستانکار</th>
            <th>مانده</th>
          </tr>
        </thead>
        <tbody>
          {tree.map((node) => (
            <AccountRow
              key={node.AccountCode}
              node={node}
              onShowJournals={showJournals}
            />
          ))}
        </tbody>
      </table>

      {journals.length > 0 && (
        <>
          <h3 className="mt-6 font-bold">📜 اسناد حسابداری معین</h3>
          <table className="min-w-full text-sm border mt-2">
            <thead>
              <tr>
                <th>شماره سند</th>
                <th>تاریخ</th>
                <th>شرح</th>
                <th>بدهکار</th>
                <th>بستانکار</th>
              </tr>
            </thead>
            <tbody>
              {journals.map((j) => (
                <tr
                  key={j.EntryId}
                  onClick={() => showEntryDetails(j.EntryId)}
                  style={{ cursor: "pointer" }}
                  className={
                    selectedEntry === j.EntryId ? "bg-yellow-100" : ""
                  }
                >
                  <td>{j.DocumentNumber}</td>
                  <td>{j.EntryDate}</td>
                  <td>{j.Description}</td>
                  <td className="text-right">{format(j.Debit)}</td>
                  <td className="text-right">{format(j.Credit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {entryDetails.length > 0 && (
        <>
          <h3 className="mt-6 font-bold">🔎 جزئیات سند انتخاب‌شده</h3>
          <table className="min-w-full text-sm border mt-2">
            <thead>
              <tr>
                <th>کد حساب</th>
                <th>عنوان حساب</th>
                <th>بدهکار</th>
                <th>بستانکار</th>
              </tr>
            </thead>
            <tbody>
              {entryDetails.map((line) => (
                <tr key={line.LineId}>
                  <td>{line.AccountCode}</td>
                  <td>{line.TitleFa}</td>
                  <td className="text-right">{format(line.DebitAmount)}</td>
                  <td className="text-right">{format(line.CreditAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
