import React from 'react';

const GradeChart = ({ grades }) => {
  // Număram frecvența fiecărei note
  const distribution = { 10: 0, 9: 0, 8: 0, 7: 0, 6: 0, 5: 0, Restante: 0 };
  
  grades.forEach(g => {
    const val = Math.floor(g.grade);
    if (val === 10) distribution[10]++;
    else if (val === 9) distribution[9]++;
    else if (val === 8) distribution[8]++;
    else if (val === 7) distribution[7]++;
    else if (val === 6) distribution[6]++;
    else if (val === 5) distribution[5]++;
    else distribution.Restante++;
  });

  const keys = ['10', '9', '8', '7', '6', '5', 'Restante'];
  const values = keys.map(k => distribution[k]);
  const maxCount = Math.max(...values, 1);

  // Dimensiuni SVG
  const width = 500;
  const height = 220;
  const paddingLeft = 32;
  const paddingRight = 16;
  const paddingTop = 24;
  const paddingBottom = 30;
  const chartHeight = height - paddingTop - paddingBottom;
  const chartWidth = width - paddingLeft - paddingRight;
  const barWidth = chartWidth / keys.length - 12;

  return (
    <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <h3 style={{ fontSize: '1rem', fontWeight: '600', margin: 0 }}>📊 Distribuția Notelor în Catalog</h3>
      {grades.length === 0 ? (
        <div style={{ height: `${chartHeight}px`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Nu sunt destule date pentru a genera statistici.
        </div>
      ) : (
        <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="auto" style={{ overflow: 'visible' }}>
          {/* Definiții gradienți */}
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent-primary)" />
              <stop offset="100%" stopColor="var(--accent-secondary)" />
            </linearGradient>
          </defs>

          {/* Linii Grid Orizontale */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
            const y = paddingTop + chartHeight * (1 - ratio);
            const val = Math.round(maxCount * ratio);
            return (
              <g key={index}>
                <line 
                  x1={paddingLeft} 
                  y1={y} 
                  x2={width - paddingRight} 
                  y2={y} 
                  stroke="var(--border-color)" 
                  strokeWidth="1" 
                  strokeDasharray="4 4" 
                />
                <text 
                  x={paddingLeft - 8} 
                  y={y + 4} 
                  fill="var(--text-secondary)" 
                  fontSize="10" 
                  fontWeight="500"
                  textAnchor="end"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Desenare Bare */}
          {keys.map((key, index) => {
            const val = distribution[key];
            const barHeight = (val / maxCount) * chartHeight;
            const x = paddingLeft + index * (chartWidth / keys.length) + 6;
            const y = height - paddingBottom - barHeight;

            return (
              <g key={key}>
                {/* Valoare numerică deasupra barei */}
                {val > 0 && (
                  <text 
                    x={x + barWidth / 2} 
                    y={y - 6} 
                    fill="var(--text-primary)" 
                    fontSize="11" 
                    fontWeight="700" 
                    textAnchor="middle"
                  >
                    {val}
                  </text>
                )}
                {/* Bara propriu-zisă */}
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight > 0 ? barHeight : 2} // bară de măcar 2px pentru vizualizare
                  rx="6"
                  fill={val > 0 ? "url(#chartGradient)" : "var(--border-color)"}
                  style={{ transition: 'all 0.3s ease-out' }}
                />
                {/* Etichetă axă X */}
                <text 
                  x={x + barWidth / 2} 
                  y={height - paddingBottom + 18} 
                  fill="var(--text-secondary)" 
                  fontSize="11" 
                  fontWeight="600" 
                  textAnchor="middle"
                >
                  {key}
                </text>
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
};

export default GradeChart;
