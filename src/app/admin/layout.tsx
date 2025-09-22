

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <main className="flex-grow dashboard-bg">
            {children}
        </main>
    );
}
