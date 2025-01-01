import { list } from '@vercel/blob';

export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
    const { blobs } = await list();
    return Response.json(blobs);
}



// blobs: {
//     size: `number`;
//     uploadedAt: `Date`;
//     pathname: `string`;
//     url: `string`;
//     downloadUrl: `string`
// }[]
// cursor?: `string`;
// hasMore: `boolean`;
// folders?: `string[]`