
import { AdminDashboard } from "@/components/admin-dashboard";

// This export ensures the page is always dynamically rendered.
export const revalidate = 0;

export default function AdminPage() {
    return <AdminDashboard />;
}
