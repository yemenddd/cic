import { put, del } from '@vercel/blob';

export async function uploadImage(file: File, folder: string): Promise<string> {
  const blob = await put(`${folder}/${crypto.randomUUID()}-${file.name}`, file, {
    access: 'public',
    addRandomSuffix: false,
  });
  return blob.url;
}

export async function deleteImage(url: string): Promise<void> {
  try {
    await del(url);
  } catch (err) {
    // Non-fatal — the DB record is what matters; an orphaned blob can be
    // cleaned up later and shouldn't block the admin action.
    console.error('Failed to delete blob:', err);
  }
}
