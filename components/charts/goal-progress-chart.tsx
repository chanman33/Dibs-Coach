"use client";

import { PieChart, Pie, ResponsiveContainer, Cell, Legend, Tooltip } from 'recharts';

type GoalProgressChartProps = {
  data: {
    name: string;
    value: number;
  }[];
};

const COLORS = ['#0088FE', '#00C49F', '#FF8042'];

export function GoalProgressChart({ data }: GoalProgressChartProps) {
  // Don't render if no data
  if (!data || !data.length || data.every(item => item.value === 0)) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <p className="text-sm text-muted-foreground">No data available</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          innerRadius={30}
          outerRadius={60}
          paddingAngle={5}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => [`${value}`, 'Count']} />
        <Legend verticalAlign="bottom" height={36} />
      </PieChart>
    </ResponsiveContainer>
  );
} 