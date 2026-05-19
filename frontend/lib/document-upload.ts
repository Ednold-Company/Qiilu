export async function readDocumentFileAsDataUrl(file: File) {
  const isSupportedDocument = file.type.startsWith("image/") || file.type === "application/pdf";

  if (!isSupportedDocument) {
    throw new Error("Select an image or PDF document");
  }

  if (file.size > 5_000_000) {
    throw new Error("Choose a document smaller than 5MB");
  }

  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("Could not read the selected document"));
    };
    reader.onerror = () => reject(new Error("Could not read the selected document"));
    reader.readAsDataURL(file);
  });
}
