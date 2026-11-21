import Image from "next/image";
import { DASH_ASSETS, type DashAsset } from "@/constants/dashboard";

interface DashImgProps {
  name: DashAsset;
  className?: string;
}

/** Decorative SVG from `/public/dashboard`, sized purely by its classes. */
export function DashImg({ name, className }: DashImgProps) {
  const [width, height] = DASH_ASSETS[name];
  return <Image src={`/dashboard/${name}.svg`} alt="" width={width} height={height} unoptimized className={className} />;
}
