
import React, { useState, useEffect } from "react";
import { ShoppingCart, ChevronDown, Menu, X, Globe, Server, Recycle, Briefcase, HelpCircle, Cpu, Monitor, Share2, Building, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { cn } from "@/lib/utils";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

const MainNavigation = () => {
  const { cartCount } = useCart();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Updated navigation menu items with icons and dropdowns
  const solutionsMenu = [
    { label: "Location d'équipement", href: "/solutions/location", icon: <Monitor className="w-4 h-4 mr-2" />, description: "Matériel informatique haute performance en location flexible" },
    { label: "Gestion de parc", href: "/solutions/gestion-parc", icon: <Server className="w-4 h-4 mr-2" />, description: "Solutions complètes pour gérer votre infrastructure informatique" },
    { label: "Services cloud", href: "/solutions/cloud", icon: <Globe className="w-4 h-4 mr-2" />, description: "Infrastructure cloud sécurisée et évolutive" },
    { label: "Reconditionnement", href: "/solutions/reconditionnement", icon: <Recycle className="w-4 h-4 mr-2" />, description: "Équipements reconditionnés et certifiés écologiques" },
  ];

  const servicesMenu = [
    { label: "Pour entreprises", href: "/services/entreprises", icon: <Building className="w-4 h-4 mr-2" />, description: "Solutions adaptées aux besoins des entreprises" },
    { label: "Pour professionnels", href: "/services/professionnels", icon: <Briefcase className="w-4 h-4 mr-2" />, description: "Offres spéciales pour indépendants et professionnels" },
    { label: "Formations", href: "/services/formations", icon: <FileText className="w-4 h-4 mr-2" />, description: "Programmes de formation pour vos équipes" },
    { label: "Support technique", href: "/services/support", icon: <HelpCircle className="w-4 h-4 mr-2" />, description: "Assistance technique dédiée et réactive" },
  ];

  const durabiliteMenu = [
    { label: "Notre engagement", href: "/durabilite/engagement", icon: <Share2 className="w-4 h-4 mr-2" />, description: "Notre mission pour un numérique responsable" },
    { label: "Économie circulaire", href: "/durabilite/economie-circulaire", icon: <Recycle className="w-4 h-4 mr-2" />, description: "Comment nous contribuons à l'économie circulaire" },
    { label: "Impact environnemental", href: "/durabilite/impact", icon: <Globe className="w-4 h-4 mr-2" />, description: "Nos actions pour réduire l'empreinte environnementale" },
  ];

  const ressourcesMenu = [
    { label: "Blog", href: "/blog", icon: <FileText className="w-4 h-4 mr-2" />, description: "Articles et actualités sur le numérique responsable" },
    { label: "Centre d'aide", href: "/aide", icon: <HelpCircle className="w-4 h-4 mr-2" />, description: "Guides et documentation détaillée" },
    { label: "Témoignages", href: "/temoignages", icon: <Share2 className="w-4 h-4 mr-2" />, description: "Retours d'expérience de nos clients" },
  ];

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <div className={cn(
      "fixed top-0 left-0 right-0 z-50 flex justify-center px-4 py-6 transition-all duration-300",
      scrolled ? "bg-white/95 backdrop-blur-sm shadow-md" : "bg-white"
    )}>
      <div className="relative w-full max-w-[1320px] mx-auto h-auto md:h-[82px] bg-[#f8f8f6] rounded-[20px] md:rounded-[50px] border-2 border-solid border-[#e1e1e1] flex flex-col md:flex-row items-center justify-between px-4 md:px-8 py-3 md:py-0 transition-all duration-300 hover:border-[#48B5C3]/30">
        <div className="flex items-center justify-between w-full md:w-auto">
          <Link to="/" className="group">
            <img
              className="w-[120px] md:w-[201px] h-auto md:h-[41px] object-contain transition-transform duration-300 group-hover:scale-105"
              alt="iTakecare Logo"
              src="/lovable-uploads/3a4ae1ec-2b87-4a07-a178-b3bc5d86594b.png"
            />
          </Link>
          
          {/* Mobile menu toggle button */}
          <button 
            onClick={toggleMobileMenu} 
            className="p-2 md:hidden"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile navigation */}
        <div className={`${mobileMenuOpen ? 'flex' : 'hidden'} md:hidden flex-col w-full mt-4 space-y-2 pb-4`}>
          {/* Solutions dropdown for mobile */}
          <div className="border-b border-gray-200 pb-2 mb-2">
            <div className="font-medium text-[#33638E] mb-2 px-4">Solutions</div>
            {solutionsMenu.map((item, index) => (
              <Link
                key={index}
                to={item.href}
                className="py-2 px-4 flex items-center text-[#222222] text-sm hover:bg-[#33638E]/10 rounded-md"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
          </div>
          
          {/* Services dropdown for mobile */}
          <div className="border-b border-gray-200 pb-2 mb-2">
            <div className="font-medium text-[#33638E] mb-2 px-4">Services</div>
            {servicesMenu.map((item, index) => (
              <Link
                key={index}
                to={item.href}
                className="py-2 px-4 flex items-center text-[#222222] text-sm hover:bg-[#33638E]/10 rounded-md"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
          </div>
          
          {/* Durabilité dropdown for mobile */}
          <div className="border-b border-gray-200 pb-2 mb-2">
            <div className="font-medium text-[#33638E] mb-2 px-4">Durabilité</div>
            {durabiliteMenu.map((item, index) => (
              <Link
                key={index}
                to={item.href}
                className="py-2 px-4 flex items-center text-[#222222] text-sm hover:bg-[#33638E]/10 rounded-md"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
          </div>
          
          <Link
            to="/catalogue"
            className={cn(
              "py-2 px-4 text-center font-medium text-[#222222] text-sm rounded-md",
              location.pathname === "/catalogue" && "bg-[#33638E]/10 text-[#33638E]"
            )}
            onClick={() => setMobileMenuOpen(false)}
          >
            Catalogue
          </Link>
          
          <Link
            to="/contact"
            className={cn(
              "py-2 px-4 text-center font-medium text-[#222222] text-sm rounded-md",
              location.pathname === "/contact" && "bg-[#33638E]/10 text-[#33638E]"
            )}
            onClick={() => setMobileMenuOpen(false)}
          >
            Contact
          </Link>
          
          <div className="flex flex-col space-y-2 pt-4">
            <Link to="/login">
              <Button
                variant="outline"
                className="w-full rounded-[20px] md:rounded-[50px] font-bold text-sm"
              >
                Se connecter
              </Button>
            </Link>
            <Link to="/catalogue">
              <Button className="w-full bg-[#48b5c3] hover:bg-[#3da6b4] rounded-[20px] md:rounded-[50px] font-bold text-sm">
                Catalogue
              </Button>
            </Link>
          </div>
        </div>

        {/* Desktop navigation */}
        <nav className="hidden md:block ml-[40px]">
          <ul className="flex space-x-[25px]">
            {/* Solutions dropdown */}
            <li className="relative group">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center font-normal text-[#222222] text-base hover:text-[#33638E] transition-colors">
                    Solutions <ChevronDown className="w-4 h-4 ml-1 transition-transform group-hover:rotate-180" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64 bg-white rounded-xl p-2 shadow-lg border border-gray-100">
                  {solutionsMenu.map((item, index) => (
                    <DropdownMenuItem key={index} asChild>
                      <Link 
                        to={item.href}
                        className="flex flex-col py-3 px-3 text-sm rounded-lg hover:bg-[#f8f8f6] cursor-pointer"
                      >
                        <div className="flex items-center">
                          {item.icon}
                          <span className="font-medium">{item.label}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 ml-6">{item.description}</p>
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </li>

            {/* Services dropdown */}
            <li className="relative group">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center font-normal text-[#222222] text-base hover:text-[#33638E] transition-colors">
                    Services <ChevronDown className="w-4 h-4 ml-1 transition-transform group-hover:rotate-180" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64 bg-white rounded-xl p-2 shadow-lg border border-gray-100">
                  {servicesMenu.map((item, index) => (
                    <DropdownMenuItem key={index} asChild>
                      <Link 
                        to={item.href}
                        className="flex flex-col py-3 px-3 text-sm rounded-lg hover:bg-[#f8f8f6] cursor-pointer"
                      >
                        <div className="flex items-center">
                          {item.icon}
                          <span className="font-medium">{item.label}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 ml-6">{item.description}</p>
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </li>
            
            {/* Durabilité dropdown */}
            <li className="relative group">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center font-normal text-[#222222] text-base hover:text-[#33638E] transition-colors">
                    Durabilité <ChevronDown className="w-4 h-4 ml-1 transition-transform group-hover:rotate-180" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64 bg-white rounded-xl p-2 shadow-lg border border-gray-100">
                  {durabiliteMenu.map((item, index) => (
                    <DropdownMenuItem key={index} asChild>
                      <Link 
                        to={item.href}
                        className="flex flex-col py-3 px-3 text-sm rounded-lg hover:bg-[#f8f8f6] cursor-pointer"
                      >
                        <div className="flex items-center">
                          {item.icon}
                          <span className="font-medium">{item.label}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 ml-6">{item.description}</p>
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </li>
            
            <li>
              <Link
                to="/catalogue"
                className={cn(
                  "font-normal text-[#222222] text-base hover:text-[#33638E] transition-colors",
                  location.pathname === "/catalogue" && "font-medium text-[#33638E]"
                )}
              >
                Catalogue
              </Link>
            </li>
            
            <li>
              <Link
                to="/contact"
                className={cn(
                  "font-normal text-[#222222] text-base hover:text-[#33638E] transition-colors",
                  location.pathname === "/contact" && "font-medium text-[#33638E]"
                )}
              >
                Contact
              </Link>
            </li>
          </ul>
        </nav>

        <div className="hidden md:flex items-center space-x-4">
          <Link to="/panier" className="relative group">
            <ShoppingCart className="w-6 h-6 text-gray-700 group-hover:text-[#33638E] transition-colors" />
            {cartCount > 0 && (
              <Badge 
                className={cn(
                  "absolute -top-1 -right-2 w-5 h-5 bg-[#33638E] rounded-[10px] flex items-center justify-center p-0",
                  cartCount > 0 ? 'animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite]' : ''
                )}
              >
                <span className="font-bold text-white text-xs">{cartCount}</span>
              </Badge>
            )}
          </Link>

          <Link to="/login">
            <Button
              variant="outline"
              className="rounded-[50px] font-bold text-sm border-gray-300 hover:border-[#33638E] hover:text-[#33638E] transition-all"
            >
              Se connecter
            </Button>
          </Link>

          <Link to="/catalogue">
            <Button className="bg-[#48b5c3] hover:bg-[#3da6b4] rounded-[50px] font-bold text-sm transition-all duration-300 hover:shadow-md">
              Catalogue
            </Button>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center ml-2 p-2 rounded-full hover:bg-gray-100 transition-colors">
              <Globe className="w-5 h-5 text-gray-700" />
              <ChevronDown className="w-3 h-3 ml-1 text-gray-700" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36 bg-white rounded-xl p-2 shadow-lg border border-gray-100">
              <DropdownMenuItem className="py-2 px-3 text-sm rounded-lg hover:bg-[#f8f8f6] cursor-pointer">
                Français
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-gray-100" />
              <DropdownMenuItem className="py-2 px-3 text-sm rounded-lg hover:bg-[#f8f8f6] cursor-pointer">
                English
              </DropdownMenuItem>
              <DropdownMenuItem className="py-2 px-3 text-sm rounded-lg hover:bg-[#f8f8f6] cursor-pointer">
                Español
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};

export default MainNavigation;
