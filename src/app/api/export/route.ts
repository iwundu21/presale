
import { getAllUsers } from "@/services/firestore-service";
import { headers } from 'next/headers';
import { NextRequest, NextResponse } from "next/server";

const ADMIN_WALLET_ADDRESS = "5Gy5qYXhYs7aPfEztAG6vTPVow5snudPksBvF5DAYLpX";

// Function to convert array of objects to CSV
function convertToCSV(data: any[]) {
    if (!data || data.length === 0) {
        return "";
    }
    const headers = Object.keys(data[0]);
    const csvRows = [
        headers.join(','), // header row
        ...data.map(row => 
            headers.map(fieldName => 
                JSON.stringify(row[fieldName], (key, value) => value === null ? '' : value)
            ).join(',')
        )
    ];
    return csvRows.join('\r\n');
}

export async function GET(req: NextRequest) {
    try {
        // A real app would have more robust auth, but for this use case
        // we can check for a header sent from the client.
        const wallet = req.headers.get('x-admin-wallet');
        
        // This is not a secure way to protect an API route.
        // In a real production app, you should use a proper authentication mechanism
        // like JWTs, sessions, or a dedicated API key solution.
        // For this demo, we are proceeding with a simple header check.
        if (wallet !== ADMIN_WALLET_ADDRESS) {
            return new NextResponse("Unauthorized", { status: 401 });
        }
        
        const users = await getAllUsers();
        const csvData = convertToCSV(users);

        const responseHeaders = new Headers();
        responseHeaders.set('Content-Type', 'text/csv');
        responseHeaders.set('Content-Disposition', `attachment; filename="exnus_user_data_${new Date().toISOString()}.csv"`);

        return new NextResponse(csvData, { headers: responseHeaders });

    } catch (error) {
        console.error("Failed to export user data:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
