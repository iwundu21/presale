
"use client";

import Link from "next/link";

export function AppFooter() {
    return (
        <footer className="p-4 border-t border-white/10 text-sm text-muted-foreground">
            <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
                <span>© {new Date().getFullYear()} Exnus. All rights reserved.</span>
                <div className="flex gap-4">
                    <Link href="#" className="hover:text-white transition-colors">Terms & Conditions</Link>
                    <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
                </div>
            </div>
        </footer>
    );
}
