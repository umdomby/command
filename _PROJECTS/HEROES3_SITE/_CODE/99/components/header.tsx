'use client';

import {cn} from '@/components/lib/utils';
import React from 'react';
import {Container} from './container';
import Image from 'next/image';
import Link from 'next/link';
import {ProfileButton} from './profile-button';
import {AuthModal} from './modals';
import {ModeToggle} from "@/components/buttonTheme";
import {Button} from "@/components/ui";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"


interface Props {
    className?: string;
}

export const Header: React.FC<Props> = ({className}) => {
    const [openAuthModal, setOpenAuthModal] = React.useState(false);

    return (
        <header className={cn('border-b', className)}>
            <Container className="flex items-center justify-between py-3">
                {/* Левая часть */}
                <Link href="/">
                    <div className="flex items-center gap-4">
                        <Image
                            src="/logo.png"
                            alt="Logo"
                            width={65}
                            height={65}
                            priority
                        />
                        <div>
                            <h1 className="text-2xl uppercase font-black">
                                HEROES<span className="text-red-500">3</span>
                            </h1>
                            <p className="text-sm text-gray-400 leading-3">SITE</p>
                        </div>
                    </div>
                </Link>


                {/* Правая часть */}
                <div className="flex items-center gap-3">
                    <div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild className="width-[20%]">
                                <Button variant="outline" className="h-5">SYSTEM</Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56">
                                {/*<DropdownMenuLabel>Panel</DropdownMenuLabel>*/}
                                {/*<DropdownMenuSeparator/>*/}
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
                                    <Link href="/rating">
                                        <DropdownMenuRadioItem value="rating">
                                            RATING
                                        </DropdownMenuRadioItem>
                                    </Link>
                                    <Link href="/bet-closed">
                                        <DropdownMenuRadioItem value="bet-closed">
                                            BET CLOSED
                                        </DropdownMenuRadioItem> </Link>
                                    <DropdownMenuRadioItem value="create-bet"><ModeToggle/></DropdownMenuRadioItem>
                                </DropdownMenuRadioGroup>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                    <div>
                        <AuthModal open={openAuthModal} onClose={() => setOpenAuthModal(false)}/>
                        <ProfileButton onClickSignIn={() => setOpenAuthModal(true)}/>
                    </div>
                </div>
            </Container>
        </header>
    )
        ;
};
