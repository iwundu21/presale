
"use client";

export function AppFooter() {
    return (
        <footer className="text-center p-4 text-sm text-muted-foreground border-t border-white/10">
            © {new Date().getFullYear()} Exnus. All rights reserved.
        </footer>
    );
}
