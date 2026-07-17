import { describe, expect, it } from "vitest";
import { validateUpload } from "@/lib/file-validation";

describe("upload validation", () => {
  it("accepts a PNG with the correct signature", async () => {
    const file = new File(
      [new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1])],
      "image.png",
      { type: "image/png" },
    );
    await expect(validateUpload(file)).resolves.toMatchObject({
      kind: "image",
      mimeType: "image/png",
    });
  });
  it("rejects a spoofed executable", async () => {
    const file = new File(["MZ not a PDF"], "unsafe.pdf", {
      type: "application/pdf",
    });
    await expect(validateUpload(file)).rejects.toThrow("contents do not match");
  });
  it("rejects HTML disguised as text", async () => {
    const file = new File(
      ["<html><script>alert(1)</script></html>"],
      "unsafe.txt",
      { type: "text/plain" },
    );
    await expect(validateUpload(file)).rejects.toThrow("HTML documents");
  });
});
