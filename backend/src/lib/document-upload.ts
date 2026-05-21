const uploadedDocumentPattern =
  /^data:(image\/[a-z0-9.+-]+|application\/pdf);base64,[a-z0-9+/=]+$/i;

export function normalizeDocumentReference(value: string) {
  return value.trim();
}

export function isValidDocumentReference(value: string) {
  const normalized = normalizeDocumentReference(value);
  return uploadedDocumentPattern.test(normalized) || /^https?:\/\//i.test(normalized);
}

export function isUploadedDocumentTooLarge(value: string, maxLength = 7_000_000) {
  return normalizeDocumentReference(value).length > maxLength;
}
