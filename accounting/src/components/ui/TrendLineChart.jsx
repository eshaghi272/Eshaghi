// src/components/TrendLineChart.jsx
import PropTypes from 'prop-types';
import { Card, CardHeader, CardContent, Box, Skeleton, useTheme } from '@mui/material';
import {  ResponsiveContainer,  LineChart,  Line,  CartesianGrid,
     XAxis,  YAxis,  Tooltip,  Legend
} from 'recharts';

export default function TrendLineChart({
  title = 'نمودار روند',
  data = [],
  xKey,
  series = [],
  loading = false,
  xTickFormatter = (v) => v,
  yTickFormatter = (v) => v,
  height = 320,
  emptyText = 'داده‌ای برای نمایش نیست'
}) {
  const theme = useTheme();
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
          <Box sx={{ height }}>
            <Skeleton variant="rounded" width="100%" height={height} />
          </Box>
        ) : !hasData ? (
          <Box
            sx={{
              height,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'text.secondary',
              fontSize: 14
            }}
          >
            {emptyText}
          </Box>
        ) : (
          <Box sx={{ height, direction: 'rtl' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data}
                margin={{ top: 8, right: 16, bottom: 8, left: 8 }}
              >
                <CartesianGrid
                  stroke={theme.palette.mode === 'dark' ? '#2f3b45' : '#e5eaf2'}
                  strokeDasharray="3 3"
                />
                <XAxis
                  dataKey={xKey}
                  tickFormatter={xTickFormatter}
                  tick={{ fontSize: 12 }}
                  axisLine={{ stroke: theme.palette.divider }}
                  tickLine={{ stroke: theme.palette.divider }}
                />
                <YAxis
                  tickFormatter={yTickFormatter}
                  tick={{ fontSize: 12 }}
                  width={56}
                  axisLine={{ stroke: theme.palette.divider }}
                  tickLine={{ stroke: theme.palette.divider }}
                />
                <Tooltip
                  content={(props) => (
                    <CustomTooltip
                      {...props}
                      xTickFormatter={xTickFormatter}
                      yTickFormatter={yTickFormatter}
                      theme={theme}
                    />
                  )}
                />
                <Legend
                  verticalAlign="top"
                  height={28}
                  iconType="circle"
                  wrapperStyle={{
                    direction: 'rtl',
                    paddingBottom: 8,
                    fontSize: 12
                  }}
                />
                {series.map((s) => (
                  <Line
                    key={s.dataKey}
                    type="monotone"
                    dataKey={s.dataKey}
                    name={s.name}
                    stroke={s.color || theme.palette.primary.main}
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                    activeDot={{ r: 4 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

TrendLineChart.propTypes = {
  title: PropTypes.string,
  data: PropTypes.arrayOf(PropTypes.object),
  xKey: PropTypes.string.isRequired,
  series: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      dataKey: PropTypes.string.isRequired,
      color: PropTypes.string
    })
  ),
  loading: PropTypes.bool,
  xTickFormatter: PropTypes.func,
  yTickFormatter: PropTypes.func,
  height: PropTypes.number,
  emptyText: PropTypes.string
};

function CustomTooltip({ active, label, payload, xTickFormatter, yTickFormatter, theme }) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <Box
      sx={{
        p: 1,
        borderRadius: 1,
        border: `1px solid ${theme.palette.divider}`,
        bgcolor: theme.palette.background.paper,
        boxShadow: theme.shadows[2],
        direction: 'rtl',
        minWidth: 160
      }}
    >
      <Box sx={{ fontSize: 12, color: 'text.secondary', mb: 0.5 }}>
        {xTickFormatter ? xTickFormatter(label) : label}
      </Box>
      {payload.map((item) => (
        <Box
          key={item.dataKey}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            fontSize: 13,
            mb: 0.5
          }}
        >
          <span
            style={{
              display: 'inline-block',
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: item.color || item.stroke || theme.palette.primary.main
            }}
          />
          <span style={{ color: theme.palette.text.primary }}>
            {item.name}:
          </span>
          <span style={{ color: theme.palette.text.secondary }}>
            {yTickFormatter ? yTickFormatter(item.value) : item.value}
          </span>
        </Box>
      ))}
    </Box>
  );
}
