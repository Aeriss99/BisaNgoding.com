import { Link } from 'react-router-dom';

interface LogoIconProps {
  size?: number;
}

export function LogoIcon({ size = 40 }: LogoIconProps) {
  return (
    <Link to="/" aria-label="BisaNgoding - Beranda" title="BisaNgoding" className="inline-block shrink-0">
      <div 
        className="bg-[var(--color-primary)] border-[3px] border-black flex items-center justify-center font-mono font-bold text-black shadow-[3px_3px_0_#111]"
        style={{ width: size, height: size }}
      >
        <span style={{ fontSize: '16px' }}>&lt;/&gt;</span>
      </div>
    </Link>
  );
}
