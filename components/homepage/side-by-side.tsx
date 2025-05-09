import { Award, ChartBar, Users2 } from 'lucide-react'
import Image from 'next/image'
import { TITLE_TAILWIND_CLASS } from '@/utils/constants'

const features = [
  {
    name: 'Expert Guidance',
    description:
      'Learn from top-performing real estate professionals who have proven success in the industry. Our coaches bring years of experience and proven strategies to help you succeed.',
    icon: Award,
  },
  {
    name: 'Measurable Results',
    description: 'Track your progress with data-driven insights and achieve concrete improvements in your sales, listings, and client relationships.',
    icon: ChartBar,
  },
  {
    name: 'Supportive Community',
    description: 'Join a network of ambitious real estate professionals. Share experiences, learn from peers, and grow together in an encouraging environment.',
    icon: Users2,
  },
]

export default function SideBySide() {
  return (
    <div className="overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 sm:gap-y-20 lg:mx-0 lg:max-w-none lg:grid-cols-2 items-start">
          <div className="lg:pr-8">
            <div className="lg:max-w-lg">
              <p className={`${TITLE_TAILWIND_CLASS} font-semibold tracking-tight dark:text-white text-gray-900`}>
                Transform Your Real Estate Career
              </p>
              <p className="mt-6 leading-8 text-gray-600 dark:text-gray-400">
                Take your real estate business to new heights with personalized coaching from industry experts
              </p>
              <dl className="mt-10 max-w-xl space-y-8 leading-7 text-gray-600 lg:max-w-none">
                {features.map((feature) => (
                  <div key={feature.name} className="relative pl-9">
                    <dt className="inline font-semibold dark:text-gray-100 text-gray-900">
                      <feature.icon className="absolute left-1 top-1 h-5 w-5 text-blue-500" aria-hidden="true" />
                      {feature.name}
                    </dt>{' '}
                    <dd className="inline dark:text-gray-400">{feature.description}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
          <div className="relative">
            <Image
              src="/coach-zoom-lrg-no_fill-crop-web.jpg"
              alt="Real estate coaching session in progress"
              width={800}
              height={600}
              className="w-full h-auto rounded-lg"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
