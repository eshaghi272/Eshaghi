// src/components/KpiCard.jsx
import { Card, CardContent, Typography, Stack, Skeleton } from '@mui/material';

export default function KpiCard({ title, value, subtitle, loading, color = 'primary' }) {
  return (
    <Card elevation={0} sx={{ border: theme => `1px solid ${theme.palette.divider}` }}>
      <CardContent>
        <Stack spacing={1}>
          <Typography variant="overline" color="text.secondary">{title}</Typography>
          {loading ? (
            <Skeleton width="60%" height={36} />
          ) : (
            <Typography variant="h5" color={`${color}.main`}>{value}</Typography>
          )}
          {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
        </Stack>
      </CardContent>
    </Card>
  );
}
