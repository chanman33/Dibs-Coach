"use client"

import { TITLE_TAILWIND_CLASS } from "@/utils/constants"
import { motion } from "framer-motion"
import { TrendingUp, Clock, Lightbulb, Target, Presentation, Zap } from "lucide-react"

export default function CoachingBenefits() {
  const benefits = [
    {
      icon: TrendingUp,
      title: "Accelerated Growth",
      description: "Achieve in months what might otherwise take years through targeted guidance and accountability.",
    },
    {
      icon: Clock,
      title: "Time Optimization",
      description:
        "Focus on high-impact activities that drive results instead of wasting time on ineffective strategies.",
    },
    {
      icon: Lightbulb,
      title: "Strategic Insights",
      description: "Gain insider knowledge and proven techniques from professionals who've already succeeded.",
    },
    {
      icon: Target,
      title: "Goal Achievement",
      description: "Set clear, actionable goals with structured plans to reach them faster and more efficiently.",
    },
    {
      icon: Presentation,
      title: "Skill Development",
      description: "Enhance your negotiation, marketing, and client relationship skills through expert training.",
    },
    {
      icon: Zap,
      title: "Motivation & Accountability",
      description: "Stay motivated with regular check-ins and accountability from someone invested in your success.",
    },
  ]

  return (
    <div className="w-full bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900 py-20">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className={`${TITLE_TAILWIND_CLASS} font-semibold tracking-tight dark:text-white text-gray-900`}>
            Why Real Estate Coaching Works
          </h2>
          <p className="mx-auto max-w-[700px] text-gray-600 dark:text-gray-400 mt-2">
            Discover how personalized coaching can transform your real estate career
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800"
              >
                <div className="rounded-full bg-blue-100 dark:bg-blue-900/30 p-3 w-12 h-12 flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-bold mb-2">{benefit.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">{benefit.description}</p>
              </motion.div>
            )
          })}
        </div>

        <div className="mt-12 text-center">
          <p className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            "The right coach doesn't just teach you what to do—they help you discover who you can become."
          </p>
          <p className="text-gray-600 dark:text-gray-400">— Top-performing agent with 5 years of coaching experience</p>
        </div>
      </div>
    </div>
  )
}

