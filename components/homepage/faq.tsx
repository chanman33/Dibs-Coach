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
                        There's no subscription required - simply pay for the sessions you want. Coaches are paid directly by you. They set their own rates.
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                    <AccordionTrigger>How are coaching sessions conducted?</AccordionTrigger>
                    <AccordionContent>
                        Coaching sessions are conducted virtually through our integrated video platform. Each session is one-on-one with your chosen coach and typically lasts 30-60 minutes. You can schedule sessions at times that work best for you through our booking system.
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-4">
                    <AccordionTrigger>Can I switch coaches anytime? Are there any restrictions?</AccordionTrigger>
                    <AccordionContent>
                        Yes! You can switch coaches at any time to find the best fit for your needs. 
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-5">
                    <AccordionTrigger>Do you offer team or brokerage-wide solutions?</AccordionTrigger>
                    <AccordionContent>
                        Yes! Our Elite Brokerage tier is designed for teams and brokerages. It includes custom coaching programs, volume-based session pricing, and team analytics. Contact us for custom pricing based on your team's size and needs.
                    </AccordionContent>
                </AccordionItem>
            </Accordion >
        </div >
    )
}
