
import { AdminDashboard } from "@/components/admin-dashboard";
import { AdminOnly } from "@/components/admin-only";

// This export ensures the page is always dynamically rendered.
export const revalidate = 0;

export default function AdminPage() {
    return (
        <AdminOnly>
            <AdminDashboard />
        </AdminOnly>
    );
}
