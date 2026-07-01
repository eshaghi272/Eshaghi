import ItemForm from "./components/goods/ItemForm";

function GoodsPage() {
  const handleItemSubmit = async (itemData) => {
    try {
      const res = await fetch("http://localhost:5000/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(itemData)
      });
      const result = await res.json();
      console.log("✅ کالا ثبت شد:", result);
    } catch (err) {
      console.error("❌ خطا در ثبت کالا:", err);
    }
  };

  return <ItemForm onSubmit={handleItemSubmit} />;
}
