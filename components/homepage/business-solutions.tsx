"use client"

import { TITLE_TAILWIND_CLASS } from "@/utils/constants"
import { motion } from "framer-motion"
import { BarChart3, Users, Shield, Briefcase, Layers } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import Image from "next/image"

export default function BusinessSolutions() {
  const features = [
    {
      icon: Users,
      title: "Team-Wide Coaching",
      description: "Structured coaching programs for your entire team, from new agents to top producers.",
    },
    {
      icon: BarChart3,
      title: "Performance Analytics",
      description: "Track progress and ROI with detailed reporting on coaching effectiveness and agent growth.",
    },
    {
      icon: Shield,
      title: "White-Labeled Platform",
      description: "Custom-branded coaching portal that reflects your brokerage's identity and values.",
    },
    {
      icon: Briefcase,
      title: "Volume-Based Pricing",
      description: "Cost-effective solutions that scale with your team size and coaching needs.",
    },
    {
      icon: Layers,
      title: "Custom Integration",
      description: "Seamlessly integrate with your existing tools and workflows for maximum efficiency.",
    },
  ]

  return (
    <div className="container px-4 md:px-6">
      <div className="grid md:grid-cols-2 gap-12 items-center">
        <div>
          <div className="inline-block rounded-lg bg-blue-100 dark:bg-blue-900/30 px-3 py-1 text-sm text-blue-600 dark:text-blue-400 mb-4">
            For Brokerages & Teams
          </div>
          <h2 className={`${TITLE_TAILWIND_CLASS} font-semibold tracking-tight dark:text-white text-gray-900 mb-4`}>
            Elevate Your Entire Team with Structured Coaching
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Implement a comprehensive coaching program that drives consistent results across your entire organization.
            From new agents to seasoned professionals, give everyone the support they need to excel.
          </p>

          <div className="grid gap-4">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start"
                >
                  <div className="mr-4 rounded-full bg-blue-100 dark:bg-blue-900/30 p-2 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">{feature.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{feature.description}</p>
                  </div>
                </motion.div>
              )
            })}
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <Link href="/business-solutions">
              <Button size="lg">Learn More</Button>
            </Link>
            <Link href="/case-studies">
              <Button variant="outline" size="lg">
                View Case Studies
              </Button>
            </Link>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -z-10 inset-0 bg-gradient-to-tr from-blue-500/10 via-transparent to-transparent rounded-2xl" />
          <Image
            src="/placeholder.svg?height=600&width=600"
            alt="Team coaching dashboard"
            width={600}
            height={600}
            className="rounded-xl shadow-lg border border-gray-200 dark:border-gray-800"
          />
          <div className="absolute -top-4 -right-4 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl -z-20" />
        </div>
      </div>
    </div>
  )
}

