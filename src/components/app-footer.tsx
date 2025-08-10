
"use client";

import Link from "next/link";
import { Send, X } from "lucide-react";

const DiscordIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M14.5,9C13.7,9,13,9.7,13,10.5C13,11.3,13.7,12,14.5,12C15.3,12,16,11.3,16,10.5C16,9.7,15.3,9,14.5,9Z" />
      <path d="M9.5,9C8.7,9,8,9.7,8,10.5C8,11.3,8.7,12,9.5,12C10.3,12,11,11.3,11,10.5C11,9.7,10.3,9,9.5,9Z" />
      <path d="M7.9,16.5C7.9,16.5,8.2,17.2,8.9,17.7C9.6,18.2,10.3,18.4,10.3,18.4L10.6,18.1C9.6,17.7,9.1,17.1,9.1,17.1L8.8,16.8C8.8,16.8,8.2,16.2,7.9,16.5Z" />
      <path d="M16.1,16.5C16.1,16.5,15.8,17.2,15.1,17.7C14.4,18.2,13.7,18.4,13.7,18.4L13.4,18.1C14.4,17.7,14.9,17.1,14.9,17.1L15.2,16.8C15.2,16.8,15.8,16.2,16.1,16.5Z" />
      <path d="M22,12A10,10 0 0,0 12,2A10,10 0 0,0 2,12C2,16.42,4.87,20.17,8.82,21.48L9.85,18.46C9.17,18.22,8.5,17.86,7.9,17.45C7.3,17.04,6.83,16.56,6.5,16.03L7.33,15.36C7.86,15.89,8.5,16.35,9.2,16.7C9.9,17.05,10.6,17.3,11.4,17.45C11.6,17.48,11.8,17.5,12,17.5C12.2,17.5,12.4,17.48,12.6,17.45C13.4,17.3,14.1,17.05,14.8,16.7C15.5,16.35,16.14,15.89,16.67,15.36L17.5,16.03C17.17,16.56,16.7,17.04,16.1,17.45C15.5,17.86,14.83,18.22,14.15,18.46L15.18,21.48C19.13,20.17,22,16.42,22,12Z" />
    </svg>
);

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
                    <a href="#" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-1 text-muted-foreground hover:text-white transition-colors">
                        <X className="h-5 w-5" />
                        <span className="text-xs">X</span>
                    </a>
                    <a href="#" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-1 text-muted-foreground hover:text-white transition-colors">
                        <DiscordIcon className="h-5 w-5" />
                        <span className="text-xs">Discord</span>
                    </a>
                    <a href="https://t.me/Exnusprotocol" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-1 text-muted-foreground hover:text-white transition-colors">
                        <Send className="h-5 w-5" />
                        <span className="text-xs">Telegram</span>
                    </a>
                </div>
            </div>
        </footer>
    );
}
