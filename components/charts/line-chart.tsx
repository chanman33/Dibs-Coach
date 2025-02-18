'use client'

import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

interface LineChartProps {
  data: number[]
  labels: string[]
  title?: string
  className?: string
}

export function LineChart({ data, labels, title, className }: LineChartProps) {
  const chartData: ChartData<'line'> = {
    labels,
    datasets: [
      {
        label: title || 'Value',
        data,
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        tension: 0.4
      }
    ]
  }

  const options: ChartOptions<'line'> = {
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
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  }

  return (
    <div className={`h-[300px] ${className || ''}`}>
      <Line data={chartData} options={options} />
    </div>
  )
} 