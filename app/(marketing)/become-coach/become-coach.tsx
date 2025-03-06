"use client"

import { TITLE_TAILWIND_CLASS } from "@/utils/constants"
import { motion } from "framer-motion"
import { DollarSign, Calendar, Shield, BarChart, Megaphone, Users } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import Image from "next/image"

export default function BecomeCoach() {
  const benefits = [
    {
      icon: DollarSign,
      title: "Additional Income Stream",
      description: "Create a flexible, scalable income source by sharing your expertise with motivated clients.",
    },
    {
      icon: Calendar,
      title: "Flexible Scheduling",
      description: "Set your own availability and coach on your terms, from anywhere in the world.",
    },
    {
      icon: Shield,
      title: "Built-in Infrastructure",
      description: "We handle payments, scheduling, and marketing so you can focus on coaching.",
    },
    {
      icon: BarChart,
      title: "Performance Tracking",
      description: "Monitor your impact with detailed analytics on client progress and satisfaction.",
    },
    {
      icon: Megaphone,
      title: "Expanded Visibility",
      description: "Build your personal brand and establish yourself as a thought leader in real estate.",
    },
    {
      icon: Users,
      title: "Professional Network",
      description: "Join our community of elite coaches and share best practices and insights.",
    },
  ]

  return (
    <div className="container px-4 md:px-6 mx-auto">
      <div className="text-center mb-12">
        <div className="inline-block rounded-lg bg-blue-100 dark:bg-blue-900/30 px-3 py-1 text-sm text-blue-600 dark:text-blue-400 mb-4">
          For Real Estate Experts
        </div>
        <h2 className={`${TITLE_TAILWIND_CLASS} font-semibold tracking-tight dark:text-white text-gray-900`}>
          Share Your Expertise as a Coach
        </h2>
        <p className="mx-auto max-w-[700px] text-gray-600 dark:text-gray-400 mt-2">
          Turn your real estate experience into a rewarding coaching business
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-12 items-center">
        <div className="order-2 md:order-1">
          <div className="grid gap-6 sm:grid-cols-2">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex flex-col"
                >
                  <div className="rounded-full bg-blue-100 dark:bg-blue-900/30 p-2 w-10 h-10 flex items-center justify-center mb-3">
                    <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-base font-bold mb-1">{benefit.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{benefit.description}</p>
                </motion.div>
              )
            })}
          </div>

          <div className="mt-8">
            <Link href="/sign-up?forceRedirectUrl=/apply-coach">
              <Button size="lg" className="w-full sm:w-auto">
                Become a Coach Today
              </Button>
            </Link>
          </div>
        </div>

        <div className="order-1 md:order-2 relative">
          <div className="absolute -z-10 inset-0 bg-gradient-to-tr from-blue-500/10 via-transparent to-transparent rounded-2xl" />
          <Image
            src="/placeholder.svg?height=500&width=500"
            alt="Coach teaching a client"
            width={500}
            height={500}
            className="rounded-xl shadow-lg border border-gray-200 dark:border-gray-800"
          />
          <div className="absolute -bottom-4 -left-4 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl -z-20" />
        </div>
      </div>
    </div>
  )
}

