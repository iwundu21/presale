
"use client";

import Image from 'next/image';

export function AdminHeader() {
    return (
        <header className="p-4 border-b border-white/10 sticky top-0 bg-background/80 backdrop-blur-sm z-10">
            <div className="container mx-auto flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <Image src="/logo.png" alt="Exnus Logo" width={32} height={32} className="h-8 w-8" />
                    <h1 className="text-2xl font-bold text-white">Exnus Admin</h1>
                </div>
            </div>
        </header>
    );
}
