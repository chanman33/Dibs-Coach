import { AccordionComponent } from "@/components/homepage/accordion-component";
import HeroSection from "@/components/homepage/hero-section";
import MarketingCards from "@/components/homepage/marketing-cards";
import Pricing from "@/components/homepage/pricing";
import SideBySide from "@/components/homepage/side-by-side";
import PageWrapper from "@/components/wrapper/page-wrapper";
import config from "@/config";
import { FAQ } from "@/components/homepage/faq";
import CoachCarousel from "@/components/homepage/coach-carousel";
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dibs - Transform Your Real Estate Career with Expert Coaching',
  description: 'Elevate your real estate career with personalized coaching from industry experts. Get matched with top real estate coaches, access tailored guidance, and achieve your property goals faster.',
  openGraph: {
    title: 'Dibs - Transform Your Real Estate Career with Expert Coaching',
    description: 'Elevate your real estate career with personalized coaching from industry experts. Get matched with top real estate coaches, access tailored guidance, and achieve your property goals faster.',
  },
}

export default function Home() {
  return (
    <PageWrapper>
      <div className="flex flex-col justify-center items-center w-full mt-[1rem] p-3">
        <HeroSection />
      </div>
      <div className="flex my-[8rem] w-full justify-center items-center">
        <SideBySide />
      </div>
      <div className="flex flex-col p-2 w-full justify-center items-center">
        <MarketingCards />
      </div>
      <div className="max-w-[1200px] p-8 mt-[2rem] lg:mt-[6rem] lg:mb-[5rem]">
        <CoachCarousel />
      </div>
      {(config.auth.enabled && config.payments.enabled) && <div>
        <Pricing />
      </div>}
      <div className="flex justify-center items-center w-full my-[8rem]">
        <FAQ />
      </div>
    </PageWrapper>
  );
}
