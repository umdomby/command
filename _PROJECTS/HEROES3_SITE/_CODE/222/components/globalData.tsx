"use client";
import { useEffect, useState } from 'react';

// Define the structure of globalData
interface GlobalData {
    usersPlay: number;
    pointsBet: number;
    users: number;
    pointsStart: number;
    pointsAllUsers: number;
    margin: number;
    pointsPay: number;
}import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"; // Импортируем компоненты таблицы из shadcn

export const GlobalData = () => {
    const [globalData, setGlobalData] = useState<GlobalData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch initial data when the component mounts
    const fetchInitialData = async () => {
        try {
            const response = await fetch('/api/get-global-data');
            if (!response.ok) {
                throw new Error('Failed to fetch initial global data');
            }
            const data = await response.json();
            setGlobalData(data); // Set the initial data
        } catch (error) {
            console.error('Error fetching initial global data:', error);
        } finally {
            setIsLoading(false); // Stop loading
        }
    };

    useEffect(() => {
        // Fetch initial data
        fetchInitialData();

        // Set up SSE for real-time updates
        const eventSource = new EventSource('/api/sse-global');

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'update') {
                    setGlobalData(data.data); // Update data in real-time
                }
            } catch (error) {
                console.error('Error parsing SSE data:', error);
            }
        };

        eventSource.onerror = () => {
            console.error('SSE error occurred');
            eventSource.close();
        };

        // Cleanup SSE on component unmount
        return () => {
            eventSource.close();
        };
    }, []);

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (!globalData) {
        return <div>Failed to load global data</div>;
    }

    return (
        <Table style={{ boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}>
            <TableHeader>
                <TableRow style={{ backgroundColor: '#1f2937' }}>
                    <TableHead style={{ textAlign: 'center', color: '#fff', fontWeight: 'bold' }}>Users</TableHead>
                    <TableHead style={{ textAlign: 'center', color: '#fff', fontWeight: 'bold' }}>Reg</TableHead>
                    <TableHead style={{ textAlign: 'center', color: '#fff', fontWeight: 'bold' }}>Ref</TableHead>
                    <TableHead style={{ textAlign: 'center', color: '#fff', fontWeight: 'bold' }}>Pay</TableHead>
                    <TableHead style={{ textAlign: 'center', color: '#fff', fontWeight: 'bold' }}>All</TableHead>
                    <TableHead style={{ textAlign: 'center', color: '#fff', fontWeight: 'bold' }}>Users</TableHead>
                    <TableHead style={{ textAlign: 'center', color: '#fff', fontWeight: 'bold' }}>Margin</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                <TableRow style={{ transition: 'background-color 0.3s', cursor: 'pointer' }}>
                    <TableCell style={{ textAlign: 'center', fontWeight: 'bold', color: '#868788' }}>{globalData.users}</TableCell>
                    <TableCell style={{ textAlign: 'center', fontWeight: 'bold', color: '#9333ea' }}>{globalData.pointsPay}</TableCell>
                    <TableCell style={{ textAlign: 'center', fontWeight: 'bold', color: '#dc2626' }}>{globalData.usersPlay}</TableCell>
                    <TableCell style={{ textAlign: 'center', fontWeight: 'bold', color: '#4f46e5' }}>{globalData.pointsBet}</TableCell>
                    <TableCell style={{ textAlign: 'center', fontWeight: 'bold', color: '#2563eb' }}>{globalData.pointsStart}</TableCell>
                    <TableCell style={{ textAlign: 'center', fontWeight: 'bold', color: '#16a34a' }}>{globalData.pointsAllUsers}</TableCell>
                    <TableCell style={{ textAlign: 'center', fontWeight: 'bold', color: '#db2777' }}>{globalData.margin}</TableCell>
                </TableRow>
            </TableBody>
        </Table>
    );
};
