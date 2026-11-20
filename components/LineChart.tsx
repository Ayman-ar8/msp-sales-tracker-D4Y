'use client';

export interface Series {
  name: string;
  color: string;
  values: (number | null)[];
}

interface Props {
  labels: string[];
  series: Series[];
  format: (v: number) => string;
  height?: number;
  ariaLabel: string;
}

const W = 640;
const PAD = { top: 12, right: 12, bottom: 28, left: 64 };

/** Small dependency-free line chart. Gaps (null) break the line. */
export function LineChart({ labels, series, format, height = 200, ariaLabel }: Props) {
  const all = series.flatMap((s) => s.values.filter((v): v is number => v !== null));
  if (!labels.length || !all.length) return <p className="muted empty">No data in this period yet.</p>;

  const max = Math.max(...all, 0);
  const min = Math.min(...all, 0);
  const span = max - min || 1;
  const innerW = W - PAD.left - PAD.right;
  const innerH = height - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + (labels.length === 1 ? innerW / 2 : (i / (labels.length - 1)) * innerW);
  const y = (v: number) => PAD.top + innerH - ((v - min) / span) * innerH;
  const ticks = [min, min + span / 2, max];
  const every = Math.max(1, Math.ceil(labels.length / 7));

  return (
    <svg viewBox={`0 0 ${W} ${height}`} role="img" aria-label={ariaLabel} className="chart">
      {ticks.map((t) => (
        <g key={t}>
          <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} className="chart-grid" />
          <text x={PAD.left - 8} y={y(t) + 4} textAnchor="end" className="chart-tick">{format(t)}</text>
        </g>
      ))}
      {labels.map((l, i) => {
        const last = labels.length - 1;
        // Label every Nth point, plus the last one when it isn't crowding the previous label.
        const show = i % every === 0 ? !(i !== last && last - i < every / 2 && last % every !== 0) : i === last;
        if (!show) return null;
        const anchor = labels.length > 1 && i === 0 ? 'start' : i === last && labels.length > 1 ? 'end' : 'middle';
        return <text key={l + i} x={x(i)} y={height - 8} textAnchor={anchor} className="chart-tick">{l}</text>;
      })}
      {series.map((s) => {
        let d = '';
        let pen = false;
        s.values.forEach((v, i) => {
          if (v === null) { pen = false; return; }
          d += `${pen ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)} `;
          pen = true;
        });
        return (
          <g key={s.name}>
            <path d={d} fill="none" stroke={s.color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
            {s.values.map((v, i) =>
              v === null ? null : (
                <circle key={i} cx={x(i)} cy={y(v)} r={labels.length > 40 ? 0 : 2.5} fill={s.color}>
                  <title>{`${s.name}, ${labels[i]}: ${format(v)}`}</title>
                </circle>
              )
            )}
          </g>
        );
      })}
    </svg>
  );
}
