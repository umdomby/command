```jsx
import {Container} from "@/components/shared";
import {prisma} from "@/prisma/prisma-client";
import {Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import React from "react";


export default async function Page() {

    const gameRecords = await prisma.gameRecords.findMany({
        include: {
            user: true,
        }
    });

    const gameName = await prisma.gameName.findMany({});

    return (
        <main className="min-h-screen bg-white rounded-3xl">

            <Container className="pb-14">
                <div className="flex gap-[60px]">

                    <div className="w-[250px]">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[400px]">GAME</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>

                                {gameName.map((gameName) => (
                                    <TableRow key={gameName.id}>
                                        <TableCell className="font-medium">{gameName.name}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        {/*<GameNames/>*/}
                    </div>

                    <div className="flex-1">
                        <Table>
                            <TableCaption>Need For Speed Records</TableCaption>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[400px]">GAME</TableHead>
                                    <TableHead>Map</TableHead>
                                    <TableHead >User</TableHead>
                                    <TableHead className="text-right">Time</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>

                                {gameRecords.map((gameRecords) => (
                                    <TableRow key={gameRecords.id}>
                                        <TableCell className="font-medium">{gameRecords.name}</TableCell>
                                        <TableCell>{gameRecords.description}</TableCell>
                                        <TableCell>{gameRecords.user.fullName}</TableCell>
                                        <TableCell className="text-right">{gameRecords.timestate.substring(3)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        {/*<GameRecord/>*/}
                    </div>

                </div>
            </Container>
        </main>
    );
}


```

