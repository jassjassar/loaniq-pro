import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

export default function ScenarioCharts({ schedules }) {
  const chartData = schedules[0]?.schedule.map((row, index) => ({
    month: row.month,
    [schedules[0].label]: row.balance,
    ...(schedules[1] ? { [schedules[1].label]: schedules[1].schedule[index]?.balance ?? 0 } : {})
  })) ?? [];

  return (
    <section className="panel chart-panel">
      <div>
        <p className="eyebrow">Interest Savings</p>
        <h2>Principal reduction over time</h2>
      </div>
      <div className="chart-shell">
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={chartData} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="scenarioA" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.75} />
                <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.04} />
              </linearGradient>
              <linearGradient id="scenarioB" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#84cc16" stopOpacity={0.7} />
                <stop offset="95%" stopColor="#84cc16" stopOpacity={0.04} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#d8e2ee" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
            <Legend />
            {schedules[0] ? <Area type="monotone" dataKey={schedules[0].label} stroke="#0284c7" fill="url(#scenarioA)" /> : null}
            {schedules[1] ? <Area type="monotone" dataKey={schedules[1].label} stroke="#65a30d" fill="url(#scenarioB)" /> : null}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
