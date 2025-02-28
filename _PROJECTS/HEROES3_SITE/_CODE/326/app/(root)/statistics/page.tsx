import { prisma } from '@/prisma/prisma-client';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import Link from 'next/link';
import { Button } from "@/components/ui";
import React from "react";
import {globalDataPoints} from "@/app/actions";

interface GlobalData {
    id: number;
    margin: number | null;
    createdAt: Date;
    updatedAt: Date;
    ref: number | null;
    users: number;
    reg: number | null;
    usersPoints: number | null;
    openBetsPoints: number | null;
    betFund: number | null;
    gameUserBetOpen: number | null;
    p2pPoints: number | null;


}

async function fetchGlobalData(page: number): Promise<GlobalData[]> {
    const take = 27;
    const skip = (page - 1) * take;

    const data = await prisma.globalData.findMany({
        orderBy: {
            id: 'desc',
        },
        take,
        skip,
    });

    return data;
}

async function fetchTotalCount(): Promise<number> {
    const count = await prisma.globalData.count();
    return count;
}

export default async function StatisticsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
    await globalDataPoints();

    const resolvedSearchParams = await searchParams;
    const currentPage = parseInt(resolvedSearchParams.page ?? '1', 10);
    const globalDataList = await fetchGlobalData(currentPage);
    const totalCount = await fetchTotalCount();
    const totalPages = Math.ceil(totalCount / 27);

    if (globalDataList.length === 0) {
        return <div>Нет доступных данных</div>;
    }

    return (
        <div>
            <Table style={{ boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}>
                <TableHeader>
                    <TableRow style={{ backgroundColor: '#1f2937' }}>
                        <TableHead style={{ textAlign: 'center', color: '#fff', fontWeight: 'bold' }}>Date</TableHead>
                        <TableHead style={{ textAlign: 'center', color: '#fff', fontWeight: 'bold' }}>Start</TableHead>
                        <TableHead style={{ textAlign: 'center', color: '#fff', fontWeight: 'bold' }}>Reg</TableHead>
                        <TableHead style={{ textAlign: 'center', color: '#fff', fontWeight: 'bold' }}>Ref</TableHead>
                        <TableHead style={{ textAlign: 'center', color: '#fff', fontWeight: 'bold' }}>OpenBet</TableHead>
                        <TableHead style={{ textAlign: 'center', color: '#fff', fontWeight: 'bold' }}>OpenP2P</TableHead>
                        <TableHead style={{ textAlign: 'center', color: '#fff', fontWeight: 'bold' }}>myGame</TableHead>
                        <TableHead style={{ textAlign: 'center', color: '#fff', fontWeight: 'bold' }}>User</TableHead>
                        <TableHead style={{ textAlign: 'center', color: '#fff', fontWeight: 'bold' }}>Fund</TableHead>
                        <TableHead style={{ textAlign: 'center', color: '#fff', fontWeight: 'bold' }}>Margin</TableHead>
                        <TableHead style={{ textAlign: 'center', color: '#fff', fontWeight: 'bold' }}>Sum</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {globalDataList.map((globalData, index) => {

                        const initialFund = 1000000;
                        const adjustedFund = initialFund + (globalData.betFund ?? 0);

                        const totalSum =
                            (globalData.openBetsPoints ?? 0) +
                            (globalData.usersPoints ?? 0) +
                            (adjustedFund ?? 0) +
                            (globalData.margin ?? 0) +
                            (globalData.gameUserBetOpen ?? 0) +
                            (globalData.p2pPoints ?? 0);

                        const isFirstRecord = index === 0;
                        const rowStyle = isFirstRecord
                            ? { backgroundColor: '#4c4c4c', transition: 'background-color 0.3s', cursor: 'pointer' }
                            : { transition: 'background-color 0.3s', cursor: 'pointer' };

                        return (
                            <TableRow key={globalData.id} style={rowStyle}>
                                <TableCell style={{ textAlign: 'center', fontWeight: 'bold', color: '#f64343' }}>{new Date(globalData.updatedAt).toLocaleString('en-US', { hour12: false })}</TableCell>
                                <TableCell style={{ textAlign: 'center', fontWeight: 'bold', color: '#1db812' }}>11M</TableCell>
                                <TableCell style={{ textAlign: 'center', fontWeight: 'bold', color: '#f1b11e' }}>{globalData.reg ?? 'N/A'}</TableCell>
                                <TableCell style={{ textAlign: 'center', fontWeight: 'bold', color: '#a5e24a' }}>{globalData.ref ?? 'N/A'}</TableCell>
                                <TableCell style={{ textAlign: 'center', fontWeight: 'bold', color: '#718dff' }}>{globalData.openBetsPoints ?? 'N/A'}</TableCell>
                                <TableCell style={{ textAlign: 'center', fontWeight: 'bold', color: '#d11acb' }}>{globalData.p2pPoints ?? 'N/A'}</TableCell>
                                <TableCell style={{ textAlign: 'center', fontWeight: 'bold', color: '#cdca59' }}>{globalData.gameUserBetOpen ?? 'N/A'}</TableCell>
                                <TableCell style={{ textAlign: 'center', fontWeight: 'bold', color: '#cdca59' }}>{globalData.usersPoints ?? 'N/A'}</TableCell>
                                <TableCell style={{ textAlign: 'center', fontWeight: 'bold', color: '#b541d3' }}>{adjustedFund}</TableCell>
                                <TableCell style={{ textAlign: 'center', fontWeight: 'bold', color: '#2563eb' }}>{globalData.margin ?? 'N/A'}</TableCell>
                                <TableCell style={{ textAlign: 'center', fontWeight: 'bold', color: '#30ff00' }}>{Math.floor(totalSum * 100) / 100}</TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
                <Link href={`?page=${currentPage - 1}`}>
                    <Button className="btn btn-primary mx-2 w-[100px] h-7" disabled={currentPage === 1}>Previous</Button>
                </Link>
                <span style={{ margin: '0 10px' }}>Page {currentPage}</span>
                {currentPage < totalPages && (
                    <Link href={`?page=${currentPage + 1}`}>
                        <Button className="btn btn-primary mx-2 w-[100px] h-7">Next</Button>
                    </Link>
                )}
            </div>
        </div>
    );
}
