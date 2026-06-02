import { ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts';

const StatCard = ({ label, value, color, chartType = 'line', onClick, trend, chartData }) => {
  return (
    <div
      onClick={onClick}
      className="glass-card"
      style={{
        padding: '24px',
        boxShadow: `0 8px 32px 0 rgba(31, 38, 135, 0.05), 0 0 0 1px ${color}15`,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: onClick ? 'pointer' : 'default',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = `0 12px 28px rgba(79, 169, 255, 0.15), 0 0 0 1px ${color}30`;
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.25)';
          e.currentTarget.style.borderColor = `${color}40`;
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = `0 8px 32px 0 rgba(31, 38, 135, 0.05), 0 0 0 1px ${color}15`;
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
        }
      }}
    >
      {/* Gradient overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '120px',
        background: `radial-gradient(ellipse at top left, ${color}15, transparent 60%)`,
        pointerEvents: 'none'
      }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Label */}
        <p style={{
          margin: '0 0 12px 0',
          color: '#546E7A',
          fontSize: '13px',
          fontWeight: '600',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          {label}
        </p>

        {/* Value and Trend */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '16px' }}>
          <h2 style={{
            margin: '0',
            fontSize: '36px',
            background: `linear-gradient(135deg, ${color} 0%, ${color}CC 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            fontWeight: '700',
            letterSpacing: '-0.5px'
          }}>
            {value}
          </h2>
          {trend && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              borderRadius: '20px',
              backgroundColor: trend.isNeutral ? 'rgba(148, 163, 184, 0.1)' : trend.isPositive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
              color: trend.isNeutral ? '#94a3b8' : trend.isPositive ? '#10b981' : '#f43f5e',
              fontSize: '12px',
              fontWeight: '600'
            }}>
              {trend.isNeutral ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              ) : trend.isPositive ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline><polyline points="17 18 23 18 23 12"></polyline></svg>
              )}
              {trend.value}%
            </div>
          )}
        </div>

        {/* Mini Chart */}
        {chartData && chartData.length > 0 && (
          <div style={{
            height: '45px',
            marginTop: '8px',
            position: 'relative'
          }}>
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'bars' ? (
                <BarChart data={chartData}>
                  <Bar 
                    dataKey="value" 
                    fill={color} 
                    radius={[2, 2, 0, 0]} 
                    fillOpacity={0.6}
                  />
                </BarChart>
              ) : (
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id={`mini-grad-${label.replace(/\s+/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={color} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke={color} 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill={`url(#mini-grad-${label.replace(/\s+/g, '')})`} 
                    isAnimationActive={false}
                  />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
