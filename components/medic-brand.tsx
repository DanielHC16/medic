import Image from "next/image";
import Link from "next/link";

type MedicBrandProps = {
  caption?: string;
  compact?: boolean;
  href?: string;
};

export function MedicBrand({
  caption = "Medication, routines, and connected care.",
  compact = false,
  href = "/",
}: MedicBrandProps) {
  const size = compact ? 56 : 84;

  return (
    <Link href={href} className="inline-flex items-center gap-4">
      <div className="rounded-[1.75rem] bg-white/80 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.65),0_12px_32px_rgba(47,62,52,0.12)]">
        <Image
          src="/medic-logo.png"
          alt="MEDIC logo"
          width={size}
          height={size}
          priority
          className="h-auto w-auto object-contain"
        />
      </div>
      <div className="min-w-0">
        <p className="font-label text-xs font-semibold uppercase tracking-[0.38em] text-[var(--color-primary)]">
          MEDIC
        </p>
        <p className="mt-1 max-w-xs text-sm leading-6 text-[var(--color-muted-foreground)]">
          {caption}
        </p>
      </div>
    </Link>
  );
}
