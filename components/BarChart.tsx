export function BarChart({ data, label }: { data: { day: string; value: number }[]; label: string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div>
      <div className="bars" role="img" aria-label={label}>
        {data.map((d) => (
          <div key={d.day} className="bar" style={{ height: `${(d.value / max) * 100}%` }} title={`${d.day} : ${d.value}`} />
        ))}
      </div>
      <div className="legend"><span>{data[0]?.day}</span><span>max {max}</span><span>{data.at(-1)?.day}</span></div>
    </div>
  );
}
