import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import { TITLE_TAILWIND_CLASS } from "@/utils/constants"

export function FAQ() {
    return (
        <div className="w-full max-w-4xl mx-auto px-4">
            <div className="text-center mb-12">
                <h2 className={`${TITLE_TAILWIND_CLASS} mt-2 font-semibold tracking-tight dark:text-white text-gray-900`}>
                    Frequently Asked Questions
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                    Common questions about our coaching platform and AI tools
                </p>
            </div>
            <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                    <AccordionTrigger>How does the pay-as-you-go pricing work?</AccordionTrigger>
                    <AccordionContent>
                        With our free tier, you can book individual coaching sessions at $149 per session. There's no subscription required - simply pay for the sessions you want. You'll also get limited access to our AI tools, including 3 AI listing generations per month.
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                    <AccordionTrigger>What AI tools are included with subscriptions?</AccordionTrigger>
                    <AccordionContent>
                        Subscribers get access to our full suite of AI tools: AI listing generator for compelling property descriptions, AI email assistant for client communications, AI voicemail bot for lead management, and AI social media machine for content creation. The specific features and usage limits vary by plan.
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3">
                    <AccordionTrigger>How are coaching sessions conducted?</AccordionTrigger>
                    <AccordionContent>
                        Coaching sessions are conducted virtually through our integrated video platform. Each session is one-on-one with your chosen coach and typically lasts 45-60 minutes. You can schedule sessions at times that work best for you through our booking system.
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-4">
                    <AccordionTrigger>What's the difference between subscription tiers?</AccordionTrigger>
                    <AccordionContent>
                        Our tiers are designed for different stages of your real estate career. The Starter plan ($199/mo) includes one monthly session and basic AI tools. Growth Pro ($599/mo) includes four monthly sessions and advanced AI features. Elite Brokerage is customized for teams with volume-based pricing and white-labeled solutions. Save 10% with annual billing on all plans.
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-5">
                    <AccordionTrigger>Can I switch coaches or cancel my subscription?</AccordionTrigger>
                    <AccordionContent>
                        Yes! You can switch coaches at any time to find the best fit for your needs. Subscriptions can be canceled or modified monthly. For annual plans, you'll continue to have access until the end of your billing period.
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-6">
                    <AccordionTrigger>What makes your AI tools different from others?</AccordionTrigger>
                    <AccordionContent>
                        Our AI tools are specifically trained for real estate professionals and integrate seamlessly with your coaching experience. They're designed to automate routine tasks while maintaining a personal touch, and they're continuously updated based on industry best practices and coach feedback.
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-7">
                    <AccordionTrigger>Do you offer team or brokerage solutions?</AccordionTrigger>
                    <AccordionContent>
                        Yes! Our Elite Brokerage tier is designed for teams and brokerages. It includes custom coaching programs, volume-based session pricing, white-labeled AI tools, and team analytics. Contact us for custom pricing based on your team's size and needs.
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>
    )
}
