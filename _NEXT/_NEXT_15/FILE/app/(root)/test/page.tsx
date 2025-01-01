import {prisma} from "@/prisma/prisma-client";
import {Container, LeftBlockLinkCategory} from "@/shared/components";
import {Suspense} from "react";
import Image from "next/image";
import {DeleteButton} from "@/components/deleteButton";
import Link from "next/link";

export default async function TestPage() {

    const post = await prisma.post.findMany();

    return (

        <div>TEST PAGE</div>


    );
}