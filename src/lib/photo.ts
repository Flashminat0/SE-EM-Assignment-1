import { Directory, File, Paths } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

export async function shrink(uri: string, width: number) {
  const img = await ImageManipulator.manipulate(uri).resize({ width }).renderAsync();
  const out = await img.saveAsync({ compress: 0.6, format: SaveFormat.JPEG });
  try {
    new File(uri).delete();
  } catch {}
  return out.uri;
}

let pending: { uri: string; for: string } | null = null;
export const setPendingPhoto = (uri: string, target: string) => {
  pending = { uri, for: target };
};
export function takePendingPhoto(target: string) {
  if (!pending || pending.for !== target) return null;
  const uri = pending.uri;
  pending = null;
  return uri;
}

const DIR = 'photos';
const folder = () => new Directory(Paths.document, DIR);

export function keepPhoto(cacheUri: string, rowId: string): string {
  const dir = folder();
  if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
  const name = `${rowId}-${Date.now()}.jpg`;
  new File(cacheUri).copySync(new File(dir, name));
  return `${DIR}/${name}`;
}

export const localPhotoUri = (stored: string) =>
  stored.includes('://') ? stored : new File(Paths.document, stored).uri;

export function deletePhoto(stored: string | null | undefined) {
  if (!stored || stored.includes('://')) return; // only files this app owns
  try {
    const f = new File(Paths.document, stored);
    if (f.exists) f.delete();
  } catch {}
}

export function deleteAllPhotos() {
  try {
    const dir = folder();
    if (dir.exists) dir.delete();
  } catch {}
}
