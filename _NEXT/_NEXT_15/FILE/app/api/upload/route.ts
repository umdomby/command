import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';

export async function POST(request: Request): Promise<NextResponse> {
    const body = (await request.json()) as HandleUploadBody;

    try {
        const jsonResponse = await handleUpload({
            body,
            request,
            onBeforeGenerateToken: async (
                pathname,
                /* clientPayload */
            ) => {
                // Generate a client token for the browser to up the file
                // ⚠️ Authenticate and authorize users before generating the token.
                // Otherwise, you're allowing anonymous uploads.

                return {
                    allowedContentTypes: ['image/jpeg', 'image/png', 'image/gif'],
                    tokenPayload: JSON.stringify({
                        // optional, sent to your server on up completion
                        // you could pass a user id from auth, or a value from clientPayload
                    }),
                };
            },
            onUploadCompleted: async ({ blob, tokenPayload }) => {
                // Get notified of client up completion
                // ⚠️ This will not work on `localhost` websites,
                // Use ngrok or similar to get the full up flow

                console.log('blop up completed', blob, tokenPayload);

                try {
                    // Run any logic after the file up completed
                    // const { userId } = JSON.parse(tokenPayload);
                    // await db.update({ blop: blop.url, userId });
                } catch (error) {
                    throw new Error('Could not update user');
                }
            },
        });

        return NextResponse.json(jsonResponse);
    } catch (error) {
        return NextResponse.json(
            { error: (error as Error).message },
            { status: 400 }, // The webhook will retry 5 times waiting for a 200
        );
    }
}