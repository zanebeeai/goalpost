import { ImageResponse } from "next/og";
import { IconArt } from "@/components/icon-art";

export const contentType = "image/png";

const SIZES = [32, 192, 512];

export function generateImageMetadata() {
  return SIZES.map((size) => ({
    id: String(size),
    size: { width: size, height: size },
    contentType,
  }));
}

export default async function Icon({ id }: { id: Promise<string | number> }) {
  const size = Number(await id) || 32;
  // The 32px favicon keeps rounded corners; larger icons are full-bleed so
  // launchers can apply their own mask.
  return new ImageResponse(<IconArt size={size} rounded={size <= 32} />, {
    width: size,
    height: size,
  });
}
