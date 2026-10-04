"use client"

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { AdminStats } from "@/lib/stats"
import { sourceLabel } from "@/lib/constants"

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-1)",
]

const TOOLTIP_STYLE = {
  backgroundColor: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: "12px",
  fontSize: "12px",
  boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
  color: "var(--popover-foreground)",
}

export function ChartCard({
  title,
  subtitle,
  children,
  className,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${className ?? ""}`} aria-label={title}>
      <header>
        <h2 className="text-sm font-bold text-slate-900">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
      </header>
      <div className="mt-4 h-64">{children}</div>
    </section>
  )
}

// --- 1. Registrations over time: daily bars + cumulative line -----------------

export function OverTimeChart({ data }: { data: AdminStats["overTime"] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={data} margin={{ top: 6, right: 6, bottom: 0, left: -18 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey="day"
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          tickLine={false}
          axisLine={{ stroke: "var(--border)" }}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          formatter={(value: number | string, name: string) => [
            value,
            name === "daily" ? "Daily registrations" : "Cumulative",
          ]}
          labelFormatter={(_, payload) => payload?.[0]?.payload?.label ?? ""}
        />
        <Legend
          formatter={(value: string) => (
            <span className="text-xs text-slate-500">
              {value === "daily" ? "Daily" : "Cumulative"}
            </span>
          )}
        />
        <Bar dataKey="daily" fill="var(--chart-1)" radius={[5, 5, 0, 0]} maxBarSize={34} />
        <Line
          type="monotone"
          dataKey="cumulative"
          stroke="var(--chart-4)"
          strokeWidth={2.5}
          dot={{ r: 3, fill: "var(--chart-4)" }}
          activeDot={{ r: 5 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}

// --- 2. Registrations by source (horizontal bars) ------------------------------

export function SourceChart({ data }: { data: AdminStats["bySource"] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 12, bottom: 0, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
        <XAxis
          type="number"
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <YAxis
          type="category"
          dataKey="label"
          width={110}
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          formatter={(value: number | string) => [value, "Registrations"]}
        />
        <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={22}>
          {data.map((_, i) => (
            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

// --- 3. Referral vs direct (donut) ---------------------------------------------

export function ReferralSplitChart({ data }: { data: AdminStats["referralVsDirect"] }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value: number | string, name: string) => [value, name]} />
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius="58%"
          outerRadius="85%"
          paddingAngle={3}
          strokeWidth={0}
        >
          <Cell fill="var(--chart-1)" />
          <Cell fill="var(--chart-3)" />
        </Pie>
        <Legend
          formatter={(value: string, entry) => {
            const item = data.find((d) => d.name === value)
            return (
              <span className="text-xs text-slate-600">
                {value} · <span className="font-bold tabular-nums">{item?.value ?? entry?.payload?.value}</span>
              </span>
            )
          }}
        />
        <text
          x="50%"
          y="46%"
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-slate-900"
          style={{ fontSize: 26, fontWeight: 800 }}
        >
          {total}
        </text>
        <text
          x="50%"
          y="56%"
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-slate-500"
          style={{ fontSize: 11 }}
        >
          total
        </text>
      </PieChart>
    </ResponsiveContainer>
  )
}

// --- 4. Top colleges (horizontal bars) -----------------------------------------

export function TopCollegesChart({ data }: { data: AdminStats["topColleges"] }) {
  const trimmed = data.map((d) => ({
    ...d,
    shortName: d.college.length > 26 ? `${d.college.slice(0, 24)}…` : d.college,
  }))
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={trimmed} layout="vertical" margin={{ top: 0, right: 12, bottom: 0, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
        <XAxis
          type="number"
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <YAxis
          type="category"
          dataKey="shortName"
          width={150}
          tick={{ fontSize: 10.5, fill: "var(--muted-foreground)" }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          formatter={(value: number | string) => [value, "Registrations"]}
          labelFormatter={(label: string, payload) => payload?.[0]?.payload?.college ?? label}
        />
        <Bar dataKey="count" fill="var(--chart-1)" radius={[0, 6, 6, 0]} maxBarSize={18} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function sourceName(source: string): string {
  return sourceLabel(source)
}
