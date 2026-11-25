import { call } from './api';

// Upload a photo or document to Fair Central's private storage, the same way
// the website does: ask for an upload address, then send the file straight there.
export async function uploadPrivate(
  file: { uri: string; name: string; type: string },
  { kind = 'weigh-in', scope = 'me', organizationId }: { kind?: string; scope?: 'me' | 'submission'; organizationId?: string } = {},
) {
  const blob = await (await fetch(file.uri)).blob();
  const plan = await call<{ use_base44?: boolean; upload_url?: string; content_type?: string; file_uri?: string }>('files', {
    action: 'presignUpload', visibility: 'private', kind, scope, organization_id: organizationId, name: file.name, type: file.type, size: blob.size,
  });
  if (plan.use_base44 || !plan.upload_url) {
    throw new Error('Uploads from the app need Fair Central file storage. Please do this one on the website.');
  }
  const put = await fetch(plan.upload_url, { method: 'PUT', body: blob, headers: { 'Content-Type': plan.content_type || file.type } });
  if (!put.ok) throw new Error(`Upload failed (${put.status}). Try again.`);
  return plan.file_uri as string;
}

export type UploadedFile = { file_uri: string; name: string; size: number; type: string };
