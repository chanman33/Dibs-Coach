'use client'

import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

interface BarChartProps {
  data: number[]
  labels: string[]
  title?: string
  className?: string
}

export function BarChart({ data, labels, title, className }: BarChartProps) {
  const chartData: ChartData<'bar'> = {
    labels,
    datasets: [
      {
        label: title || 'Value',
        data,
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgb(54, 162, 235)',
        borderWidth: 1
      }
    ]
  }

  const options: ChartOptions<'bar'> = {
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
      <Bar data={chartData} options={options} />
    </div>
  )
} 