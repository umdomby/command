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
                                    <DropdownMenuRadioItem value="home">
                                        HOME
                                    </DropdownMenuRadioItem>
                                </Link>
                                <Link href="/bet-closed">
                                    <DropdownMenuRadioItem value="bet-closed">
                                        BET CLOSED
                                    </DropdownMenuRadioItem>
                                </Link>
                                <Link href="/bet-all-closed">
                                    <DropdownMenuRadioItem value="bet-closed">
                                        WINN/LOSE PLAYERS
                                    </DropdownMenuRadioItem>
                                </Link>
                                <Link href="/transfer-points">
                                    <DropdownMenuRadioItem value="bet-closed">
                                        TRANSFER
                                    </DropdownMenuRadioItem>
                                </Link>
                                <Link href="/order-p2p">
                                    <DropdownMenuRadioItem value="bet-closed">
                                        BUY/PAY P2P
                                    </DropdownMenuRadioItem>
                                </Link>
                                <Link href="/order-p2p-pending">
                                    <DropdownMenuRadioItem value="bet-closed">
                                        BUY/PAY OPEN/CLOSED
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
        );
};
