export const RETAIL_BARCODE_FORMATS = [
  "EAN_13",
  "EAN_8",
  "UPC_A",
  "UPC_E",
  "CODE_128",
  "ITF",
] as const;

export const RETAIL_DECODE_HINTS = { tryHarder: true } as const;

export const PREFERRED_CAMERA_CONSTRAINTS: MediaTrackConstraints = {
  facingMode: { ideal: "environment" },
  width: { ideal: 1920 },
  height: { ideal: 1080 },
};

export function normalizeBarcode(value: string) {
  return value.replace(/\D/g, "");
}

export type CameraFailure = "permission" | "unavailable";

export function classifyCameraFailure(error: unknown): CameraFailure {
  if (
    error instanceof DOMException &&
    ["NotAllowedError", "SecurityError"].includes(error.name)
  ) {
    return "permission";
  }

  return "unavailable";
}
