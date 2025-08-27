import Image from 'next/image';

interface ChristiFidelesLogoProps {
  variant?: 'full' | 'img' | 'letras';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'h-8 w-auto',
  md: 'h-12 w-auto',
  lg: 'h-16 w-auto',
  xl: 'h-24 w-auto'
};

export default function ChristiFidelesLogo({ 
  variant = 'full', 
  size = 'md',
  className = '' 
}: ChristiFidelesLogoProps) {
  let logoSrc = '/assets/logos/CF_LOGO.png';
  
  if (variant === 'img') {
    logoSrc = '/assets/logos/CF_LOGO_IMG.png';
  } else if (variant === 'letras') {
    logoSrc = '/assets/logos/CF_LOGO_LETRAS.png';
  }
  
  return (
    <Image
      src={logoSrc}
      alt="ChristiFideles"
      width={200}
      height={80}
      className={`${sizeClasses[size]} ${className}`}
      priority
    />
  );
}
