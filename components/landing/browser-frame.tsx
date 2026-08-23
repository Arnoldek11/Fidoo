import Image from "next/image";

export function BrowserFrame({
  src,
  alt,
  width,
  height,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
}) {
  return (
    <div className="overflow-hidden rounded-[28px] border border-[#F0E4D3] bg-white shadow-[0_30px_60px_-15px_rgba(74,64,56,0.18)]">
      <Image src={src} alt={alt} width={width} height={height} className="w-full" />
    </div>
  );
}
