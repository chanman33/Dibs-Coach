import { Button } from '@/components/ui/button'
import { Metadata } from 'next'
import Link from 'next/link'
import PageWrapper from "@/components/wrapper/page-wrapper";
import { VideoPlayer } from '@/components/zoom/video-player';

export const metadata: Metadata = {
  metadataBase: new URL("https://starter.rasmic.xyz"),
  keywords: ['real estate coaching', 'real estate mentoring', 'coaching marketplace', 'real estate career'],
  title: 'How It Works | Real Estate Coaching Platform',
  openGraph: {
    description: 'Learn how our coaching platform connects real estate professionals with expert coaches to accelerate your career growth.',
    images: ['/images/how-it-works-cover.jpg']
  },
  twitter: {
    card: 'summary_large_image',
    title: 'How It Works | Real Estate Coaching Platform',
    description: 'Learn how our coaching platform connects real estate professionals with expert coaches to accelerate your career growth.',
    siteId: "",
    creator: "@rasmickyy",
    creatorId: "",
    images: ['/images/how-it-works-cover.jpg'],
  },
}


export default async function HowItWorksPage() {

  return (
    <PageWrapper>
      <div className='flex flex-col min-h-screen items-center mt-[2.5rem] p-3 w-full'>
        <h1 className="scroll-m-20 max-w-[700px] text-5xl font-bold tracking-tight text-center">
          How Our Real Estate Coaching Works
        </h1>
        <p className="mx-auto max-w-[600px] text-gray-500 md:text-lg text-center mt-2 dark:text-gray-400">
          Our platform connects you with experienced real estate coaches who can help you achieve your career goals through personalized guidance and industry expertise.
        </p>
        <div className='flex gap-2 mt-2'>
          <Link href="/sign-in?forceRedirectUrl=/dashboard/mentee/browse-coaches" className="mt-2">
            <Button size="lg">Find a Coach</Button>
          </Link>
          <Link href="/sign-in?forceRedirectUrl=/apply-coach" className="mt-2">
            <Button size="lg" variant="outline">Become a Coach</Button>
          </Link>
        </div>
        <div className='mb-3 mt-[1.5rem] max-w-[900px] w-full'>
          <VideoPlayer videoSrc="https://www.w3schools.com/html/mov_bbb.mp4" />
        </div>
        <div className='flex flex-col min-h-screen max-w-[900px] items-center mb-[2rem]'>
          <article className="w-full mx-auto pb-8">
            <h1 className="text-3xl lg:text-4xl font-bold mb-6">Elevate Your Real Estate Career</h1>

            <section className="mb-8">
              <p className="text-md leading-relaxed">Whether you're just starting out or looking to take your established real estate business to the next level, our platform connects you with experienced coaches who have been where you want to go. Get personalized guidance, actionable strategies, and the accountability you need to achieve your professional goals.</p>
            </section>

            <section className="mb-8">
              <h2 className="mt-10 scroll-m-20 border-b pb-2 mb-3 text-3xl font-semibold tracking-tight transition-colors first:mt-0">The Coaching Process</h2>
              <p className="text-md mb-5 leading-relaxed">Our coaching platform makes it easy to find the right mentor for your specific needs and goals. Here's how the process works from start to finish:</p>
              <p className="text-md mb-5 leading-relaxed">First, browse our marketplace of verified real estate coaches, filtering by specialty, experience level, and availability. Each coach profile includes reviews, background information, and areas of expertise to help you make an informed decision.</p>
              <p className="text-md mb-5 leading-relaxed">Once you've found your ideal coach, easily schedule sessions through our integrated booking system. Choose between different session durations and select times that work for your schedule. All coaching sessions take place through our secure video platform, allowing you to connect from anywhere.</p>
            </section>

            <section className="mb-8">
              <h2 className="mt-10 scroll-m-20 border-b pb-2 mb-3 text-3xl font-semibold tracking-tight transition-colors first:mt-0">For Real Estate Professionals</h2>
              <p className="text-md mb-5 leading-relaxed">As a real estate professional looking to grow, here's what you can expect from our platform:</p>
              <ol className="flex flex-col gap-1 list-decimal ml-8 mb-4">
                <li className="mb-2"><strong>Expert Matching:</strong> Find coaches specializing in your specific needs, whether that's residential sales, commercial real estate, luxury markets, or team building.</li>
                <li className="mb-2"><strong>Flexible Scheduling:</strong> Book sessions that fit your busy schedule with our easy-to-use calendar integration.</li>
                <li className="mb-2"><strong>Goal-Oriented Training:</strong> Receive personalized guidance focused on achieving your specific real estate career objectives.</li>
              </ol>
            </section>

            <section className="mb-8">
              <h2 className="mt-10 scroll-m-20 border-b pb-2 mb-3 text-3xl font-semibold tracking-tight transition-colors first:mt-0">For Coaches</h2>
              <p className="text-md mb-5 leading-relaxed">If you're an experienced real estate professional interested in becoming a coach on our platform:</p>
              <ul className="flex flex-col gap-1 list-disc ml-8 mb-4">
                <li className="mb-2"><strong>Application Process:</strong> Submit your credentials and background for review by our team to ensure quality coaching for our users.</li>
                <li className="mb-2"><strong>Flexible Offering:</strong> Set your own availability, session durations, and specialty areas to attract your ideal clients.</li>
                <li className="mb-2"><strong>Built-in Tools:</strong> Access our scheduling, video conferencing, and payment systems to manage your coaching business efficiently.</li>
              </ul>
            </section>


            <section className="mb-8">
              <h2 className="mt-10 scroll-m-20 border-b pb-2 mb-3 text-3xl font-semibold tracking-tight transition-colors first:mt-0">Pricing & Membership Options</h2>
              <p className="text-md mb-5 leading-relaxed">We offer flexible pricing options to fit different needs and budgets. Choose from pay-as-you-go coaching sessions or subscribe to one of our membership plans for additional benefits, including access to our suite of AI tools designed specifically for real estate professionals.</p>
              <p className="text-md mb-5 leading-relaxed">Our AI tools include listing generation, email assistance, voicemail automation, and social media content creation — all built to help you save time and improve your real estate business. Subscription members also receive discounted coaching rates and priority booking with top coaches.</p>
            </section>
          </article>
        </div>

      </div>
    </PageWrapper>
  )
}
