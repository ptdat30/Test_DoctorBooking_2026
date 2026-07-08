import { Minus, TrendingDown, TrendingUp } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts';

const StatCard = ({ label, value, color, chartType = 'line', onClick, trend, chartData }) => {
  const gradId = `stat-${label.replace(/\s+/g, '-')}`;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={`app-card text-left w-full p-5 sm:p-6 relative overflow-hidden transition-shadow hover:shadow-md ${
        onClick ? 'cursor-pointer' : 'cursor-default'
      }`}
    >
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
        style={{ backgroundColor: color }}
      />

      <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-2 pl-2">
        {label}
      </p>

      <div className="flex items-baseline gap-3 mb-3 pl-2">
        <span className="text-3xl sm:text-4xl font-bold tracking-tight text-neutral-900">
          {value}
        </span>
        {trend && (
          <span
            className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-semibold ${
              trend.isNeutral
                ? 'bg-neutral-100 text-neutral-500'
                : trend.isPositive
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-rose-50 text-rose-700'
            }`}
          >
            {trend.isNeutral ? (
              <Minus className="w-3 h-3" />
            ) : trend.isPositive ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {trend.value}%
          </span>
        )}
      </div>

      {chartData?.length > 0 && (
        <div className="h-11 pl-2">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'bars' ? (
              <BarChart data={chartData}>
                <Bar dataKey="value" fill={color} radius={[2, 2, 0, 0]} fillOpacity={0.45} />
              </BarChart>
            ) : (
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={color}
                  strokeWidth={2}
                  fill={`url(#${gradId})`}
                  isAnimationActive={false}
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      )}
    </button>
  );
};

export default StatCard;
