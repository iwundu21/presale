
import Image from 'next/image';

export function Logo({ isAdmin = false }: { isAdmin?: boolean }) {
    if (isAdmin) {
        return <h1 className="text-2xl font-bold text-white">Exnus Admin</h1>
    }
    return (
        <Image
            src="/logo.png"
            alt="Exnus Protocol Logo"
            width={140}
            height={40}
            priority
        />
    )
}
