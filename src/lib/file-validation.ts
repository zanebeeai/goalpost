import {
  ALLOWED_DOCUMENT_TYPES,
  ALLOWED_IMAGE_TYPES,
  MAX_DOCUMENT_BYTES,
  MAX_IMAGE_BYTES,
} from "@/lib/constants";

type ValidatedFile = {
  kind: "image" | "document";
  mimeType: string;
  safeName: string;
};

function startsWith(bytes: Uint8Array, signature: number[]) {
  return signature.every((value, index) => bytes[index] === value);
}

function asciiContains(bytes: Uint8Array, needle: string) {
  return new TextDecoder("latin1")
    .decode(bytes)
    .toLowerCase()
    .includes(needle.toLowerCase());
}

export async function validateUpload(file: File): Promise<ValidatedFile> {
  const imageType = ALLOWED_IMAGE_TYPES.includes(
    file.type as (typeof ALLOWED_IMAGE_TYPES)[number],
  );
  const documentType = ALLOWED_DOCUMENT_TYPES.includes(
    file.type as (typeof ALLOWED_DOCUMENT_TYPES)[number],
  );
  if (!imageType && !documentType)
    throw new Error("That file type is not supported.");
  if (imageType && file.size > MAX_IMAGE_BYTES)
    throw new Error("Images must be 10 MB or smaller.");
  if (documentType && file.size > MAX_DOCUMENT_BYTES)
    throw new Error("Documents must be 25 MB or smaller.");
  if (file.size === 0) throw new Error("The selected file is empty.");

  const bytes = new Uint8Array(await readFileBuffer(file));
  const isJpeg = startsWith(bytes, [0xff, 0xd8, 0xff]);
  const isPng = startsWith(
    bytes,
    [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  );
  const isWebp =
    startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  const isPdf = startsWith(bytes, [0x25, 0x50, 0x44, 0x46, 0x2d]);
  const isZip = startsWith(bytes, [0x50, 0x4b, 0x03, 0x04]);
  const isText =
    file.type === "text/plain" && !bytes.slice(0, 8192).includes(0);

  const signatureMatches =
    (file.type === "image/jpeg" && isJpeg) ||
    (file.type === "image/png" && isPng) ||
    (file.type === "image/webp" && isWebp) ||
    (file.type === "application/pdf" && isPdf) ||
    (file.type.includes("officedocument") && isZip) ||
    isText;
  if (!signatureMatches)
    throw new Error("The file contents do not match its declared type.");
  if (isZip && asciiContains(bytes, "vbaProject.bin"))
    throw new Error("Macro-enabled documents are not allowed.");
  if (isText && asciiContains(bytes.slice(0, 8192), "<html"))
    throw new Error("HTML documents are not allowed.");

  const safeName = file.name
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .slice(-120);
  return {
    kind: imageType ? "image" : "document",
    mimeType: file.type,
    safeName: safeName || "attachment",
  };
}

async function readFileBuffer(file: File) {
  if (typeof file.arrayBuffer === "function") return file.arrayBuffer();
  return new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () =>
      reject(reader.error ?? new Error("Could not read the selected file"));
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) resolve(reader.result);
      else reject(new Error("Could not read the selected file"));
    };
    reader.readAsArrayBuffer(file);
  });
}
