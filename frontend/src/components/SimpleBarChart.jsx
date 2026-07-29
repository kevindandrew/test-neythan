import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useTheme } from '../theme/ThemeContext';

function CustomTooltip({ active, payload, label, valuePrefix }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 shadow-md text-sm">
      <p className="text-slate-500 dark:text-slate-400 mb-0.5">{label}</p>
      <p className="font-semibold text-slate-800 dark:text-slate-100">
        {valuePrefix}
        {Number(payload[0].value).toFixed(2)}
      </p>
    </div>
  );
}

export default function SimpleBarChart({ data, valuePrefix = '', height = 260 }) {
  const { theme } = useTheme();
  const esOscuro = theme === 'dark';
  const colorGrid = esOscuro ? '#334155' : '#e2e8f0';
  const colorTick = esOscuro ? '#94a3b8' : '#64748b';
  const colorCursor = esOscuro ? '#450a0a80' : '#fef2f2';

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap="30%">
        <CartesianGrid vertical={false} stroke={colorGrid} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 12, fill: colorTick }}
          axisLine={{ stroke: colorGrid }}
          tickLine={false}
        />
        <YAxis tick={{ fontSize: 12, fill: colorTick }} axisLine={false} tickLine={false} width={48} />
        <Tooltip
          content={<CustomTooltip valuePrefix={valuePrefix} />}
          cursor={{ fill: colorCursor }}
        />
        <Bar dataKey="value" fill="#dc2626" radius={[4, 4, 0, 0]} maxBarSize={24} />
      </BarChart>
    </ResponsiveContainer>
  );
}
