import React from 'react';

export default function SwellLogo(props: React.SVGProps<SVGSVGElement> & { ariaLabel?: string }) {
  const { ariaLabel = 'SwellData', className, ...rest } = props;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 88 88"
      role="img"
      aria-label={ariaLabel}
      className={className}
      {...rest}
    >
      <circle cx="44" cy="44" r="44" fill="#0F6E56" />
      <path d="M8,42 C18,24 29,24 41,37 C53,50 64,50 74,32" fill="none" stroke="#FFFFFF" strokeWidth={4} strokeLinecap="round" />
      <circle cx="62" cy="58" r="7" fill="none" stroke="#FFFFFF" strokeWidth={3} />
      <line x1="67" y1="63" x2="73" y2="69" stroke="#FFFFFF" strokeWidth={3} strokeLinecap="round" />
    </svg>
  );
}
