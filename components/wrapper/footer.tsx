"use client"
import Link from 'next/link';

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="border-t dark:bg-black py-6 mt-auto">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col items-center justify-center space-y-4">
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
                    <p className="text-sm text-center text-muted-foreground">
                        &copy; {currentYear} Dibs Technology, Inc. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    )
}
