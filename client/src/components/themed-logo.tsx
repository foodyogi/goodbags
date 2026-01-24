import { useEffect, useState } from "react";
import logoWhiteText from "@assets/goodbags_logo_white_text_tech_green_1769293157780.png";
import logoBlackText from "@assets/goodbags_logo_black_text_tech_green_1769293157787.png";

interface ThemedLogoProps {
  className?: string;
  alt?: string;
}

export function ThemedLogo({ className = "", alt = "GoodBags Logo" }: ThemedLogoProps) {
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

  return (
    <img 
      src={isDark ? logoWhiteText : logoBlackText}
      alt={alt}
      className={className}
    />
  );
}
