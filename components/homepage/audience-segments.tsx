"use client"

import { TITLE_TAILWIND_CLASS } from "@/utils/constants"
import { motion } from "framer-motion"
import { UserRound, Users, Building } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function AudienceSegments() {
  const segments = [
    {
      id: 1,
      title: "For Real Estate Professionals",
      description:
        "Accelerate your career growth with personalized coaching from industry experts who understand your challenges.",
      icon: UserRound,
      cta: "Find Your Perfect Coach",
      link: "/coaches",
      features: [
        "One-on-one personalized coaching sessions",
        "Flexible scheduling to fit your busy calendar",
        "Specialized expertise in your target market",
        "Actionable strategies to increase listings and sales",
      ],
    },
    {
      id: 2,
      title: "For Coaches & Mentors",
      description:
        "Share your expertise, build your coaching business, and help shape the next generation of real estate professionals.",
      icon: Users,
      cta: "Learn More About Coaching",
      link: "/become-coach",
      features: [
        "Flexible scheduling on your terms",
        "Built-in payment processing and booking system",
        "Marketing tools to showcase your expertise",
        "Connect with motivated clients ready to learn",
      ],
    },
    {
      id: 3,
      title: "For Brokerages & Teams",
      description: "Implement structured coaching programs to elevate your entire team's performance and retention.",
      icon: Building,
      cta: "Business Solutions",
      link: "/business-solutions",
      features: [
        "Custom coaching programs for your entire team",
        "White-labeled platform and tools",
        "Performance analytics and reporting",
        "Volume-based pricing for cost efficiency",
      ],
    },
  ]

  return (
    <div className="container px-4 md:px-6">
      <div className="text-center mb-12">
        <h2 className={`${TITLE_TAILWIND_CLASS} font-semibold tracking-tight dark:text-white text-gray-900`}>
          Real Estate Coaching Solutions for Everyone
        </h2>
        <p className="mx-auto max-w-[700px] text-gray-600 dark:text-gray-400 mt-2">
          Tailored coaching experiences designed for your specific needs and goals
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {segments.map((segment) => {
          const Icon = segment.icon
          return (
            <motion.div
              key={segment.id}
              whileHover={{ y: -8 }}
              transition={{ type: "spring", bounce: 0.5 }}
              className="flex flex-col h-full p-6 bg-white dark:bg-gray-900 rounded-xl shadow-md border border-gray-200 dark:border-gray-800"
            >
              <div className="rounded-full bg-blue-100 dark:bg-blue-900/30 p-3 w-12 h-12 flex items-center justify-center mb-4">
                <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>

              <h3 className="text-xl font-bold mb-3">{segment.title}</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">{segment.description}</p>

              <ul className="space-y-2 mb-6 flex-grow">
                {segment.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <svg
                      className="w-5 h-5 text-blue-500 mr-2 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link href={segment.link} className="mt-auto">
                <Button className="w-full">{segment.cta}</Button>
              </Link>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

