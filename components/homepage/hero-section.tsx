import { ArrowRight } from 'lucide-react';
import Link from "next/link";
import { BorderBeam } from "../magicui/border-beam";
import { Button } from "../ui/button";
import Image from 'next/image';
import { TITLE_TAILWIND_CLASS } from '@/utils/constants';

export default function HeroSection() {
    return (
        <section className='flex flex-col items-center justify-center leading-6 mt-[3rem]' aria-label="Real Estate Coaching Marketplace">
            <h1 className={`${TITLE_TAILWIND_CLASS} scroll-m-20 font-semibold tracking-tight text-center max-w-[1120px] bg-gradient-to-b dark:text-white`}>
                Elevate Your Real Estate Career with Expert Coaching
            </h1>
            <p className="mx-auto max-w-[700px] text-gray-500 text-center mt-2 dark:text-gray-400">
                Connect with top real estate coaches who can help you reach your full potential. Whether you're a new agent or an experienced professional, find the guidance you need to succeed.
            </p>
            <div className="flex justify-center items-center gap-3">
                <Link href="/sign-in?forceRedirectUrl=/dashboard/mentee/browse-coaches" className="mt-5">
                    <Button className="animate-buttonheartbeat rounded-md bg-blue-600 hover:bg-blue-500 text-sm font-semibold text-white">
                        Find Your Coach
                    </Button>
                </Link>

                <Link href="/become-coach" className="mt-5">
                    <Button variant="outline" className="flex gap-1">
                        Become a Coach
                        <ArrowRight className='w-4 h-4' aria-hidden="true" />
                    </Button>
                </Link>
            </div>
            <div className="w-full max-w-6xl mx-auto px-4 mt-12">
                <div className="relative rounded-xl overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 via-transparent to-transparent z-10" />
                    <Image
                        src="/mock-dashboard.png"
                        alt="Real estate coaching platform dashboard"
                        width={1200}
                        height={675}
                        priority={true}
                        className="w-full h-auto rounded-xl shadow-2xl"
                    />
                    <BorderBeam size={250} duration={12} delay={9} />
                    <div className="absolute -top-4 -right-4 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl -z-10" />
                    <div className="absolute -bottom-4 -left-4 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl -z-10" />
                </div>
            </div>
        </section>
    )
}
