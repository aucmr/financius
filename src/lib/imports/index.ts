export * from "@/src/lib/imports/csv";
export * from "@/src/lib/imports/formats";
export * from "@/src/lib/imports/fingerprint";
export * from "@/src/lib/imports/types";

export function decodeCsvBytes(input: ArrayBuffer | Uint8Array) {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  const hasUtf8Bom =
    bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf;
  const hasUtf16LeBom = bytes[0] === 0xff && bytes[1] === 0xfe;
  const hasUtf16BeBom = bytes[0] === 0xfe && bytes[1] === 0xff;

  if (hasUtf8Bom) {
    return {
      text: new TextDecoder("utf-8").decode(bytes),
      encoding: "utf-8" as const,
    };
  }
  if (hasUtf16LeBom) {
    return {
      text: new TextDecoder("utf-16le").decode(bytes),
      encoding: "utf-16le" as const,
    };
  }
  if (hasUtf16BeBom) {
    return {
      text: new TextDecoder("utf-16be").decode(bytes),
      encoding: "utf-16be" as const,
    };
  }

  try {
    return {
      text: new TextDecoder("utf-8", { fatal: true }).decode(bytes),
      encoding: "utf-8" as const,
    };
  } catch {
    return {
      text: new TextDecoder("windows-1252").decode(bytes),
      encoding: "windows-1252" as const,
    };
  }
}
