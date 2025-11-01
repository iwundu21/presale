
export function Logo({ isAdmin = false }: { isAdmin?: boolean }) {
    if (isAdmin) {
        return <h1 className="text-2xl font-bold text-white">Exnus Admin</h1>
    }
    return <h1 className="text-xl font-bold text-white">Exnus Protocol</h1>
}

