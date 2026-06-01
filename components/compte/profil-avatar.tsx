import { cn } from "@/lib/utils";

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface ProfilAvatarProps {
  name: string;
  image?: string | null;
  className?: string;
}

export function ProfilAvatar({ name, image, className }: ProfilAvatarProps) {
  const base = cn(
    "flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-primary font-semibold",
    className
  );

  if (image) {
    return (
      <span className={base}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image} alt={name} className="h-full w-full object-cover" />
      </span>
    );
  }

  return (
    <span className={base} aria-label={name}>
      {getInitials(name)}
    </span>
  );
}
