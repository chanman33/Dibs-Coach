'use client'

import { Pie } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions
} from 'chart.js'

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
)

interface PieChartProps {
  data: number[]
  labels: string[]
  title?: string
  className?: string
}

export function PieChart({ data, labels, title, className }: PieChartProps) {
  const chartData: ChartData<'pie'> = {
    labels,
    datasets: [
      {
        label: title || 'Value',
        data,
        backgroundColor: [
          'rgba(255, 99, 132, 0.5)',
          'rgba(54, 162, 235, 0.5)',
          'rgba(255, 206, 86, 0.5)',
          'rgba(75, 192, 192, 0.5)',
          'rgba(153, 102, 255, 0.5)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
        ],
        borderWidth: 1
      }
    ]
  }

  const options: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: !!title,
        text: title || ''
      }
    }
  }

  return (
    <div className={`h-[300px] ${className || ''}`}>
      <Pie data={chartData} options={options} />
    </div>
  )
} 