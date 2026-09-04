import { describe, expect, it } from "vitest";
import {
  classifyCameraFailure,
  normalizeBarcode,
  PREFERRED_CAMERA_CONSTRAINTS,
  RETAIL_BARCODE_FORMATS,
  RETAIL_DECODE_HINTS,
} from "./barcode-scanner";

describe("barcode scanner configuration", () => {
  it("supports retail EAN and UPC formats with tolerant decoding", () => {
    expect(RETAIL_BARCODE_FORMATS).toEqual([
      "EAN_13",
      "EAN_8",
      "UPC_A",
      "UPC_E",
      "CODE_128",
      "ITF",
    ]);
    expect(RETAIL_DECODE_HINTS.tryHarder).toBe(true);
    expect(PREFERRED_CAMERA_CONSTRAINTS).toMatchObject({
      facingMode: { ideal: "environment" },
      width: { ideal: 1920 },
      height: { ideal: 1080 },
    });
  });

  it("normalizes EAN and UPC values to digits", () => {
    expect(normalizeBarcode("7897042013180")).toBe("7897042013180");
    expect(normalizeBarcode("UPC-A: 0-12345-67890-5")).toBe("012345678905");
  });

  it("classifies denied camera permission separately", () => {
    expect(
      classifyCameraFailure(new DOMException("Denied", "NotAllowedError")),
    ).toBe("permission");
    expect(classifyCameraFailure(new Error("No camera"))).toBe("unavailable");
  });
});
