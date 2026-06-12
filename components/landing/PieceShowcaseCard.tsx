import Image from "next/image";
import { cn } from "@/lib/utils";
import { landingAssets } from "./assets";

type StatusTone = "mastered" | "learning" | "new";

const statusStyles: Record<StatusTone, string> = {
  mastered: "text-[#be99ff]",
  learning: "text-[#d78f31]",
  new: "text-[#99ffb9]",
};

export function PieceShowcaseCard({
  title,
  composer,
  statusLabel,
  statusTone,
  genreLabel,
  texture = "a",
  className,
}: {
  title: string;
  composer: string;
  statusLabel: string;
  statusTone: StatusTone;
  genreLabel: string;
  texture?: "a" | "b";
  className?: string;
}) {
  const src = texture === "b" ? landingAssets.cardTextureB : landingAssets.cardTextureA;

  return (
    <article
      className={cn(
        "flex min-h-[205px] flex-col overflow-hidden rounded-lg border border-[#333] bg-[#1a1a1a] isolate",
        className
      )}
    >
      <div className="relative z-[2] flex h-[121px] flex-col justify-between overflow-hidden p-6">
        <Image
          src={src}
          alt=""
          fill
          className="z-0 object-cover opacity-50"
          sizes="(max-width: 768px) 100vw, 360px"
        />
        <div className="relative z-10 flex items-start justify-between gap-2">
          <span className="border border-[#333] bg-[#111] px-2 py-1 text-xs font-medium leading-none text-white">
            <span className={statusStyles[statusTone]}>{statusLabel}</span>
          </span>
          <span className="shrink-0 border border-[#d8d8d8] bg-white/80 px-2 py-1 text-xs leading-none text-black">
            {genreLabel}
          </span>
        </div>
      </div>
      <div className="relative z-[1] flex flex-col gap-1 border-t border-[#333] p-4">
        <h3 className="text-lg font-medium leading-7 text-white">{title}</h3>
        <p className="text-sm leading-5 text-[#a3a3a3]">{composer}</p>
      </div>
    </article>
  );
}
