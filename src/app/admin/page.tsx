
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminPage() {
    return (
        <main className="container mx-auto p-4 sm:p-6 lg:p-8">
             <div className="flex items-center justify-between gap-3 mb-8">
                <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>System Update</CardTitle>
                </CardHeader>
                <CardContent>
                    <CardDescription>
                        The Firebase Database service has been removed. Admin functionality is currently disabled.
                    </CardDescription>
                </CardContent>
            </Card>
        </main>
    );
}
