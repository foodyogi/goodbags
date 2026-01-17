import fyiLogoUrl from "@assets/FYI_Vertical_1768678811928.png";

interface FyiCoinProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "w-5 h-5",
  md: "w-12 h-12",
  lg: "w-16 h-16",
};

const logoSizes = {
  sm: "w-3 h-3",
  md: "w-7 h-7",
  lg: "w-10 h-10",
};

export function FyiCoin({ size = "md", className = "" }: FyiCoinProps) {
  return (
    <div 
      className={`${sizeClasses[size]} ${className} rounded-full bg-gradient-to-br from-yellow-400 via-yellow-500 to-amber-600 p-[2px] shadow-lg`}
      data-testid="icon-fyi-coin"
    >
      <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
        <img 
          src={fyiLogoUrl} 
          alt="FYI" 
          className={`${logoSizes[size]} object-contain object-top`}
          style={{ objectPosition: 'center 25%' }}
        />
      </div>
    </div>
  );
}
