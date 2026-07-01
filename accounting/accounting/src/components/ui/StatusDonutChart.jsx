// src/components/StatusDonutChart.jsx
import PropTypes from 'prop-types';
import { Card, CardHeader, CardContent, Box, Skeleton, Typography } from '@mui/material';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip
} from 'recharts';

export default function StatusDonutChart({ title = 'وضعیت نوبت‌ها', data = [], loading = false, height = 320, emptyText = 'داده‌ای موجود نیست' }) {
  const hasData = Array.isArray(data) && data.length > 0;

  return (
    <Card>
      <CardHeader
        title={title}
        titleTypographyProps={{ variant: 'subtitle1', fontWeight: 600 }}
        sx={{ pb: 0, '& .MuiCardHeader-content': { overflow: 'hidden' } }}
      />
      <CardContent sx={{ pt: 1 }}>
        {loading ? (
          <Skeleton variant="rounded" width="100%" height={height} />
        ) : !hasData ? (
          <Box sx={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'text.secondary' }}>
            {emptyText}
          </Box>
        ) : (
          <Box sx={{ height }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={4}
                  label={({ name, percent }) => `${name} (${Math.round(percent * 100)}٪)`}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Legend
                  layout="horizontal"
                  verticalAlign="bottom"
                  align="center"
                  iconType="circle"
                  formatter={(value) => <Typography fontSize={12}>{value}</Typography>}
                />
                <Tooltip formatter={(value, name) => [`${value} نوبت`, name]} />
              </PieChart>
            </ResponsiveContainer>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

StatusDonutChart.propTypes = {
  title: PropTypes.string,
  data: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      value: PropTypes.number.isRequired,
      color: PropTypes.string
    })
  ),
  loading: PropTypes.bool,
  height: PropTypes.number,
  emptyText: PropTypes.string
};
