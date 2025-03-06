"use client"

import Image from "next/image"
import { ContactSalesLayout } from "@/components/contact-sales/contact-sales-layout"
import { Building, Users, TrendingUp, BarChart3, Zap, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import PageWrapper from "@/components/wrapper/page-wrapper"

export default function BusinessesPage() {
  const scrollToForm = () => {
    const formSection = document.getElementById('contact-form')
    formSection?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <PageWrapper>
      <div className="w-full -mt-[4rem]">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-b from-slate-50 to-white pt-28 pb-20 overflow-hidden">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6 max-w-2xl">
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-700 font-medium text-sm mb-2">
                  <span className="mr-1">✦</span> Business Solutions
                </div>
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900">
                  Scale Your Real Estate Business with Professional Coaching
                </h1>
                <p className="text-xl text-slate-600">
                  Whether you're a growing team or established brokerage, our coaching platform helps increase agent productivity, 
                  reduce turnover, and drive sustainable revenue growth at any scale.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Button 
                    size="lg" 
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={scrollToForm}
                  >
                    Schedule a Consultation
                  </Button>
                  {/* <Button size="lg" variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50">
                    View Case Studies
                  </Button> */}
                </div>
                <div className="flex items-center gap-6 pt-4">
                  <div className="flex -space-x-2 h-16">
                    {/* Spacer div */}
                  </div>
                </div>
                {/* <div className="flex items-center gap-6 pt-4">
                  <div className="flex -space-x-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="w-10 h-10 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center overflow-hidden"
                      >
                        <Image
                          src={`/placeholder.svg?height=40&width=40`}
                          alt={`Client ${i}`}
                          width={40}
                          height={40}
                          className="object-cover"
                        />
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-slate-600">
                    <span className="font-semibold">Trusted by dozens of agents and brokerages nationwide</span>
                  </p>
                </div> */}
              </div>
              <div className="relative rounded-xl overflow-hidden shadow-2xl">
                <Image
                  src="/placeholder.svg?height=600&width=800"
                  alt="Enterprise Coaching Platform"
                  width={800}
                  height={600}
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/30 to-transparent"></div>
              </div>
            </div>
          </div>

          {/* Stats Banner */}
          {/* <div className="container mx-auto px-4 mt-16">
            <div className="bg-white rounded-xl shadow-lg p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <p className="text-4xl font-bold text-blue-600 mb-2">10-25%</p>
                <p className="text-slate-600">increase in agent production</p>
              </div>
              <div className="text-center border-y md:border-y-0 md:border-x border-slate-100 py-4 md:py-0 md:px-4">
                <p className="text-4xl font-bold text-blue-600 mb-2">5×</p>
                <p className="text-slate-600">reduction in agent turnover</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-bold text-blue-600 mb-2">30-40%</p>
                <p className="text-slate-600">faster ramp-up for new agents</p>
              </div>
            </div>
          </div> */}
        </section>

        {/* Problem Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center mb-16">
              <h2 className="text-3xl font-bold mb-6 text-slate-900">
                Common Challenges in Agent Development
              </h2>
              <p className="text-xl text-slate-600">
                <strong>The reality is clear:</strong> Growing and retaining successful agents is challenging, with 87% of new
                agents leaving the industry within five years.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="border-slate-200">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 rounded-lg bg-red-50 flex items-center justify-center mb-4">
                    <Users className="w-6 h-6 text-red-500" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-slate-900">Internal Mentorship</h3>
                  <p className="text-slate-600">Doesn't scale effectively across larger organizations</p>
                </CardContent>
              </Card>

              <Card className="border-slate-200">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 rounded-lg bg-orange-50 flex items-center justify-center mb-4">
                    <Zap className="w-6 h-6 text-orange-500" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-slate-900">One-off Seminars</h3>
                  <p className="text-slate-600">Temporary inspiration without lasting behavioral change</p>
                </CardContent>
              </Card>

              <Card className="border-slate-200">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 rounded-lg bg-amber-50 flex items-center justify-center mb-4">
                    <Building className="w-6 h-6 text-amber-500" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-slate-900">Premium Coaching</h3>
                  <p className="text-slate-600">$300-$800 per agent monthly is cost-prohibitive at scale</p>
                </CardContent>
              </Card>

              <Card className="border-slate-200">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 rounded-lg bg-slate-50 flex items-center justify-center mb-4">
                    <BarChart3 className="w-6 h-6 text-slate-500" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-slate-900">Generic Training</h3>
                  <p className="text-slate-600">Lacks personalization and accountability mechanisms</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Solution Section */}
        <section className="py-20 bg-slate-50">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center mb-16">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-700 font-medium text-sm mb-4">
                THE SOLUTION
              </div>
              <h2 className="text-3xl font-bold mb-6 text-slate-900">A Coaching Platform That Grows With You</h2>
              <p className="text-xl text-slate-600">
                A flexible approach to agent development designed for teams and brokerages of all sizes.
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
              <div className="relative rounded-xl overflow-hidden shadow-lg">
                <Image
                  src="/placeholder.svg?height=600&width=800"
                  alt="Platform Dashboard"
                  width={800}
                  height={600}
                  className="object-cover"
                />
              </div>
              <div className="space-y-8">
                <h3 className="text-2xl font-semibold text-slate-900">How It Works</h3>

                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
                      1
                    </div>
                    <div>
                      <h4 className="text-xl font-semibold mb-2 text-slate-900">Vetted Coach Network</h4>
                      <p className="text-slate-600">
                        Access specialized coaches for every agent need, from new agent onboarding to luxury market
                        specialization.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
                      2
                    </div>
                    <div>
                      <h4 className="text-xl font-semibold mb-2 text-slate-900">Personalized Development</h4>
                      <p className="text-slate-600">
                        One-on-one coaching tailored to each agent's goals, experience level, and market conditions.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
                      3
                    </div>
                    <div>
                      <h4 className="text-xl font-semibold mb-2 text-slate-900">Enterprise Dashboard</h4>
                      <p className="text-slate-600">
                        Track performance metrics and ROI in real-time across your entire organization.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
                      4
                    </div>
                    <div>
                      <h4 className="text-xl font-semibold mb-2 text-slate-900">Seamless Integration</h4>
                      <p className="text-slate-600">
                        Works with your existing tools and workflows to minimize disruption and maximize adoption.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ROI Section */}
        {/* <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-6 text-slate-900">Real ROI for Your Brokerage</h2>
                <p className="text-xl text-slate-600">
                  Our platform delivers measurable results that directly impact your bottom line.
                </p>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-slate-50 p-8 md:p-12 rounded-2xl border border-blue-100 shadow-sm">
                <div className="flex flex-col md:flex-row gap-8 items-center mb-8">
                  <div className="flex-shrink-0 w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center">
                    <TrendingUp className="w-10 h-10 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-2 text-slate-900">
                      For a 100-agent brokerage investing $50,000 annually:
                    </h3>
                    <p className="text-slate-600 text-lg">
                      See how our platform delivers exceptional returns on your investment.
                    </p>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <h4 className="text-3xl font-bold text-blue-600 mb-2">+1</h4>
                    <p className="text-slate-700">
                      Additional transaction per agent generates <span className="font-semibold">$900,000</span> in new
                      commission revenue
                    </p>
                  </div>

                  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <h4 className="text-3xl font-bold text-blue-600 mb-2">18×</h4>
                    <p className="text-slate-700">Return on your coaching investment through increased productivity</p>
                  </div>

                  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <h4 className="text-3xl font-bold text-blue-600 mb-2">40%</h4>
                    <p className="text-slate-700">
                      Reduction in recruitment and onboarding costs through improved retention
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section> */}

        {/* Testimonials */}
        {/* <section className="py-20 bg-slate-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-6 text-slate-900">What Our Enterprise Clients Say</h2>
              <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                Hear from brokerages that have transformed their agent development with our platform.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              <Card className="bg-white border-slate-200 overflow-hidden">
                <CardContent className="p-0">
                  <div className="p-8">
                    <div className="flex items-center mb-6">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg key={star} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                        </svg>
                      ))}
                    </div>
                    <p className="italic text-slate-700 mb-6 text-lg">
                      "We've seen a 32% increase in closed deals across our mid-tier agents since implementing this
                      platform. The personalized coaching approach has transformed our organization."
                    </p>
                    <div className="flex items-center">
                      <div className="w-12 h-12 rounded-full bg-slate-200 mr-4 overflow-hidden">
                        <Image
                          src="/placeholder.svg?height=48&width=48"
                          alt="Sarah Johnson"
                          width={48}
                          height={48}
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">Sarah Johnson</p>
                        <p className="text-slate-600 text-sm">Training Director, Premier Realty Group</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-slate-200 overflow-hidden">
                <CardContent className="p-0">
                  <div className="p-8">
                    <div className="flex items-center mb-6">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg key={star} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                        </svg>
                      ))}
                    </div>
                    <p className="italic text-slate-700 mb-6 text-lg">
                      "The ability to scale coaching across our 300+ agents while maintaining quality has been
                      game-changing. Our retention rates are at an all-time high."
                    </p>
                    <div className="flex items-center">
                      <div className="w-12 h-12 rounded-full bg-slate-200 mr-4 overflow-hidden">
                        <Image
                          src="/placeholder.svg?height=48&width=48"
                          alt="Michael Chen"
                          width={48}
                          height={48}
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">Michael Chen</p>
                        <p className="text-slate-600 text-sm">CEO, Horizon Real Estate</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section> */}

        {/* Features Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center mb-16">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-700 font-medium text-sm mb-4">
                SCALABLE FEATURES
              </div>
              <h2 className="text-3xl font-bold mb-6 text-slate-900">Powerful Features for Growing Teams</h2>
              <p className="text-xl text-slate-600">
                Our platform adapts to your needs, whether you're a small team or a large organization.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10 max-w-5xl mx-auto">
              {/* <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-slate-900">White-labeled Portal</h3>
                  <p className="text-slate-600">Customized coaching platform with your branding and messaging</p>
                </div>
              </div> */}

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-slate-900">Custom Training Modules</h3>
                  <p className="text-slate-600">Tailored content aligned with your specific processes and standards</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-slate-900">Advanced Analytics</h3>
                  <p className="text-slate-600">Comprehensive reporting to measure coaching effectiveness and ROI</p>
                </div>
              </div>

              {/* <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-slate-900">Dedicated Success Manager</h3>
                  <p className="text-slate-600">Personalized support to ensure your organization achieves its goals</p>
                </div>
              </div> */}

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-slate-900">API Integration</h3>
                  <p className="text-slate-600">Coming Soon: Seamless connection with your existing CRM and management systems</p>
                </div>
              </div>

              {/* <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-slate-900">Enterprise Security</h3>
                  <p className="text-slate-600">SOC 2 compliant platform with advanced data protection</p>
                </div>
              </div> */}
            </div>
          </div>
        </section>

        {/* Contact Form */}
        <section id="contact-form" className="py-20 bg-slate-50">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                  <h2 className="text-3xl font-bold text-slate-900">Ready to Transform Your Business?</h2>
                  <p className="text-xl text-slate-600">
                    Schedule a consultation to learn how our coaching platform can be customized for your team's unique needs and growth goals.
                  </p>
                  <div className="space-y-4 pt-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      </div>
                      <p className="text-slate-700">Custom implementation plan for your brokerage</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      </div>
                      <p className="text-slate-700">Transparent pricing with volume discounts</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      </div>
                      <p className="text-slate-700">Dedicated onboarding and support team</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 border border-slate-200">
                  <ContactSalesLayout
                    title="Request Enterprise Information"
                    description="Tell us about your brokerage and we'll create a custom enterprise coaching solution for your team"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-br from-blue-600 to-blue-800 text-white">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold mb-6">Give Your Agents the Support They Need</h2>
              <p className="text-xl mb-8 text-blue-100">
                In today's competitive market, investing in agent development is crucial for businesses of any size.
              </p>
              <Button size="lg" className="bg-white text-blue-700 hover:bg-blue-50">
                Schedule Your Consultation Today
              </Button>
              {/* <p className="mt-6 text-blue-200 text-sm">
                Join the 200+ brokerages already transforming their business with our platform
              </p> */}
            </div>
          </div>
        </section>
      </div>
    </PageWrapper>
  )
}

