
"use client";

import { Button } from "./ui/button";
import { LogOut } from "lucide-react";

type AdminHeaderProps = {
    onLogout: () => void;
}

export function AdminHeader({ onLogout }: AdminHeaderProps) {
    return (
        <header className="p-4 border-b border-white/10 sticky top-0 bg-background/80 backdrop-blur-sm z-10">
            <div className="container mx-auto flex justify-between items-center">
                <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
                <Button variant="outline" onClick={onLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                </Button>
            </div>
        </header>
    );
}
