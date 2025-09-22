
"use client";

import Link from "next/link";
import Image from "next/image";

export function AppFooter() {
    return (
        <footer className="p-4 border-t border-white/10 text-sm text-muted-foreground">
            <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
                <span>© {new Date().getFullYear()} Exnus. All rights reserved.</span>
                <div className="flex gap-4">
                    <Link href="/terms" className="hover:text-white transition-colors">Terms & Conditions</Link>
                    <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
                </div>
                <div className="flex items-center gap-6">
                    <a href="https://x.com/exnusprotocol?s=09" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-1 text-muted-foreground hover:text-white transition-colors">
                        <Image src="/X.jpg" alt="X Logo" width={20} height={20} className="h-5 w-5" />
                        <span className="text-xs">X</span>
                    </a>
                    <a href="https://discord.gg/v8MpYYFdP8" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-1 text-muted-foreground hover:text-white transition-colors">
                        <Image src="/discord.jpg" alt="Discord Logo" width={20} height={20} className="h-5 w-5" />
                        <span className="text-xs">Discord</span>
                    </a>
                    <a href="https://t.me/Exnusprotocol" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-1 text-muted-foreground hover:text-white transition-colors">
                        <Image src="/tg.jpg" alt="Telegram Logo" width={20} height={20} className="h-5 w-5" />
                        <span className="text-xs">Telegram</span>
                    </a>
                </div>
            </div>
        </footer>
    );
}
