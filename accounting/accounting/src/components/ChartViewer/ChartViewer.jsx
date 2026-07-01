// src/components/ChartViewer/ChartViewer.jsx
import { useEffect, useState } from 'react';
import axios from 'axios';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const ChartViewer = ({ type = 'bar' }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/visits-per-doctor')
      .then((res) => setData(res.data))
      .catch((err) => console.error('خطا در دریافت داده‌ها:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>در حال بارگذاری نمودار...</div>;

  return (
    <div style={{ width: '100%', height: 350 }}>
      <ResponsiveContainer>
        {type === 'line' ? (
          <LineChart data={data}>
            <XAxis dataKey="doctor" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="appointments" stroke="#1976d2" name="نوبت‌ها" />
            <Line type="monotone" dataKey="patients" stroke="#4caf50" name="بیماران" />
          </LineChart>
        ) : (
          <BarChart data={data}>
            <XAxis dataKey="doctor" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="appointments" fill="#1976d2" name="نوبت‌ها" />
            <Bar dataKey="patients" fill="#4caf50" name="بیماران" />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};

export default ChartViewer;
