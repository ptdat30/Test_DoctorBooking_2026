import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LabelList
} from 'recharts';
import './SimpleChart.css';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card p-3 shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
        <p className="text-slate-500 text-sm mb-2 font-medium border-b border-slate-100 pb-1">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 mb-1 last:mb-0">
            <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: entry.color }}></div>
            <span className="text-slate-600 text-sm font-medium flex-1">{entry.name}:</span>
            <span className="text-slate-800 font-bold text-base">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const SimpleChart = ({ 
  data, 
  type = 'line', 
  color = '#3b82f6', 
  height = 200,
  series = [] // [{ key: 'appointments', name: 'Appointments', color: '#3b82f6' }]
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center bg-slate-50/50 rounded-xl" style={{ height }}>
        <p className="text-slate-400 font-medium">No data available</p>
      </div>
    );
  }

  // Fallback for older components passing just 'color'
  const chartSeries = series.length > 0 ? series : [{ key: 'value', name: 'Value', color }];

  // Compute a Y-Axis domain that guarantees space at the bottom for Neon glow (dataMax === 0)
  const yAxisDomain = [0, (dataMax) => (dataMax === 0 ? 5 : dataMax + Math.ceil(dataMax * 0.1))];

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        {type === 'area' ? (
          <AreaChart data={data} margin={{ top: 25, right: 15, left: -20, bottom: 5 }}>
            <defs>
              {chartSeries.map((s, i) => (
                <linearGradient key={`grad-${i}`} id={`color-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={s.color} stopOpacity={0.5}/>
                  <stop offset="95%" stopColor={s.color} stopOpacity={0.0}/>
                </linearGradient>
              ))}
              {chartSeries.map((s, i) => (
                <filter key={`glow-${i}`} id={`glow-${s.key}`} x="-30%" y="-30%" width="160%" height="160%">
                  <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor={s.color} floodOpacity="0.7" />
                  <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor={s.color} floodOpacity="0.4" />
                </filter>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
            <XAxis 
              dataKey="label" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }} 
              dy={10} 
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }} 
              allowDecimals={false}
              domain={yAxisDomain}
            />
            <Tooltip content={<CustomTooltip />} />
            {chartSeries.map((s) => (
              <Area 
                key={s.key}
                type="monotone" 
                dataKey={s.key} 
                name={s.name}
                stroke={s.color} 
                strokeWidth={3}
                fillOpacity={1} 
                fill={`url(#color-${s.key})`} 
                dot={{ r: 4, strokeWidth: 2, fill: '#fff', stroke: s.color }}
                activeDot={{ r: 6, strokeWidth: 0, fill: s.color, filter: `url(#glow-${s.key})` }}
                filter={`url(#glow-${s.key})`}
                animationDuration={1500}
              />
            ))}
          </AreaChart>
        ) : type === 'stacked-bar' ? (
          <BarChart data={data} margin={{ top: 25, right: 15, left: -20, bottom: 5 }}>
            <defs>
              {chartSeries.map((s, i) => (
                <linearGradient key={`grad-${i}`} id={`color-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={s.color} stopOpacity={0.9}/>
                  <stop offset="95%" stopColor={s.color} stopOpacity={0.6}/>
                </linearGradient>
              ))}
              {chartSeries.map((s, i) => (
                <filter key={`shadow-${i}`} id={`shadow-${s.key}`} x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor={s.color} floodOpacity="0.4" />
                </filter>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
            <XAxis 
              dataKey="label" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }} 
              dy={10} 
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }} 
              allowDecimals={false}
              domain={yAxisDomain}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
            {chartSeries.map((s, idx) => (
              <Bar 
                key={s.key}
                dataKey={s.key} 
                name={s.name}
                stackId="a"
                fill={`url(#color-${s.key})`}
                radius={idx === chartSeries.length - 1 ? [6, 6, 0, 0] : [0, 0, 0, 0]} 
                maxBarSize={40}
                animationDuration={1500}
                filter={`url(#shadow-${s.key})`}
              >
                {/* Only show label on the top stack */}
                {idx === chartSeries.length - 1 && (
                   <LabelList dataKey={s.key} position="top" fill="#475569" fontSize={12} fontWeight={700} />
                )}
              </Bar>
            ))}
          </BarChart>
        ) : type === 'bar' ? (
          <BarChart data={data} margin={{ top: 25, right: 15, left: -20, bottom: 5 }}>
            <defs>
              <linearGradient id={`grad-bar-${color}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.9}/>
                <stop offset="95%" stopColor={color} stopOpacity={0.4}/>
              </linearGradient>
              <filter id={`shadow-bar-${color}`} x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor={color} floodOpacity="0.3" />
              </filter>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
            <XAxis 
              dataKey="label" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }} 
              dy={10} 
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }} 
              allowDecimals={false}
              domain={yAxisDomain}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
            <Bar 
              dataKey="value" 
              fill={`url(#grad-bar-${color})`}
              radius={[6, 6, 0, 0]} 
              maxBarSize={40}
              animationDuration={1500}
              filter={`url(#shadow-bar-${color})`}
            >
              <LabelList dataKey="value" position="top" fill="#475569" fontSize={12} fontWeight={700} />
            </Bar>
          </BarChart>
        ) : (
          <LineChart data={data} margin={{ top: 25, right: 15, left: -20, bottom: 5 }}>
            <defs>
              <filter id={`glow-line-${color}`} x="-30%" y="-30%" width="160%" height="160%">
                <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor={color} floodOpacity="0.7" />
                <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor={color} floodOpacity="0.4" />
              </filter>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
            <XAxis 
              dataKey="label" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }} 
              dy={10} 
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }} 
              allowDecimals={false}
              domain={yAxisDomain}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke={color} 
              strokeWidth={3}
              dot={{ r: 4, strokeWidth: 2, fill: '#fff', stroke: color }}
              activeDot={{ r: 6, strokeWidth: 0, fill: color, filter: `url(#glow-line-${color})` }}
              animationDuration={1500}
              filter={`url(#glow-line-${color})`}
            >
              <LabelList dataKey="value" position="top" fill="#475569" fontSize={12} fontWeight={700} offset={12} />
            </Line>
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};

export default SimpleChart;
