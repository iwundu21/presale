
"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [passcode, setPasscode] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        const sessionAuth = sessionStorage.getItem('isAdminAuthenticated');
        if (sessionAuth === 'true') {
            setIsAuthenticated(true);
        }
    }, []);

    const handleVerifyPasscode = async () => {
        setIsVerifying(true);
        try {
            const response = await fetch('/api/admin/verify-passcode', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ passcode }),
            });

            if (response.ok) {
                setIsAuthenticated(true);
                sessionStorage.setItem('isAdminAuthenticated', 'true');
                toast({
                    title: "Access Granted",
                    description: "Welcome to the Admin Dashboard.",
                    variant: "success",
                });
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || "Incorrect passcode.");
            }

        } catch (error: any) {
            toast({
                title: "Authentication Failed",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setIsVerifying(false);
        }
    };
    
    if (!isAuthenticated) {
        return (
             <main className="container mx-auto p-4 sm:p-6 lg:p-8 flex items-center justify-center min-h-[calc(100vh-200px)]">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle>Admin Access</CardTitle>
                        <CardDescription>
                            Please enter the passcode to access the admin dashboard.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Input 
                            type="password"
                            placeholder="Enter passcode"
                            value={passcode}
                            onChange={(e) => setPasscode(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleVerifyPasscode()}
                            disabled={isVerifying}
                        />
                        <Button onClick={handleVerifyPasscode} disabled={isVerifying} className="w-full">
                            {isVerifying ? "Verifying..." : "Enter"}
                        </Button>
                    </CardContent>
                </Card>
            </main>
        )
    }

    return children;
}
