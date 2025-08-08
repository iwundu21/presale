
export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8">
            {children}
        </main>
    )
}
