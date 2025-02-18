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

export const Access_user: React.FC<Props> = ({className}) => {

        return (

                <div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild className="width-[20%]">
                            <Button variant="outline" className="h-5">USER</Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56">
                            <DropdownMenuRadioGroup>
                                <Link href="/">
                                    <DropdownMenuRadioItem value="home" className="cursor-pointer">
                                        HOME
                                    </DropdownMenuRadioItem>
                                </Link>
                                <Link href="/bet-closed-2-3-4">
                                    <DropdownMenuRadioItem value="bet-closed-2-3-4" className="cursor-pointer">
                                        BET CLOSED ALL
                                    </DropdownMenuRadioItem>
                                </Link>
                                <Link href="/bet-closed-2">
                                    <DropdownMenuRadioItem value="bet-closed" className="cursor-pointer">
                                        BET CLOSED 2
                                    </DropdownMenuRadioItem>
                                </Link>
                                <Link href="/bet-closed-3">
                                    <DropdownMenuRadioItem value="bet-closed-3" className="cursor-pointer">
                                        BET CLOSED 3
                                    </DropdownMenuRadioItem>
                                </Link>
                                <Link href="/bet-closed-4">
                                    <DropdownMenuRadioItem value="bet-closed-4" className="cursor-pointer">
                                        BET CLOSED 4
                                    </DropdownMenuRadioItem>
                                </Link>
                                <Link href="/bet-winn-lose-closed-2">
                                    <DropdownMenuRadioItem value="bet-winn-lose-closed-2" className="cursor-pointer">
                                        WINN/LOSE PLAYERS 2
                                    </DropdownMenuRadioItem>
                                </Link>
                                <Link href="/bet-winn-lose-closed-3">
                                    <DropdownMenuRadioItem value="bet-winn-lose-closed-3" className="cursor-pointer">
                                        WINN/LOSE PLAYERS 3
                                    </DropdownMenuRadioItem>
                                </Link>
                                <Link href="/bet-winn-lose-closed-4">
                                    <DropdownMenuRadioItem value="bet-winn-lose-closed-4" className="cursor-pointer">
                                        WINN/LOSE PLAYERS 4
                                    </DropdownMenuRadioItem>
                                </Link>
                                <Link href="/transfer-points">
                                    <DropdownMenuRadioItem value="bet-closed" className="cursor-pointer">
                                        TRANSFER
                                    </DropdownMenuRadioItem>
                                </Link>
                                <Link href="/order-p2p">
                                    <DropdownMenuRadioItem value="bet-closed" className="cursor-pointer">
                                        P2P
                                    </DropdownMenuRadioItem>
                                </Link>
                                <Link href="/order-p2p-pending">
                                    <DropdownMenuRadioItem value="bet-closed" className="cursor-pointer">
                                        P2P PENDING
                                    </DropdownMenuRadioItem>
                                </Link>
                                <Link href="/contacts">
                                    <DropdownMenuRadioItem value="bet-closed" className="cursor-pointer">
                                        CONTACTS
                                    </DropdownMenuRadioItem>
                                </Link>
                                <Link href="/rating">
                                    <DropdownMenuRadioItem value="rating" className="cursor-pointer">
                                        RATING
                                    </DropdownMenuRadioItem>
                                </Link>
                                <Link href="/manual">
                                    <DropdownMenuRadioItem value="manual" className="cursor-pointer">
                                        MANUAL
                                    </DropdownMenuRadioItem>
                                </Link>
                                <Link href="/tur">
                                    <DropdownMenuRadioItem value="tur" className="cursor-pointer">
                                        ТУРНИРЫ
                                    </DropdownMenuRadioItem>
                                </Link>
                                <DropdownMenuRadioItem value="create-bet"><ModeToggle/></DropdownMenuRadioItem>
                            </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>
            </div>
        );
};
