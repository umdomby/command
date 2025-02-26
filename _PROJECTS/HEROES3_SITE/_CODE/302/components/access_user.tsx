"use client"
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
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu"

interface Props {
    className?: string;
}

export const Access_user: React.FC<Props> = ({className}) => {

    const [open, setOpen] = React.useState(false);
    const [isHovered, setIsHovered] = React.useState(false);
    const [delayHandler, setDelayHandler] = React.useState<number | null>(null);


    return (
        <div className={className}>
            <DropdownMenu open={open} onOpenChange={setOpen}>
                <DropdownMenuTrigger
                    asChild
                    onMouseEnter={() => {
                        if (delayHandler) clearTimeout(delayHandler);
                        setIsHovered(true);
                        setDelayHandler(window.setTimeout(() => {
                            setOpen(true);
                        }, 200));
                    }}
                    onMouseLeave={() => {
                        if (delayHandler) clearTimeout(delayHandler);
                        setIsHovered(false);
                        setDelayHandler(window.setTimeout(() => {
                            if (!isHovered) setOpen(false);
                        }, 200));
                    }}
                >
                    <Button variant="outline" className="h-5 w-full">USER</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-45">
                    <DropdownMenuRadioGroup>
                        <Link href="/">
                            <DropdownMenuRadioItem value="home" className="cursor-pointer">
                                HOME
                            </DropdownMenuRadioItem>
                        </Link>
                        <Link href="/user-game-bet-2">
                            <DropdownMenuRadioItem value="user-game-bet-2" className="cursor-pointer">
                                PLAYER 2 BET
                            </DropdownMenuRadioItem>
                        </Link>
                        <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                                P2P
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent className="w-45">
                                <DropdownMenuRadioGroup>
                                    <Link href="/order-p2p">
                                        <DropdownMenuRadioItem value="order-p2p" className="cursor-pointer">
                                            TRADE
                                        </DropdownMenuRadioItem>
                                    </Link>
                                    <Link href="/order-p2p-pending">
                                        <DropdownMenuRadioItem value="order-p2p-pending" className="cursor-pointer">
                                            PENDING
                                        </DropdownMenuRadioItem>
                                    </Link>
                                    <Link href="/order-p2p-closed">
                                        <DropdownMenuRadioItem value="order-p2p-closed" className="cursor-pointer">
                                            CLOSED
                                        </DropdownMenuRadioItem>
                                    </Link>
                                </DropdownMenuRadioGroup>
                            </DropdownMenuSubContent>
                        </DropdownMenuSub>
                        <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                                GAME USERS 2
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent className="w-45">
                                <DropdownMenuRadioGroup>
                                    <Link href="/user-game-create-2">
                                        <DropdownMenuRadioItem value="user-game-create-2" className="cursor-pointer">
                                            PLAYER 2 CREATE
                                        </DropdownMenuRadioItem>
                                    </Link>
                                    <Link href="/user-game-2">
                                        <DropdownMenuRadioItem value="user-game-2" className="cursor-pointer">
                                            PLAYER 2 START
                                        </DropdownMenuRadioItem>
                                    </Link>
                                    <Link href="/user-game-bet-2">
                                        <DropdownMenuRadioItem value="user-game-bet-2" className="cursor-pointer">
                                            PLAYER 2 BET
                                        </DropdownMenuRadioItem>
                                    </Link>
                                    <Link href="/user-game-closed-2">
                                        <DropdownMenuRadioItem value="user-game-closed-2" className="cursor-pointer">
                                            PLAYER 2 CLOSED
                                        </DropdownMenuRadioItem>
                                    </Link>
                                </DropdownMenuRadioGroup>
                            </DropdownMenuSubContent>
                        </DropdownMenuSub>
                        <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                                BET CLOSED
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent className="w-45">
                                <DropdownMenuRadioGroup>
                                    <Link href="/bet-closed-2-3-4">
                                        <DropdownMenuRadioItem value="bet-closed-2-3-4" className="cursor-pointer">
                                            ALL
                                        </DropdownMenuRadioItem>
                                    </Link>
                                    <Link href="/bet-closed-2">
                                        <DropdownMenuRadioItem value="bet-closed-2" className="cursor-pointer">
                                            PLAYER 2
                                        </DropdownMenuRadioItem>
                                    </Link>
                                    <Link href="/bet-closed-3">
                                        <DropdownMenuRadioItem value="bet-closed-3" className="cursor-pointer">
                                            PLAYER 3
                                        </DropdownMenuRadioItem>
                                    </Link>
                                    <Link href="/bet-closed-4">
                                        <DropdownMenuRadioItem value="bet-closed-4" className="cursor-pointer">
                                            PLAYER 4
                                        </DropdownMenuRadioItem>
                                    </Link>
                                </DropdownMenuRadioGroup>
                            </DropdownMenuSubContent>
                        </DropdownMenuSub>
                        <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                                WIN/LOSE
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent className="w-45">
                                <DropdownMenuRadioGroup>
                                    <Link href="/bet-winn-lose-closed-2">
                                        <DropdownMenuRadioItem value="bet-winn-lose-closed-2"
                                                               className="cursor-pointer">
                                            PLAYERS 2
                                        </DropdownMenuRadioItem>
                                    </Link>
                                    <Link href="/bet-winn-lose-closed-3">
                                        <DropdownMenuRadioItem value="bet-winn-lose-closed-3"
                                                               className="cursor-pointer">
                                            PLAYERS 3
                                        </DropdownMenuRadioItem>
                                    </Link>
                                    <Link href="/bet-winn-lose-closed-4">
                                        <DropdownMenuRadioItem value="bet-winn-lose-closed-4"
                                                               className="cursor-pointer">
                                            PLAYERS 4
                                        </DropdownMenuRadioItem>
                                    </Link>
                                </DropdownMenuRadioGroup>
                            </DropdownMenuSubContent>
                        </DropdownMenuSub>
                        <Link href="/transfer-points">
                            <DropdownMenuRadioItem value="transfer-points" className="cursor-pointer">
                                TRANSFER POINTS
                            </DropdownMenuRadioItem>
                        </Link>
                        <Link href="/turnir">
                            <DropdownMenuRadioItem value="turnir" className="cursor-pointer">
                                ТУРНИРЫ
                            </DropdownMenuRadioItem>
                        </Link>
                        <Link href="/statistics">
                            <DropdownMenuRadioItem value="statistics" className="cursor-pointer">
                                STATISTICS
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
                        <Link href="/contacts">
                            <DropdownMenuRadioItem value="bet-closed" className="cursor-pointer">
                                CONTACTS
                            </DropdownMenuRadioItem>
                        </Link>
                        <DropdownMenuRadioItem value="create-bet"><ModeToggle/></DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
};
