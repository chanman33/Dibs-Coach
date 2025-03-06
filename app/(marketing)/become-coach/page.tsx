import { TITLE_TAILWIND_CLASS } from "@/utils/constants"
import BecomeCoach from "./become-coach"
import { Button } from "@/components/ui/button"
import { Star, Award, TrendingUp, CheckCircle } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import PageWrapper from "@/components/wrapper/page-wrapper"
export const metadata = {
  title: "Become a Real Estate Coach | Dibs",
  description: "Join our elite network of real estate coaches. Share your expertise, build your brand, and create an additional income stream while helping others succeed.",
}

export default function WhyCoachPage() {
  const testimonials = [
    {
      quote: "Coaching on Dibs has been transformative. I've built a thriving coaching practice while helping others achieve their real estate goals.",
      author: "Sarah Johnson",
      role: "Top 1% Real Estate Agent",
      image: "/placeholder.svg?height=100&width=100",
    },
    {
      quote: "The platform's infrastructure and support make it easy to focus on what matters - helping my clients succeed.",
      author: "Michael Chen",
      role: "Real Estate Investment Coach",
      image: "/placeholder.svg?height=100&width=100",
    },
  ]

  const requirements = [
    "Minimum 5 years of real estate experience",
    "Proven track record of success in your field",
    "Strong communication and mentoring skills",
    "Commitment to helping others grow",
  ]

  const stats = [
    { number: "500+", label: "Active Coaches" },
    { number: "$10K+", label: "Average Monthly Income" },
    { number: "95%", label: "Client Satisfaction" },
    { number: "1000+", label: "Successful Mentees" },
  ]

  return (
    <PageWrapper> 
      {/* Hero Section */}
      <section className="relative py-20">
        <div className="container relative px-4 md:px-6">
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
            <div className="inline-block rounded-lg bg-blue-100 dark:bg-blue-900/30 px-3 py-1 text-sm text-blue-600 dark:text-blue-400 mb-4">
              Join Our Elite Coaching Network
            </div>
            <h1 className={`${TITLE_TAILWIND_CLASS} mb-6 font-bold tracking-tight text-gray-900 dark:text-white`}>
              Transform Your Real Estate Expertise Into a Thriving Coaching Business
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl">
              Share your knowledge, build your brand, and create a sustainable income stream while helping others succeed in real estate.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/sign-up?forceRedirectUrl=/apply-coach">
                <Button size="lg" className="w-full sm:w-auto">
                  Apply Now
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-gray-50 dark:bg-gray-800 w-screen">
        <div id="learn-more" className="py-20">
          <BecomeCoach />
        </div>
      </section>

      {/* Requirements Section */}
      <section className="bg-white dark:bg-gray-900 w-screen">
        <div className="py-20">
          <div className="container px-4 md:px-6">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className={`${TITLE_TAILWIND_CLASS} mb-6 font-semibold tracking-tight text-gray-900 dark:text-white`}>
                What We Look For in Coaches
              </h2>
              <div className="grid gap-6 mt-8">
                {requirements.map((req, index) => (
                  <div key={index} className="flex items-center gap-4 text-left">
                    <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
                    <span className="text-lg text-gray-700 dark:text-gray-300">{req}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="bg-gray-50 dark:bg-gray-800 w-screen">
        <div className="py-20">
          <div className="container px-4 md:px-6">
            <h2 className={`${TITLE_TAILWIND_CLASS} text-center mb-12 font-semibold tracking-tight text-gray-900 dark:text-white`}>
              What Our Coaches Say
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              {testimonials.map((testimonial, index) => (
                <div key={index} className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-lg">
                  <div className="flex items-center gap-4 mb-4">
                    <Image
                      src={testimonial.image}
                      alt={testimonial.author}
                      width={50}
                      height={50}
                      className="rounded-full"
                    />
                    <div>
                      <div className="font-semibold">{testimonial.author}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{testimonial.role}</div>
                    </div>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 italic">&ldquo;{testimonial.quote}&rdquo;</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 dark:bg-blue-900 w-screen">
        <div className="py-20">
          <div className="container px-4 md:px-6">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold text-white mb-6">
                Ready to Start Your Coaching Journey?
              </h2>
              <p className="text-xl text-blue-100 mb-8">
                Join our network of successful real estate coaches and make a difference in others' lives.
              </p>
              <Link href="/sign-up?forceRedirectUrl=/apply-coach">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                  Apply to Become a Coach
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PageWrapper>
  )
}
