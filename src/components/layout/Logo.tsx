
import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface LogoProps {
  className?: string;
  showText?: boolean;
}

const Logo: React.FC<LogoProps> = ({ className, showText = true }) => {
  const { user } = useAuth();
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [siteInfo, setSiteInfo] = useState({
    siteName: "iTakecare"
  });
  const [isLoading, setIsLoading] = useState(true);
  const [logoError, setLogoError] = useState(false);
  
  // Fetch logo and site info on component mount
  useEffect(() => {
    const fetchSiteSettings = async () => {
      try {
        setIsLoading(true);
        
        const { data, error } = await supabase
          .from('site_settings')
          .select('*')
          .limit(1)
          .single();
        
        if (error) {
          console.error("Error fetching site settings:", error);
          setLogoError(true);
          return;
        }
        
        if (data) {
          console.log("Site settings loaded for logo:", data);
          
          // Fix the logo URL by ensuring it has proper formatting
          let cleanLogoUrl = null;
          if (data.logo_url) {
            // Fix common URL formatting issues
            cleanLogoUrl = data.logo_url
              // Fix protocol-relative URLs
              .replace(/^\/\//, 'https://')
              // Fix missing protocol
              .replace(/^(?!https?:\/\/)/, 'https://')
              // Fix double slashes in path
              .replace(/([^:]\/)\/+/g, '$1');
              
            // Add cache-busting parameter
            const separator = cleanLogoUrl.includes('?') ? '&' : '?';
            cleanLogoUrl = `${cleanLogoUrl}${separator}t=${Date.now()}`;
          }
          
          setLogoUrl(cleanLogoUrl);
          setSiteInfo({
            siteName: data.site_name || "iTakecare"
          });
        }
      } catch (error) {
        console.error("Error in Logo component:", error);
        setLogoError(true);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSiteSettings();
  }, []);
  
  // Generate user initials or use IT by default
  const getUserInitials = () => {
    if (!user) return "IT";
    
    if (user.first_name && user.last_name) {
      return `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase();
    } else if (user.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return "IT";
  };

  const handleLogoError = () => {
    console.error("Error loading logo image:", logoUrl);
    setLogoError(true);
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="relative flex-shrink-0">
        <div className="absolute inset-0 bg-primary/20 rounded-xl rotate-6"></div>
        <div className="absolute inset-0 bg-primary/10 rounded-xl -rotate-6"></div>
        
        {/* Logo container with image or initials */}
        <div className="relative flex items-center justify-center w-10 h-10 bg-background rounded-xl shadow-md overflow-hidden">
          {logoUrl && !logoError ? (
            <img 
              src={logoUrl} 
              alt={siteInfo.siteName}
              className="w-10 h-10 object-contain"
              onError={handleLogoError}
            />
          ) : isLoading ? (
            <div className="animate-pulse bg-gray-200 w-6 h-6 rounded-md"></div>
          ) : (
            <img 
              src="/site-favicon.ico" 
              alt="iTakecare Logo"
              className="w-7 h-7 object-contain"
              onError={() => {
                // If default logo fails, display initials
                setLogoError(true);
              }}
            />
          )}
          {logoError && (
            <span className="font-bold text-primary text-lg">
              {getUserInitials()}
            </span>
          )}
        </div>
      </div>
      
      {showText && (
        <div className="overflow-hidden">
          <h1 className="text-lg font-bold">{siteInfo.siteName}</h1>
        </div>
      )}
    </div>
  );
};

export default Logo;
