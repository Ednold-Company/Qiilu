export async function readImageFileAsDataUrl(file: File) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Select a valid image file");
  }

  if (file.size > 1_500_000) {
    throw new Error("Choose an image smaller than 1.5MB");
  }

  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("Could not read the selected image"));
    };
    reader.onerror = () => reject(new Error("Could not read the selected image"));
    reader.readAsDataURL(file);
  });
}
