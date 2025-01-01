import { del } from '@vercel/blob';
import {NextApiRequest} from "next";
import {NextResponse} from "next/server";

// export async function DELETE(request: Request) {
//     console.log("11111111111111 ");
//     const { searchParams } = new URL(request.url);
//     console.log("22222222222222 " + searchParams);
//     const urlToDelete = searchParams.get('url') as string;
//     await del(urlToDelete);
//
//     return new Response();
// }

// https://youtu.be/kQfwNwpDiPQ 35:20
export const dynamic = 'force-dynamic';
export async function DELETE(request: Request, context : any) {
    const {params} = context;
    let { url } = params;

    url = decodeURIComponent(url);

    if (!url) {
        return NextResponse.json({ error: "URL doesn't exist" }, {status : 400});
    }

    await del(url);
    return NextResponse.json({success: true});
}