import { cn } from "@/lib/utils";

function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase();
  }
  return name.trim().slice(0, 2).toUpperCase() || "?";
}

export function ProfileAvatar({
  name,
  username,
  avatarUrl,
  size = "lg",
  className,
}: {
  name: string;
  username: string;
  avatarUrl: string | null;
  size?: "md" | "lg" | "xl";
  className?: string;
}) {
  const sizeClass =
    size === "xl"
      ? "h-28 w-28 text-2xl ring-4"
      : size === "md"
        ? "h-14 w-14 text-sm ring-2"
        : "h-20 w-20 text-lg ring-3";

  const label = name.trim() || username;

  if (avatarUrl) {
    return (
      <div
        className={cn(
          "relative shrink-0 overflow-hidden rounded-full ring-sheet-accent/30 shadow-lg",
          sizeClass,
          className
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={avatarUrl}
          alt={`${label}'s profile photo`}
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  const hue = [...username].reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-display font-normal text-white shadow-lg",
        sizeClass,
        className
      )}
      style={{
        background: `linear-gradient(135deg, hsl(${hue} 55% 42%), hsl(${(hue + 40) % 360} 60% 55%))`,
      }}
      aria-hidden
    >
      {initialsFrom(label)}
    </div>
  );
}
