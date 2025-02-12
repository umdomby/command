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


interface Props {
    className?: string;
}

export const Access_admin: React.FC<Props> = ({className}) => {

        return (
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
                                    <DropdownMenuRadioItem value="bet-create">
                                       ADMIN CREATE BET 2
                                    </DropdownMenuRadioItem>
                                </Link>
                                <Link href="/bet-create-3">
                                    <DropdownMenuRadioItem value="bet-create-3">
                                        ADMIN CREATE BET 3
                                    </DropdownMenuRadioItem>
                                </Link>
                                <Link href="/bet-create-4">
                                    <DropdownMenuRadioItem value="bet-create-4">
                                        ADMIN CREATE BET 4
                                    </DropdownMenuRadioItem>
                                </Link>
                                <Link href="/add-player">
                                    <DropdownMenuRadioItem value="add-player">
                                        ADMIN ADD PLAYER
                                    </DropdownMenuRadioItem>
                                </Link>
                                <Link href="/bet-closed-admin">
                                    <DropdownMenuRadioItem value="bet-closed-admin">
                                       ADMIN BET CLOSED
                                    </DropdownMenuRadioItem>
                                </Link>
                                <Link href="/order-p2p-pending-admin">
                                    <DropdownMenuRadioItem value="order-p2p-pending-admin">
                                        ADMIN P2P PENDING
                                    </DropdownMenuRadioItem>
                                </Link>
                                <Link href="/transfer-points-admin">
                                    <DropdownMenuRadioItem value="transfer-points-admin">
                                        ADMIN TRANSFER
                                    </DropdownMenuRadioItem>
                                </Link>
                                <Link href="/bet-closed">
                                    <DropdownMenuRadioItem value="bet-closed">
                                        BET CLOSED
                                    </DropdownMenuRadioItem>
                                </Link>
                                <Link href="/bet-all-closed">
                                    <DropdownMenuRadioItem value="bet-all-closed">
                                        WINN/LOSE PLAYERS
                                    </DropdownMenuRadioItem>
                                </Link>
                                <Link href="/transfer-points">
                                    <DropdownMenuRadioItem value="transfer-points">
                                        TRANSFER
                                    </DropdownMenuRadioItem>
                                </Link>
                                <Link href="/order-p2p">
                                    <DropdownMenuRadioItem value="order-p2p">
                                        P2P
                                    </DropdownMenuRadioItem>
                                </Link>
                                <Link href="/order-p2p-pending">
                                    <DropdownMenuRadioItem value="order-p2p-pending">
                                        P2P PENDING
                                    </DropdownMenuRadioItem>
                                </Link>
                                <Link href="/contacts">
                                    <DropdownMenuRadioItem value="contacts">
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
        );
};
