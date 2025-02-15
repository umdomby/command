// components/globalData.tsx

"use client";
import { useEffect, useState } from 'react';
import { getGlobalData } from '@/app/actions'; // Импортируем новую функцию
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

interface GlobalData {
    users: number;
    reg: number;
    ref: number;
    usersPoints: number;
    margin: number;
    openBetsPoints: number;
}

export const GlobalData = () => {
    const [globalData, setGlobalData] = useState<GlobalData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = async () => {
        try {
            const data = await getGlobalData(); // Используем функцию для получения данных
            if (!data || Object.keys(data).length === 0) {
                console.warn('No data available');
                setGlobalData(null);
            } else {
                setGlobalData(data);
            }
            setIsLoading(false);
        } catch (error) {
            console.error('Failed to fetch global data:', error);
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData(); // Первоначальная загрузка данных
        const interval = setInterval(fetchData, 15000); // Обновляем данные каждые 15 секунд

        return () => clearInterval(interval); // Очищаем интервал при размонтировании компонента
    }, []);

    if (isLoading) {
        return <div>Загрузка...</div>;
    }

    if (!globalData) {
        return <div>Нет доступных данных</div>;
    }

    const totalSum = globalData.reg + globalData.ref + globalData.openBetsPoints + globalData.usersPoints;

    return (
        <Table style={{ boxShadow: '0 4px 6px rgba(0, 0, 0, 0, 0.1)' }}>
            <TableHeader>
                <TableRow style={{ backgroundColor: '#1f2937' }}>
                    <TableHead style={{ textAlign: 'center', color: '#fff', fontWeight: 'bold' }}>Start</TableHead>
                    <TableHead style={{ textAlign: 'center', color: '#fff', fontWeight: 'bold' }}>Reg</TableHead>
                    <TableHead style={{ textAlign: 'center', color: '#fff', fontWeight: 'bold' }}>Ref</TableHead>
                    <TableHead style={{ textAlign: 'center', color: '#fff', fontWeight: 'bold' }}>Open</TableHead>
                    <TableHead style={{ textAlign: 'center', color: '#fff', fontWeight: 'bold' }}>User</TableHead>
                    <TableHead style={{ textAlign: 'center', color: '#fff', fontWeight: 'bold' }}>Sum</TableHead>
                    <TableHead style={{ textAlign: 'center', color: '#fff', fontWeight: 'bold' }}>Margin</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                <TableRow style={{ transition: 'background-color 0.3s', cursor: 'pointer' }}>
                    <TableCell style={{ textAlign: 'center', fontWeight: 'bold', color: '#db2777' }}>1 000 000</TableCell>
                    <TableCell style={{ textAlign: 'center', fontWeight: 'bold', color: '#9333ea' }}>{globalData.reg}</TableCell>
                    <TableCell style={{ textAlign: 'center', fontWeight: 'bold', color: '#dc2626' }}>{globalData.ref}</TableCell>
                    <TableCell style={{ textAlign: 'center', fontWeight: 'bold', color: '#868788' }}>{globalData.openBetsPoints}</TableCell>
                    <TableCell style={{ textAlign: 'center', fontWeight: 'bold', color: '#cdca59' }}>{globalData.usersPoints}</TableCell>
                    <TableCell style={{ textAlign: 'center', fontWeight: 'bold', color: '#1db812' }}>{totalSum}</TableCell>
                    <TableCell style={{ textAlign: 'center', fontWeight: 'bold', color: '#2563eb' }}>{globalData.margin}</TableCell>
                </TableRow>
            </TableBody>
        </Table>
    );
};
