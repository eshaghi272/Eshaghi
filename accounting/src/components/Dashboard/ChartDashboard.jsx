import { useEffect, useState } from 'react';
import axios from 'axios';
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const ChartDashboard = () => {
  const [barData, setBarData] = useState(null);
  const [pieData, setPieData] = useState(null);

  useEffect(() => {
    axios.get('http://localhost:5000/api/dashboard/charts')
      .then(res => {
        setBarData(res.data.bar);
        setPieData(res.data.pie);
      })
      .catch(err => console.error('❌ خطا در دریافت داده‌های نمودار:', err));
  }, []);

  return (
    <div className="p-6" dir="rtl">
      <h1 className="text-2xl font-bold mb-6">داشبورد آماری</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {barData && (
          <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
            <h2 className="text-lg font-semibold mb-4">نمودار میله‌ای فروش ماهانه</h2>
            <Bar data={barData} options={{ responsive: true }} />
          </div>
        )}

        {pieData && (
          <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
            <h2 className="text-lg font-semibold mb-4">نمودار دایره‌ای سهم بازار</h2>
            <Pie data={pieData} options={{ responsive: true }} />
          </div>
        )}
      </div>
    </div>
  );
};

export default ChartDashboard;
