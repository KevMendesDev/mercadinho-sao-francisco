import Image from "next/image";

export function Brand({
  compact = false,
  inverse = false,
}: {
  compact?: boolean;
  inverse?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <Image
        src="/logo-mark.svg"
        alt=""
        width={compact ? 38 : 48}
        height={compact ? 38 : 48}
        priority
      />
      <div
        className={`font-black leading-[1.02] ${compact ? "text-lg" : "text-2xl"} ${inverse ? "text-white" : "text-zinc-950"}`}
      >
        <div>Mercadinho</div>
        <div className="text-[#ffcc00]">São Francisco</div>
      </div>
    </div>
  );
}
