import { Metadata } from 'next'
import PageWrapper from '@/components/wrapper/page-wrapper'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import Image from 'next/image'

export const metadata: Metadata = {
    title: 'Case Studies - Dibs Real Estate Coaching Success Stories',
    description: 'Discover how real estate professionals and teams have transformed their businesses with Dibs coaching. Read success stories from small teams, established offices, and large enterprises.',
    openGraph: {
        title: 'Case Studies - Dibs Real Estate Coaching Success Stories',
        description: 'Discover how real estate professionals and teams have transformed their businesses with Dibs coaching. Read success stories from small teams, established offices, and large enterprises.',
    },
}

export default function CaseStudies() {
    return (
        <PageWrapper>
            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <PageHeader
                    title="Success Stories"
                    description="See how real estate professionals and teams have transformed their businesses with Dibs coaching"
                />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                    <div className="text-center">
                        <p className="text-3xl md:text-4xl font-bold text-blue-600 dark:text-blue-400">500+</p>
                        <p className="text-sm md:text-base text-gray-600 dark:text-gray-300">Clients Coached</p>
                    </div>
                    <div className="text-center">
                        <p className="text-3xl md:text-4xl font-bold text-blue-600 dark:text-blue-400">35%</p>
                        <p className="text-sm md:text-base text-gray-600 dark:text-gray-300">Avg. Revenue Growth</p>
                    </div>
                    <div className="text-center">
                        <p className="text-3xl md:text-4xl font-bold text-blue-600 dark:text-blue-400">42</p>
                        <p className="text-sm md:text-base text-gray-600 dark:text-gray-300">States Served</p>
                    </div>
                    <div className="text-center">
                        <p className="text-3xl md:text-4xl font-bold text-blue-600 dark:text-blue-400">3.8x</p>
                        <p className="text-sm md:text-base text-gray-600 dark:text-gray-300">Average ROI</p>
                    </div>
                </div>

                <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                    {/* Small Teams Section */}
                    <section className="mb-24">
                        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12">
                            <div>
                                <span className="text-blue-600 dark:text-blue-400 font-medium text-sm uppercase tracking-wider">
                                    Case Studies
                                </span>
                                <h2 className="text-3xl md:text-4xl font-bold mt-2">Small & Growing Teams</h2>
                            </div>
                            <div className="mt-4 md:mt-0">
                                <button className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium flex items-center group">
                                    View all small team studies
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-5 w-5 ml-1 group-hover:translate-x-1 transition-transform"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {/* Case Study 1 */}
                            <Card className="flex flex-col h-full hover:shadow-xl transition-all duration-300 group overflow-hidden border-0 shadow-md">
                                <CardHeader className="p-0">
                                    <div className="relative w-full h-56 overflow-hidden">
                                        <Image
                                            src="/placeholder.svg?height=400&width=600"
                                            alt="Coastal Realty Group team members"
                                            width={600}
                                            height={400}
                                            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-6">
                                            <div>
                                                <span className="text-white/80 text-sm">San Diego, CA</span>
                                                <h3 className="text-white text-xl font-bold">Coastal Realty Group</h3>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-grow pt-6">
                                    <h4 className="text-xl font-bold mb-3">From 5 to 15 Agents in 6 Months</h4>
                                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                                        A boutique real estate team struggling with agent retention and inconsistent sales performance
                                        transformed their business with targeted coaching.
                                    </p>
                                    <div className="mt-4 space-y-3">
                                        <div className="flex items-start">
                                            <span className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-1 rounded mr-3 mt-0.5">
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className="h-4 w-4"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                                    />
                                                </svg>
                                            </span>
                                            <div>
                                                <span className="font-semibold text-gray-900 dark:text-gray-100">Challenge:</span>
                                                <p className="text-gray-600 dark:text-gray-300">
                                                    High turnover and inconsistent training methods
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-start">
                                            <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 p-1 rounded mr-3 mt-0.5">
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className="h-4 w-4"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M13 10V3L4 14h7v7l9-11h-7z"
                                                    />
                                                </svg>
                                            </span>
                                            <div>
                                                <span className="font-semibold text-gray-900 dark:text-gray-100">Solution:</span>
                                                <p className="text-gray-600 dark:text-gray-300">
                                                    Personalized coaching for team leaders and standardized onboarding
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-start">
                                            <span className="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 p-1 rounded mr-3 mt-0.5">
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className="h-4 w-4"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                                    />
                                                </svg>
                                            </span>
                                            <div>
                                                <span className="font-semibold text-gray-900 dark:text-gray-100">Results:</span>
                                                <p className="text-gray-600 dark:text-gray-300">
                                                    200% team growth and 35% increase in per-agent productivity
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="pt-0">
                                    <button className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium flex items-center group">
                                        Read Full Case Study
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-5 w-5 ml-1 group-hover:translate-x-1 transition-transform"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                        </svg>
                                    </button>
                                </CardFooter>
                            </Card>

                            {/* Case Study 2 */}
                            <Card className="flex flex-col h-full hover:shadow-xl transition-all duration-300 group overflow-hidden border-0 shadow-md">
                                <CardHeader className="p-0">
                                    <div className="relative w-full h-56 overflow-hidden">
                                        <Image
                                            src="/placeholder.svg?height=400&width=600"
                                            alt="Summit Properties luxury home"
                                            width={600}
                                            height={400}
                                            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-6">
                                            <div>
                                                <span className="text-white/80 text-sm">Denver, CO</span>
                                                <h3 className="text-white text-xl font-bold">Summit Properties</h3>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-grow pt-6">
                                    <h4 className="text-xl font-bold mb-3">Doubling Transaction Volume</h4>
                                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                                        A team of 7 agents specializing in luxury properties needed to scale their business while maintaining
                                        their premium service standards.
                                    </p>
                                    <div className="mt-4 space-y-3">
                                        <div className="flex items-start">
                                            <span className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-1 rounded mr-3 mt-0.5">
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className="h-4 w-4"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                                    />
                                                </svg>
                                            </span>
                                            <div>
                                                <span className="font-semibold text-gray-900 dark:text-gray-100">Challenge:</span>
                                                <p className="text-gray-600 dark:text-gray-300">Scaling without compromising quality service</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start">
                                            <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 p-1 rounded mr-3 mt-0.5">
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className="h-4 w-4"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M13 10V3L4 14h7v7l9-11h-7z"
                                                    />
                                                </svg>
                                            </span>
                                            <div>
                                                <span className="font-semibold text-gray-900 dark:text-gray-100">Solution:</span>
                                                <p className="text-gray-600 dark:text-gray-300">
                                                    Systems implementation and high-end client acquisition coaching
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-start">
                                            <span className="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 p-1 rounded mr-3 mt-0.5">
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className="h-4 w-4"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                                    />
                                                </svg>
                                            </span>
                                            <div>
                                                <span className="font-semibold text-gray-900 dark:text-gray-100">Results:</span>
                                                <p className="text-gray-600 dark:text-gray-300">
                                                    103% increase in transaction volume in 12 months
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="pt-0">
                                    <button className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium flex items-center group">
                                        Read Full Case Study
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-5 w-5 ml-1 group-hover:translate-x-1 transition-transform"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                        </svg>
                                    </button>
                                </CardFooter>
                            </Card>

                            {/* Case Study 3 */}
                            <Card className="flex flex-col h-full hover:shadow-xl transition-all duration-300 group overflow-hidden border-0 shadow-md">
                                <CardHeader className="p-0">
                                    <div className="relative w-full h-56 overflow-hidden">
                                        <Image
                                            src="/placeholder.svg?height=400&width=600"
                                            alt="Urban Home Collective team"
                                            width={600}
                                            height={400}
                                            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-6">
                                            <div>
                                                <span className="text-white/80 text-sm">Austin, TX</span>
                                                <h3 className="text-white text-xl font-bold">Urban Home Collective</h3>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-grow pt-6">
                                    <h4 className="text-xl font-bold mb-3">New Team to Market Leader</h4>
                                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                                        A newly formed team of 4 agents with varying experience levels needed to establish their brand in a
                                        competitive market.
                                    </p>
                                    <div className="mt-4 space-y-3">
                                        <div className="flex items-start">
                                            <span className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-1 rounded mr-3 mt-0.5">
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className="h-4 w-4"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                                    />
                                                </svg>
                                            </span>
                                            <div>
                                                <span className="font-semibold text-gray-900 dark:text-gray-100">Challenge:</span>
                                                <p className="text-gray-600 dark:text-gray-300">Building brand recognition and team cohesion</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start">
                                            <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 p-1 rounded mr-3 mt-0.5">
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className="h-4 w-4"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M13 10V3L4 14h7v7l9-11h-7z"
                                                    />
                                                </svg>
                                            </span>
                                            <div>
                                                <span className="font-semibold text-gray-900 dark:text-gray-100">Solution:</span>
                                                <p className="text-gray-600 dark:text-gray-300">
                                                    Brand strategy coaching and team culture development
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-start">
                                            <span className="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 p-1 rounded mr-3 mt-0.5">
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className="h-4 w-4"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                                    />
                                                </svg>
                                            </span>
                                            <div>
                                                <span className="font-semibold text-gray-900 dark:text-gray-100">Results:</span>
                                                <p className="text-gray-600 dark:text-gray-300">
                                                    Became a top 10 team in their market within 18 months
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="pt-0">
                                    <button className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium flex items-center group">
                                        Read Full Case Study
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-5 w-5 ml-1 group-hover:translate-x-1 transition-transform"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                        </svg>
                                    </button>
                                </CardFooter>
                            </Card>
                        </div>
                    </section>

                    {/* Established Offices Section */}
                    <section className="mb-24">
                        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12">
                            <div>
                                <span className="text-blue-600 dark:text-blue-400 font-medium text-sm uppercase tracking-wider">
                                    Case Studies
                                </span>
                                <h2 className="text-3xl md:text-4xl font-bold mt-2">Established Offices</h2>
                            </div>
                            <div className="mt-4 md:mt-0">
                                <button className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium flex items-center group">
                                    View all office studies
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-5 w-5 ml-1 group-hover:translate-x-1 transition-transform"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Case Study 1 */}
                            <Card className="flex flex-col h-full hover:shadow-xl transition-all duration-300 group overflow-hidden border-0 shadow-md">
                                <CardHeader className="p-0">
                                    <div className="relative w-full h-56 overflow-hidden">
                                        <Image
                                            src="/placeholder.svg?height=400&width=600"
                                            alt="Prestige Real Estate office"
                                            width={600}
                                            height={400}
                                            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-6">
                                            <div>
                                                <span className="text-white/80 text-sm">Chicago, IL • 45 Agents</span>
                                                <h3 className="text-white text-xl font-bold">Prestige Real Estate</h3>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-grow pt-6">
                                    <h4 className="text-xl font-bold mb-3">Revitalizing Agent Training Programs</h4>
                                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                                        An established brokerage with a traditional training approach needed to modernize their agent development program to attract and retain top talent.
                                    </p>
                                    <div className="mt-4 space-y-3">
                                        <div className="flex items-start">
                                            <span className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-1 rounded mr-3 mt-0.5">
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className="h-4 w-4"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                                    />
                                                </svg>
                                            </span>
                                            <div>
                                                <span className="font-semibold text-gray-900 dark:text-gray-100">Challenge:</span>
                                                <p className="text-gray-600 dark:text-gray-300">
                                                    Outdated training methods and declining agent engagement
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-start">
                                            <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 p-1 rounded mr-3 mt-0.5">
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className="h-4 w-4"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M13 10V3L4 14h7v7l9-11h-7z"
                                                    />
                                                </svg>
                                            </span>
                                            <div>
                                                <span className="font-semibold text-gray-900 dark:text-gray-100">Solution:</span>
                                                <p className="text-gray-600 dark:text-gray-300">
                                                    Comprehensive training program redesign with Dibs coaching integration
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-start">
                                            <span className="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 p-1 rounded mr-3 mt-0.5">
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className="h-4 w-4"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                                    />
                                                </svg>
                                            </span>
                                            <div>
                                                <span className="font-semibold text-gray-900 dark:text-gray-100">Results:</span>
                                                <p className="text-gray-600 dark:text-gray-300">
                                                    67% increase in agent retention and 28% growth in office production
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="pt-0">
                                    <button className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium flex items-center group">
                                        Read Full Case Study
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-5 w-5 ml-1 group-hover:translate-x-1 transition-transform"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                        </svg>
                                    </button>
                                </CardFooter>
                            </Card>

                            {/* Case Study 2 */}
                            <Card className="flex flex-col h-full hover:shadow-xl transition-all duration-300 group overflow-hidden border-0 shadow-md">
                                <CardHeader className="p-0">
                                    <div className="relative w-full h-56 overflow-hidden">
                                        <Image
                                            src="/placeholder.svg?height=400&width=600"
                                            alt="Metropolitan Realty office building"
                                            width={600}
                                            height={400}
                                            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-6">
                                            <div>
                                                <span className="text-white/80 text-sm">Atlanta, GA • 60 Agents</span>
                                                <h3 className="text-white text-xl font-bold">Metropolitan Realty</h3>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-grow pt-6">
                                    <h4 className="text-xl font-bold mb-3">Transforming Sales Management</h4>
                                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                                        A multi-office brokerage struggling with inconsistent performance across locations implemented a standardized coaching approach for their sales managers.
                                    </p>
                                    <div className="mt-4 space-y-3">
                                        <div className="flex items-start">
                                            <span className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-1 rounded mr-3 mt-0.5">
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className="h-4 w-4"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                                    />
                                                </svg>
                                            </span>
                                            <div>
                                                <span className="font-semibold text-gray-900 dark:text-gray-100">Challenge:</span>
                                                <p className="text-gray-600 dark:text-gray-300">
                                                    Performance variance across offices and manager burnout
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-start">
                                            <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 p-1 rounded mr-3 mt-0.5">
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className="h-4 w-4"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M13 10V3L4 14h7v7l9-11h-7z"
                                                    />
                                                </svg>
                                            </span>
                                            <div>
                                                <span className="font-semibold text-gray-900 dark:text-gray-100">Solution:</span>
                                                <p className="text-gray-600 dark:text-gray-300">
                                                    Leadership coaching for sales managers and performance tracking systems
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-start">
                                            <span className="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 p-1 rounded mr-3 mt-0.5">
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className="h-4 w-4"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                                    />
                                                </svg>
                                            </span>
                                            <div>
                                                <span className="font-semibold text-gray-900 dark:text-gray-100">Results:</span>
                                                <p className="text-gray-600 dark:text-gray-300">
                                                    42% improvement in underperforming offices and 30% reduction in manager turnover
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="pt-0">
                                    <button className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium flex items-center group">
                                        Read Full Case Study
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-5 w-5 ml-1 group-hover:translate-x-1 transition-transform"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                        </svg>
                                    </button>
                                </CardFooter>
                            </Card>
                        </div>
                    </section>

                    {/* Enterprise Section */}
                    <section className="mb-24">
                        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12">
                            <div>
                                <span className="text-blue-600 dark:text-blue-400 font-medium text-sm uppercase tracking-wider">
                                    Case Studies
                                </span>
                                <h2 className="text-3xl md:text-4xl font-bold mt-2">Large Enterprises</h2>
                            </div>
                            <div className="mt-4 md:mt-0">
                                <button className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium flex items-center group">
                                    View all enterprise studies
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-5 w-5 ml-1 group-hover:translate-x-1 transition-transform"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                            <div className="grid grid-cols-1 lg:grid-cols-2">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-800 flex items-center justify-center p-8">
                                        <div className="text-center">
                                            <span className="bg-white/20 text-white px-4 py-1 rounded-full text-sm font-medium">
                                                Multi-State Operation
                                            </span>
                                            <h3 className="text-white text-3xl md:text-4xl font-bold mt-4 mb-2">National Home Partners</h3>
                                            <p className="text-white/80 text-lg">500+ Agents • 12 States</p>

                                            <div className="grid grid-cols-2 gap-4 mt-8">
                                                <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                                                    <p className="text-white text-3xl font-bold">22%</p>
                                                    <p className="text-white/80 text-sm">Increase in Production</p>
                                                </div>
                                                <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                                                    <p className="text-white text-3xl font-bold">35%</p>
                                                    <p className="text-white/80 text-sm">Improvement in Retention</p>
                                                </div>
                                                <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                                                    <p className="text-white text-3xl font-bold">45%</p>
                                                    <p className="text-white/80 text-sm">Faster Onboarding</p>
                                                </div>
                                                <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                                                    <p className="text-white text-3xl font-bold">3.8x</p>
                                                    <p className="text-white/80 text-sm">ROI on Coaching</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <Image
                                        src="/placeholder.svg?height=800&width=600"
                                        alt="National Home Partners headquarters"
                                        width={600}
                                        height={800}
                                        className="w-full h-full object-cover opacity-0"
                                    />
                                </div>

                                <div className="p-8 lg:p-12">
                                    <h3 className="text-2xl md:text-3xl font-bold mb-6">Enterprise-Wide Coaching Implementation</h3>

                                    <p className="text-gray-600 dark:text-gray-300 text-lg mb-8">
                                        A national real estate franchise with offices across 12 states sought to implement a standardized
                                        coaching program that could be customized for regional market differences.
                                    </p>

                                    <div className="space-y-6 mb-8">
                                        <div>
                                            <h4 className="text-lg font-semibold flex items-center text-gray-900 dark:text-gray-100">
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className="h-5 w-5 mr-2 text-red-500"
                                                    viewBox="0 0 20 20"
                                                    fill="currentColor"
                                                >
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                                                        clipRule="evenodd"
                                                    />
                                                </svg>
                                                Challenge
                                            </h4>
                                            <ul className="mt-2 space-y-1 text-gray-600 dark:text-gray-300 pl-7 list-disc">
                                                <li>Inconsistent training quality across regions</li>
                                                <li>Difficulty tracking ROI on coaching investments</li>
                                                <li>Resistance from established office managers</li>
                                                <li>Varying market conditions requiring different approaches</li>
                                            </ul>
                                        </div>

                                        <div>
                                            <h4 className="text-lg font-semibold flex items-center text-gray-900 dark:text-gray-100">
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className="h-5 w-5 mr-2 text-blue-500"
                                                    viewBox="0 0 20 20"
                                                    fill="currentColor"
                                                >
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                                        clipRule="evenodd"
                                                    />
                                                </svg>
                                                Solution
                                            </h4>
                                            <ul className="mt-2 space-y-1 text-gray-600 dark:text-gray-300 pl-7 list-disc">
                                                <li>Enterprise-wide Dibs coaching platform implementation</li>
                                                <li>Custom coaching tracks for different market types</li>
                                                <li>Manager training program to gain buy-in</li>
                                                <li>Comprehensive performance tracking dashboard</li>
                                            </ul>
                                        </div>
                                    </div>

                                    <blockquote className="relative p-6 mt-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                        <svg
                                            className="absolute text-blue-300 dark:text-blue-700 transform -translate-y-6 -translate-x-2 h-16 w-16 opacity-20"
                                            fill="currentColor"
                                            viewBox="0 0 32 32"
                                            aria-hidden="true"
                                        >
                                            <path d="M9.352 4C4.456 7.456 1 13.12 1 19.36c0 5.088 3.072 8.064 6.624 8.064 3.36 0 5.856-2.688 5.856-5.856 0-3.168-2.208-5.472-5.088-5.472-.576 0-1.344.096-1.536.192.48-3.264 3.552-7.104 6.624-9.024L9.352 4zm16.512 0c-4.8 3.456-8.256 9.12-8.256 15.36 0 5.088 3.072 8.064 6.624 8.064 3.264 0 5.856-2.688 5.856-5.856 0-3.168-2.304-5.472-5.184-5.472-.576 0-1.248.096-1.44.192.48-3.264 3.456-7.104 6.528-9.024L25.864 4z" />
                                        </svg>
                                        <p className="relative text-lg italic text-gray-700 dark:text-gray-200">
                                            Implementing Dibs coaching across our enterprise has transformed not just our numbers, but our
                                            entire company culture. We now have a consistent language around performance and development that
                                            has united our offices despite their regional differences.
                                        </p>
                                        <footer className="mt-4">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0">
                                                    <span className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-blue-600">
                                                        <span className="text-white font-medium text-lg">SJ</span>
                                                    </span>
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-base font-medium text-gray-900 dark:text-gray-100">Sarah Johnson</div>
                                                    <div className="text-sm text-gray-600 dark:text-gray-400">Chief Operating Officer</div>
                                                </div>
                                            </div>
                                        </footer>
                                    </blockquote>

                                    <div className="mt-8">
                                        <button className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
                                            Read the Full Enterprise Case Study
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="h-5 w-5 ml-2"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </section>

                    {/* Testimonials Section */}
                    <section className="mb-24">
                        <div className="text-center mb-12">
                            <span className="text-blue-600 dark:text-blue-400 font-medium text-sm uppercase tracking-wider">
                                Testimonials
                            </span>
                            <h2 className="text-3xl md:text-4xl font-bold mt-2">What Our Clients Say</h2>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-8 md:p-12">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
                                    <div className="flex items-center mb-4">
                                        <div className="flex-shrink-0">
                                            <span className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/50">
                                                <span className="text-blue-800 dark:text-blue-300 font-medium text-lg">JD</span>
                                            </span>
                                        </div>
                                        <div className="ml-4">
                                            <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">John Doe</h4>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Team Lead, Coastal Homes</p>
                                        </div>
                                    </div>
                                    <div className="flex mb-3">
                                        {[...Array(5)].map((_, i) => (
                                            <svg
                                                key={i}
                                                className="h-5 w-5 text-yellow-400"
                                                xmlns="http://www.w3.org/2000/svg"
                                                viewBox="0 0 20 20"
                                                fill="currentColor"
                                            >
                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                            </svg>
                                        ))}
                                    </div>
                                    <p className="text-gray-600 dark:text-gray-300">
                                        "The coaching program transformed how I lead my team. We've doubled our sales in just 8 months and the
                                        team culture has never been better."
                                    </p>
                                </div>

                                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
                                    <div className="flex items-center mb-4">
                                        <div className="flex-shrink-0">
                                            <span className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/50">
                                                <span className="text-purple-800 dark:text-purple-300 font-medium text-lg">AS</span>
                                            </span>
                                        </div>
                                        <div className="ml-4">
                                            <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Amanda Smith</h4>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Broker, Elite Properties</p>
                                        </div>
                                    </div>
                                    <div className="flex mb-3">
                                        {[...Array(5)].map((_, i) => (
                                            <svg
                                                key={i}
                                                className="h-5 w-5 text-yellow-400"
                                                xmlns="http://www.w3.org/2000/svg"
                                                viewBox="0 0 20 20"
                                                fill="currentColor"
                                            >
                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                            </svg>
                                        ))}
                                    </div>
                                    <p className="text-gray-600 dark:text-gray-300">
                                        "What sets Dibs apart is their personalized approach. They didn't just give us a cookie-cutter
                                        solution, but really understood our unique market challenges."
                                    </p>
                                </div>

                                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
                                    <div className="flex items-center mb-4">
                                        <div className="flex-shrink-0">
                                            <span className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/50">
                                                <span className="text-green-800 dark:text-green-300 font-medium text-lg">MJ</span>
                                            </span>
                                        </div>
                                        <div className="ml-4">
                                            <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Michael Johnson</h4>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">CEO, Regional Realty</p>
                                        </div>
                                    </div>
                                    <div className="flex mb-3">
                                        {[...Array(5)].map((_, i) => (
                                            <svg
                                                key={i}
                                                className="h-5 w-5 text-yellow-400"
                                                xmlns="http://www.w3.org/2000/svg"
                                                viewBox="0 0 20 20"
                                                fill="currentColor"
                                            >
                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                            </svg>
                                        ))}
                                    </div>
                                    <p className="text-gray-600 dark:text-gray-300">
                                        "Implementing the Dibs coaching system across our 6 offices has standardized our approach while still
                                        allowing for local market flexibility. The ROI has been incredible."
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* CTA Section */}
                    <section className="mt-16 mb-12">
                        <div className="relative overflow-hidden rounded-2xl">
                            <div className="absolute inset-0">
                                <Image
                                    src="/placeholder.svg?height=600&width=1200"
                                    alt="Real estate professionals in a coaching session"
                                    width={1200}
                                    height={600}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/90 to-indigo-700/90 mix-blend-multiply" />
                            </div>

                            <div className="relative px-6 py-16 sm:px-12 sm:py-24 lg:py-32 lg:px-16">
                                <div className="max-w-3xl mx-auto text-center">
                                    <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                                        Ready to Write Your Success Story?
                                    </h2>
                                    <p className="mt-4 text-xl text-white/80">
                                        Join the growing number of real estate professionals transforming their businesses with Dibs coaching.
                                    </p>

                                    <div className="mt-10 max-w-md mx-auto sm:max-w-xl sm:flex sm:justify-center">
                                        <div className="space-y-4 sm:space-y-0 sm:mx-auto sm:inline-grid sm:grid-cols-2 sm:gap-5">
                                            <a
                                                href="#"
                                                className="flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-blue-700 bg-white hover:bg-blue-50 transition-colors sm:px-8"
                                            >
                                                Schedule a Consultation
                                            </a>
                                            <a
                                                href="#"
                                                className="flex items-center justify-center px-6 py-3 border-2 border-white text-base font-medium rounded-md text-white bg-transparent hover:bg-white/10 transition-colors sm:px-8"
                                            >
                                                Explore Coaching Options
                                            </a>
                                        </div>
                                    </div>

                                    <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-8">
                                        <div className="text-center">
                                            <div className="flex items-center justify-center mx-auto w-12 h-12 rounded-full bg-white/20 mb-4">
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className="h-6 w-6 text-white"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                                    />
                                                </svg>
                                            </div>
                                            <p className="text-white font-medium">Quick Results</p>
                                        </div>
                                        <div className="text-center">
                                            <div className="flex items-center justify-center mx-auto w-12 h-12 rounded-full bg-white/20 mb-4">
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className="h-6 w-6 text-white"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                                                    />
                                                </svg>
                                            </div>
                                            <p className="text-white font-medium">Proven Methods</p>
                                        </div>
                                        <div className="text-center">
                                            <div className="flex items-center justify-center mx-auto w-12 h-12 rounded-full bg-white/20 mb-4">
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className="h-6 w-6 text-white"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                                                    />
                                                </svg>
                                            </div>
                                            <p className="text-white font-medium">Expert Coaches</p>
                                        </div>
                                        <div className="text-center">
                                            <div className="flex items-center justify-center mx-auto w-12 h-12 rounded-full bg-white/20 mb-4">
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className="h-6 w-6 text-white"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                                                    />
                                                </svg>
                                            </div>
                                            <p className="text-white font-medium">Measurable Growth</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </PageWrapper>
    )
}
