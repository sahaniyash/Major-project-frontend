"use client"

import {
  ResponsiveContainer,
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ScatterChart,
  Scatter,
  ZAxis,
  LineChart as RechartsLineChart,
  Line,
} from "recharts"
import { BarChart as RechartsBarChart, Bar } from "recharts"
import { PieChart as RechartsPieChart, Pie, Cell } from "recharts"

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"]

export function AreaChart({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsAreaChart data={data}>
        <defs>
          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="date" />
        <YAxis />
        <CartesianGrid strokeDasharray="3 3" />
        <Tooltip />
        <Area type="monotone" dataKey="value" stroke="#8884d8" fillOpacity={1} fill="url(#colorValue)" />
      </RechartsAreaChart>
    </ResponsiveContainer>
  )
}

export function BarChart({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsBarChart data={data}>
        <XAxis dataKey="category" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="value" fill="#8884d8" />
      </RechartsBarChart>
    </ResponsiveContainer>
  )
}

export function PieChart({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsPieChart>
        <Pie data={data} cx="50%" cy="50%" labelLine={false} outerRadius={80} fill="#8884d8" dataKey="value">
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
      </RechartsPieChart>
    </ResponsiveContainer>
  )
}

export function ScatterPlot({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
        <CartesianGrid />
        <XAxis type="number" dataKey="x" name="x" unit="" />
        <YAxis type="number" dataKey="y" name="y" unit="" />
        <ZAxis type="number" dataKey="z" range={[64, 144]} name="z" unit="" />
        <Tooltip cursor={{ strokeDasharray: "3 3" }} />
        <Scatter name="Values" data={data} fill="#8884d8" />
      </ScatterChart>
    </ResponsiveContainer>
  )
}

export function LineChart({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsLineChart data={data}>
        <XAxis dataKey="date" />
        <YAxis />
        <CartesianGrid strokeDasharray="3 3" />
        <Tooltip />
        <Line type="monotone" dataKey="value" stroke="#8884d8" />
      </RechartsLineChart>
    </ResponsiveContainer>
  )
}

export function HeatMap({ data }: { data: any[] }) {
  const uniqueX = Array.from(new Set(data.map((item) => item.x)))
  const uniqueY = Array.from(new Set(data.map((item) => item.y)))

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsAreaChart data={data}>
        <XAxis dataKey="x" type="category" />
        <YAxis dataKey="y" type="category" />
        <Tooltip />
        <Area type="step" dataKey="value" stroke="#8884d8" fill="#8884d8" />
      </RechartsAreaChart>
    </ResponsiveContainer>
  )
}

