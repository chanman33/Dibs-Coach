"use client"
import { TITLE_TAILWIND_CLASS } from '@/utils/constants'
import { motion } from 'framer-motion'
import { Building2, Calendar, Medal, Target, Users2, Video } from 'lucide-react'
import Link from 'next/link'

const FeaturesData = [
  {
    id: 1,
    name: 'Expert Real Estate Coaches',
    description: 'Connect with verified, experienced real estate professionals who have proven success in the industry.',
    icon: Medal,
  },
  {
    id: 2,
    name: 'Flexible Scheduling',
    description: 'Book coaching sessions that fit your schedule with our easy-to-use calendar integration.',
    icon: Calendar,
  },
  {
    id: 3,
    name: 'Virtual Meetings',
    description: 'Attend coaching sessions from anywhere through our integrated video conferencing platform.',
    icon: Video,
  },
  {
    id: 4,
    name: 'Specialized Expertise',
    description: 'Find coaches specializing in residential, commercial, luxury markets, and more.',
    icon: Building2,
  },
  {
    id: 5,
    name: 'Goal-Oriented Training',
    description: 'Get personalized guidance to achieve your specific real estate career objectives.',
    icon: Target,
  },
  {
    id: 6,
    name: 'Community Support',
    description: 'Join a network of like-minded professionals and learn from shared experiences.',
    icon: Users2,
  }
]

const SpringAnimatedFeatures = () => {
  return (
    <div className="flex flex-col justify-center items-center lg:w-[75%]">
      <div className='flex flex-col mb-[3rem] text-center w-full'>
        <h2 className={`${TITLE_TAILWIND_CLASS} mt-2 font-semibold tracking-tight dark:text-white text-gray-900`}>
          Why Choose Our Platform
        </h2>
        <p className="mx-auto max-w-[500px] text-gray-600 dark:text-gray-400 text-center mt-2">
          Everything you need to accelerate your real estate career with professional coaching
        </p>
      </div>
      <div className="grid w-full grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {FeaturesData.map((feature) => {
          const Icon = feature.icon
          return (
            <motion.div
              whileHover={{
                y: -8,
              }}
              transition={{
                type: 'spring',
                bounce: 0.7,
              }}
              key={feature.id}
              className="mt-5 text-left border p-6 rounded-md dark:bg-black hover:border-blue-500 transition-colors"
            >
              <div className="flex flex-col">
                <Icon className="w-8 h-8 mb-3 text-blue-500" />
                <div className="mb-2 text-lg font-medium">
                  {feature.name}
                </div>
                <div className="max-w-[250px] text-sm font-normal text-gray-600 dark:text-gray-400">
                  {feature.description}
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

export default SpringAnimatedFeatures
