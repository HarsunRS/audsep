import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createServerClient } from '../../../../lib/supabase';

/**
 * POST /api/upload-url
 * Body: { filename, contentType }
 * Returns: { signedUrl, storagePath, token }
 *
 * Generates a signed upload URL using the service role key so the browser
 * can upload directly to Supabase Storage without needing its own auth.
 */
export async function POST(request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { filename, contentType } = await request.json();
    if (!filename) return NextResponse.json({ error: 'filename required' }, { status: 400 });

    const safeFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `uploads/${Date.now()}_${safeFilename}`;

    const db = createServerClient();
    const { data, error } = await db.storage
      .from('inputs')
      .createSignedUploadUrl(storagePath);

    if (error) throw new Error(`Could not create signed URL: ${error.message}`);

    return NextResponse.json({
      signedUrl: data.signedUrl,
      storagePath,
      token: data.token,
    });
  } catch (error) {
    console.error('[API /upload-url]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
