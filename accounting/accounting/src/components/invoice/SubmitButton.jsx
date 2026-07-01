export default function SubmitButton({ onSubmit }) {
  return (
    <div className="text-left mt-6">
      <button onClick={onSubmit} className="px-6 py-2 rounded bg-blue-700 text-white hover:bg-blue-800">
        🧾 ثبت فاکتور 
      </button>
    </div>
  );
}
