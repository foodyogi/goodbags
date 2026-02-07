import { useEffect, useState } from "react";
import logoWhiteText from "@assets/goodbags_logo_white_text_tech_green_1769293157780.png";
import logoBlackText from "@assets/goodbags_logo_black_text_tech_green_1769293157787.png";
import logoAnimationDark from "@assets/_users_43b9dd13-52db-4959-8c33-ead316b70fe2_generated_c4d5284d_1770466867856.mp4";

interface ThemedLogoProps {
  className?: string;
  alt?: string;
  animated?: boolean;
}

export function ThemedLogo({ className = "", alt = "GoodBags Logo", animated = false }: ThemedLogoProps) {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };
    
    checkTheme();
    
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === "class") {
          checkTheme();
        }
      });
    });
    
    observer.observe(document.documentElement, { attributes: true });
    
    return () => observer.disconnect();
  }, []);

  if (animated && isDark) {
    return (
      <video
        src={logoAnimationDark}
        autoPlay
        loop
        muted
        playsInline
        className={className}
        aria-label={alt}
        data-testid="logo-animation-dark"
      />
    );
  }

  return (
    <img 
      src={isDark ? logoWhiteText : logoBlackText}
      alt={alt}
      className={className}
      data-testid="logo-static"
    />
  );
}
