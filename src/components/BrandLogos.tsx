/**
 * Brand wordmark components — simple, reliable text-based logos that
 * match the visual identity shown in the reference screenshot.
 *
 * We use plain HTML <span> elements with brand-specific colours and
 * typography (no SVG <text>), so the full brand name always renders
 * regardless of font availability on the visitor's system.
 */
import React from 'react';

type Props = { className?: string };

/* ---------- Midea ---------- */
export function MideaLogo({ className }: Props) {
  return (
    <span
      className={['inline-flex items-center gap-1.5 font-bold text-[22px] leading-none tracking-tight', className].filter(Boolean).join(' ')}
      aria-label="Midea"
    >
      <span aria-hidden="true" className="inline-block w-5 h-5 rounded-full border-[2.5px] border-[#1F6FB5] relative">
        <span className="absolute left-0.5 top-1.5 w-3 h-[2px] bg-[#1F6FB5] rounded-full" />
      </span>
      <span style={{ color: '#1F4E8C', fontFamily: 'Arial, Helvetica, sans-serif' }}>Midea</span>
    </span>
  );
}

/* ---------- Daikin ---------- */
export function DaikinLogo({ className }: Props) {
  return (
    <span
      className={['inline-flex items-center gap-1.5 font-extrabold text-[22px] leading-none tracking-wider', className].filter(Boolean).join(' ')}
      aria-label="Daikin"
    >
      <svg aria-hidden="true" width="22" height="20" viewBox="0 0 22 20" className="flex-shrink-0">
        <path d="M2 18 L14 2 L14 9 L7 9 L7 18 Z" fill="#0066B3" />
      </svg>
      <span style={{ color: '#0B3D70', fontFamily: 'Arial, Helvetica, sans-serif' }}>DAIKIN</span>
    </span>
  );
}

/* ---------- Panasonic ---------- */
export function PanasonicLogo({ className }: Props) {
  return (
    <span
      className={['inline-block font-semibold text-[24px] leading-none tracking-tight', className].filter(Boolean).join(' ')}
      aria-label="Panasonic"
      style={{ color: '#0F2A5C', fontFamily: 'Arial, Helvetica, sans-serif' }}
    >
      Panasonic
    </span>
  );
}

/* ---------- AUX ---------- */
export function AuxLogo({ className }: Props) {
  return (
    <span
      className={['inline-block font-black text-[30px] leading-none tracking-tight', className].filter(Boolean).join(' ')}
      aria-label="AUX"
      style={{ color: '#E60012', fontFamily: "'Arial Black', Arial, sans-serif" }}
    >
      AUX
    </span>
  );
}

/* ---------- Acson ---------- */
export function AcsonLogo({ className }: Props) {
  return (
    <span
      className={['inline-block', className].filter(Boolean).join(' ')}
      aria-label="Acson"
    >
      <span
        className="block font-bold text-[22px] leading-none tracking-tight"
        style={{ color: '#1F6FB5', fontFamily: 'Arial, Helvetica, sans-serif' }}
      >
        Acson
      </span>
      <span className="block h-[2px] w-full bg-[#1F6FB5] mt-1" aria-hidden="true" />
    </span>
  );
}

/* ---------- Haier ---------- */
export function HaierLogo({ className }: Props) {
  return (
    <span
      className={['inline-block font-bold text-[26px] leading-none tracking-tight', className].filter(Boolean).join(' ')}
      aria-label="Haier"
      style={{ color: '#114987', fontFamily: "'Trebuchet MS', Arial, sans-serif" }}
    >
      Haier
    </span>
  );
}

/* ---------- Hisense ---------- */
export function HisenseLogo({ className }: Props) {
  return (
    <span
      className={['inline-block font-extrabold text-[24px] leading-none tracking-tight', className].filter(Boolean).join(' ')}
      aria-label="Hisense"
      style={{ color: '#00A99D', fontFamily: 'Arial, Helvetica, sans-serif' }}
    >
      Hisense
    </span>
  );
}

/* ---------- Topaire ---------- */
export function TopaireLogo({ className }: Props) {
  return (
    <span
      className={['inline-block font-extrabold italic text-[24px] leading-none tracking-wide', className].filter(Boolean).join(' ')}
      aria-label="Topaire"
      style={{ color: '#1F4E8C', fontFamily: 'Arial, Helvetica, sans-serif' }}
    >
      Topaire
    </span>
  );
}

const LOGO_MAP: Record<string, React.FC<Props>> = {
  midea: MideaLogo,
  daikin: DaikinLogo,
  panasonic: PanasonicLogo,
  aux: AuxLogo,
  acson: AcsonLogo,
  haier: HaierLogo,
  hisense: HisenseLogo,
  topaire: TopaireLogo,
};

/**
 * Renders the brand's logo by slug. Returns null if the brand has no
 * preset logo — callers should fall back to text in that case.
 */
export default function BrandLogo({ slug, className }: { slug: string; className?: string }) {
  const Logo = LOGO_MAP[slug];
  if (!Logo) return null;
  return <Logo className={className} />;
}
