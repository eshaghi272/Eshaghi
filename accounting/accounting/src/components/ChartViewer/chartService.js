// src/components/ChartViewer/chartService.ts
import axios from 'axios';
import { ChartDataPoint } from './types';

export const fetchChartData = async (): Promise<ChartDataPoint[]> => {
  const response = await axios.get('/api/chart-data');
  return response.data;
};
