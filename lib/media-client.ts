export interface UploadedMedia {
  url: string;
  fileName: string;
}

/** Uploads an image through /api/media. Throws an Error with a user-readable message. */
export async function uploadMedia(file: File): Promise<UploadedMedia> {
  const formData = new FormData();
  formData.append("file", file);

  let res: Response;
  try {
    res = await fetch("/api/media", { method: "POST", body: formData });
  } catch {
    throw new Error("Upload failed — check your connection and try again.");
  }

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error || "Upload failed.");
  }

  return res.json();
}
