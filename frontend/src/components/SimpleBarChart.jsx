import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

function CustomTooltip({ active, payload, label, valuePrefix }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-md text-sm">
      <p className="text-slate-500 mb-0.5">{label}</p>
      <p className="font-semibold text-slate-800">
        {valuePrefix}
        {Number(payload[0].value).toFixed(2)}
      </p>
    </div>
  );
}

export default function SimpleBarChart({ data, valuePrefix = '', height = 260 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap="30%">
        <CartesianGrid vertical={false} stroke="#e2e8f0" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 12, fill: '#64748b' }}
          axisLine={{ stroke: '#e2e8f0' }}
          tickLine={false}
        />
        <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} width={48} />
        <Tooltip
          content={<CustomTooltip valuePrefix={valuePrefix} />}
          cursor={{ fill: '#fef2f2' }}
        />
        <Bar dataKey="value" fill="#dc2626" radius={[4, 4, 0, 0]} maxBarSize={24} />
      </BarChart>
    </ResponsiveContainer>
  );
}
