import React, { useState } from "react";
import DocumentNumberInput from "./DocumentNumberInput";

export default function JournalEntryForm() {
    const [docNumber, setDocNumber] = useState("");
    const [triggerNewDoc, setTriggerNewDoc] = useState(0);

    const handleNewDoc = () => {
        setTriggerNewDoc((prev) => prev + 1); // باعث می‌شود شماره سند جدید گرفته شود
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log("شماره سند ثبت شده:", docNumber);
        // اینجا می‌توانی داده را به API سند حسابداری بفرستی
    };

    return (
        <form onSubmit={handleSubmit} className="p-4 border rounded">
            <h2 className="text-lg font-bold mb-4">ثبت سند حسابداری</h2>

            <DocumentNumberInput
                apiUrl="http://localhost:5000/api/journalentries/last"
                value={docNumber}
                onChange={setDocNumber}
                triggerNewDoc={triggerNewDoc}
                className="mb-4"
            />

            <button
                type="button"
                onClick={handleNewDoc}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 mr-2"
            >
                سند جدید
            </button>

            <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
                ثبت
            </button>
        </form>
    );
}
