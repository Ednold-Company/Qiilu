const MAX_DOCUMENT_BYTES = 5_000_000;
const COMPRESSED_MAX_EDGE = 1600;
const COMPRESSED_QUALITY = 0.82;

function readFileAsDataUrl(file: File) {
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

function loadImage(dataUrl: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not prepare the selected image"));
    image.src = dataUrl;
  });
}

async function compressImageDocument(file: File) {
  const originalDataUrl = await readFileAsDataUrl(file);

  if (file.type === "image/gif" || file.type === "image/svg+xml") {
    return originalDataUrl;
  }

  const image = await loadImage(originalDataUrl);
  const scale = Math.min(1, COMPRESSED_MAX_EDGE / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    return originalDataUrl;
  }

  context.drawImage(image, 0, 0, width, height);
  const compressedDataUrl = canvas.toDataURL("image/jpeg", COMPRESSED_QUALITY);

  return compressedDataUrl.length < originalDataUrl.length ? compressedDataUrl : originalDataUrl;
}

export async function readDocumentFileAsDataUrl(file: File) {
  const isSupportedDocument = file.type.startsWith("image/") || file.type === "application/pdf";

  if (!isSupportedDocument) {
    throw new Error("Select an image or PDF document");
  }

  if (file.size > MAX_DOCUMENT_BYTES) {
    throw new Error("Choose a document smaller than 5MB");
  }

  if (file.type.startsWith("image/")) {
    return compressImageDocument(file);
  }

  return readFileAsDataUrl(file);
}
