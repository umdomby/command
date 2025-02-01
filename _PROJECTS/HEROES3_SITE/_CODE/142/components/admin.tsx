'use admin';

import React from 'react';
import Link from 'next/link';
import {ModeToggle} from "@/components/buttonTheme";
import {Button} from "@/components/ui";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {getUserSession} from "@/components/lib/get-user-session";
import {redirect} from "next/navigation";
import {prisma} from "@/prisma/prisma-client";

interface Props {
    className?: string;
}

export const Admin: React.FC<Props> = async ({className}) => {
    const session = await getUserSession();

    if (!session) {
        return redirect('/not-auth');
    }


    const user = await prisma.user.findFirst({where: {id: Number(session?.id)}});
    if (user.role === 'ADMIN') {
        return (
            <div className="flex items-center absolute right-[44%] mt-8">
                <div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild className="width-[20%]">
                            <Button variant="outline" className="h-5">ADMIN</Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56">
                            <DropdownMenuRadioGroup>
                                <Link href="/">
                                    <DropdownMenuRadioItem value="home">
                                        HOME
                                    </DropdownMenuRadioItem>
                                </Link>
                                <Link href="/bet-create">
                                    <DropdownMenuRadioItem value="create-bet">
                                        CREATE BET
                                    </DropdownMenuRadioItem>
                                </Link>
                                <Link href="/bet-closed">
                                    <DropdownMenuRadioItem value="bet-closed">
                                        MY BET CLOSED
                                    </DropdownMenuRadioItem>
                                </Link>
                                <Link href="/bet-all-closed">
                                    <DropdownMenuRadioItem value="bet-closed">
                                        BET ALL CLOSED
                                    </DropdownMenuRadioItem>
                                </Link>
                                <Link href="/transfer-points">
                                    <DropdownMenuRadioItem value="bet-closed">
                                        TRANSFER POINTS
                                    </DropdownMenuRadioItem>
                                </Link>
                                <Link href="/buy-pay-points">
                                    <DropdownMenuRadioItem value="bet-closed">
                                        BUY/PAY POINTS
                                    </DropdownMenuRadioItem>
                                </Link>
                                <Link href="/contacts">
                                    <DropdownMenuRadioItem value="bet-closed">
                                        CONTACTS
                                    </DropdownMenuRadioItem>
                                </Link>
                                <Link href="/rating">
                                    <DropdownMenuRadioItem value="rating">
                                        RATING
                                    </DropdownMenuRadioItem>
                                </Link>
                                <DropdownMenuRadioItem value="create-bet"><ModeToggle/></DropdownMenuRadioItem>
                            </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        );
    }
};
