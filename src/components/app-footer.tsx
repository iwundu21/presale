
"use client";

import Link from "next/link";

export function AppFooter() {
    return (
        <footer className="p-4 border-t border-white/10 text-sm text-muted-foreground">
            <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
                <span>© {new Date().getFullYear()} Exnus. All rights reserved.</span>
                <div className="flex gap-4">
                    <Link href="/terms" className="hover:text-white transition-colors">Terms & Conditions</Link>
                    <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
                </div>
                <div className="flex items-center gap-4">
                    <a href="https://x.com/exnusprotocol?s=09" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-white transition-colors">
                        X
                    </a>
                    <a href="https://discord.gg/v8MpYYFdP8" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-white transition-colors">
                        Discord
                    </a>
                    <a href="https://t.me/Exnusprotocol" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-white transition-colors">
                        Telegram
                    </a>
                </div>
            </div>
        </footer>
    );
}
