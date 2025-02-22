import Link from 'next/link';

export function CoachesFooter() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="dark:bg-black py-6 mt-auto w-full">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-[280px,1fr] gap-8">
                    <div className="hidden lg:block" /> {/* Sidebar space */}
                    <div className="flex flex-col items-center max-w-3xl mx-auto w-full">
                        <div className="w-full border-t pt-6">
                            {/* Legal Links */}
                            <ul className="flex flex-wrap justify-center gap-6 text-sm">
                                <li>
                                    <Link 
                                        href="/terms" 
                                        className="transition hover:opacity-75"
                                        target="_blank"
                                    >
                                        Terms & Conditions
                                    </Link>
                                </li>
                                <li>
                                    <Link 
                                        href="/privacy" 
                                        className="transition hover:opacity-75"
                                        target="_blank"
                                    >
                                        Privacy Policy
                                    </Link>
                                </li>
                            </ul>

                            {/* Copyright */}
                            <p className="text-sm text-center mt-4 text-muted-foreground">
                                &copy; {currentYear} Dibs Technology, Inc. All rights reserved.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    )
} 