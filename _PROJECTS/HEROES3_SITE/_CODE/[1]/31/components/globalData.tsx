"use client";
import { useEffect, useState } from 'react';

export const GlobalData = () => {
    const [globalData, setGlobalData] = useState(null);

    useEffect(() => {
        const eventSource = new EventSource('/api/sse-global');

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'update') {
                    setGlobalData(data.data);
                }
            } catch (error) {
                console.error('Error parsing SSE data:', error);
            }
        };

        eventSource.onerror = () => {
            console.error('SSE error occurred');
            eventSource.close();
        };

        return () => {
            eventSource.close();
        };
    }, []);

    if (!globalData) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            <h1>Global Data</h1>
            <p>Users Bet: {globalData.usersPlay}</p>
            <p>Total Bet Points: {globalData.pointsBet}</p>
            <p>Registered Users: {globalData.users}</p>
            <p>Starting Points: {globalData.pointsStart}</p>
            <p>Total User Points: {globalData.pointsAllUsers}</p>
        </div>
    );
};
