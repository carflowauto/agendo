import Link from "next/link";
import { Sparkles } from "lucide-react";

const sizes = {
  sm: { text: "text-xl", spark: "h-3 w-3 -right-2 -top-0.5" },
  md: { text: "text-[28px]", spark: "h-3.5 w-3.5 -right-2.5 -top-0.5" },
  lg: { text: "text-[52px]", spark: "h-5 w-5 -right-3 -top-1" },
} as const;

/** Le même mot Sheensy, partout : sans-serif, rose, avec l’étincelle. */
export function SheensyLogo({ href = "/", size = "md" }: { href?: string | null; size?: keyof typeof sizes }) {
  const look = sizes[size];
  const mark = (
    <span className={`relative inline-block font-extrabold leading-none tracking-tight text-[#E23B6E] ${look.text}`}>
      Sheensy
      <Sparkles className={`absolute ${look.spark}`} strokeWidth={2.2} />
    </span>
  );
  if (!href) return mark;
  return (
    <Link href={href} className="inline-flex shrink-0" aria-label="Sheensy">
      {mark}
    </Link>
  );
}
