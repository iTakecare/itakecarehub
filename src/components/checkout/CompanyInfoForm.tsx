
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Building, Loader2, Search, Mail } from 'lucide-react';
import { verifyVatNumber } from '@/services/clientService';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

interface CompanyFormData {
  company: string;
  vat_number: string;
  company_verified: boolean;
  is_vat_exempt: boolean;
  country: string;
  email?: string;
  address?: string;
  city?: string;
  postal_code?: string;
}

interface CompanyInfoFormProps {
  formData: CompanyFormData;
  updateFormData: (data: Partial<CompanyFormData>) => void;
  onNext: () => void;
}

// Définir les formats de numéro d'entreprise par pays
const idFormats = {
  BE: {
    label: "Numéro d'entreprise",
    example: "0123456789",
    format: "0123456789 (sans espaces)"
  },
  FR: {
    label: "Numéro SIREN/SIRET",
    example: "12345678900012",
    format: "SIRET (14 chiffres) ou SIREN (9 chiffres)"
  },
  LU: {
    label: "Numéro d'identification",
    example: "12345678",
    format: "8 chiffres"
  }
};

const CompanyInfoForm: React.FC<CompanyInfoFormProps> = ({ formData, updateFormData, onNext }) => {
  const [verifying, setVerifying] = useState(false);
  const { toast } = useToast();
  const [country, setCountry] = useState(formData.country || 'BE');
  const [vatNumberFilled, setVatNumberFilled] = useState(Boolean(formData.vat_number.trim()));

  const handleCountryChange = (value: string) => {
    setCountry(value);
    updateFormData({ country: value });
    
    // Réinitialiser l'exemption de TVA si on change pour un pays autre que la Belgique
    if (value !== 'BE' && formData.is_vat_exempt) {
      updateFormData({ is_vat_exempt: false });
    }
  };

  // Surveiller les changements dans le champ vat_number pour mettre à jour vatNumberFilled
  const handleVatNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    updateFormData({ vat_number: value });
    setVatNumberFilled(value.trim().length > 0);
  };

  const parseAddressFromVIES = (addressString?: string) => {
    if (!addressString) return { address: '', city: '', postal_code: '' };

    console.log("Parsing address from VIES:", addressString);

    // Try to parse a typical address format from VIES 
    // Example: "Avenue Général Michel 1/E\n6000 Charleroi\nBelgium"
    const lines = addressString.split('\n');
    let address = '', city = '', postal_code = '';

    // First line is typically the street address
    if (lines.length > 0) {
      address = lines[0].trim();
    }

    // Second line typically contains postal code and city
    if (lines.length > 1) {
      const cityLine = lines[1].trim();
      const postalMatch = cityLine.match(/^(\d+)\s+(.+)/);
      
      if (postalMatch) {
        postal_code = postalMatch[1];
        city = postalMatch[2];
      } else {
        city = cityLine;
      }
    }

    console.log("Parsed address:", { address, city, postal_code });
    return { address, city, postal_code };
  };

  const handleSearchCompany = async () => {
    // Vérifier que le numéro d'entreprise est renseigné
    if (!formData.vat_number.trim()) {
      toast({
        title: "Champ obligatoire",
        description: `Veuillez entrer votre ${idFormats[country as keyof typeof idFormats].label}`,
        variant: "destructive"
      });
      return;
    }

    setVerifying(true);
    
    try {
      // Vérifier le numéro d'entreprise via VIES
      const result = await verifyVatNumber(formData.vat_number, country);
      
      if (result.valid) {
        // Extraire l'adresse de l'entreprise
        const addressData = parseAddressFromVIES(result.address);
        
        // Mettre à jour les informations de l'entreprise avec les données de VIES
        updateFormData({
          company_verified: true,
          company: result.companyName || formData.company,
          address: addressData.address,
          city: addressData.city,
          postal_code: addressData.postal_code
        });
        
        toast({
          title: "Entreprise trouvée",
          description: `Informations récupérées pour ${result.companyName}`,
          variant: "default"
        });
      } else {
        toast({
          title: "Entreprise non trouvée",
          description: result.error || `Le ${idFormats[country as keyof typeof idFormats].label} n'a pas pu être vérifié. Veuillez vérifier et réessayer.`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error verifying business ID:", error);
      toast({
        title: "Erreur de recherche",
        description: `Une erreur est survenue lors de la vérification du ${idFormats[country as keyof typeof idFormats].label}.`,
        variant: "destructive"
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleVerifyVAT = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Vérifier que le numéro d'entreprise est renseigné (obligatoire dans tous les cas)
    if (!formData.vat_number.trim()) {
      toast({
        title: "Champ obligatoire",
        description: `Veuillez entrer votre ${idFormats[country as keyof typeof idFormats].label}`,
        variant: "destructive"
      });
      return;
    }

    // Si le nom de l'entreprise n'est pas renseigné
    if (!formData.company.trim()) {
      toast({
        title: "Champ obligatoire",
        description: "Veuillez entrer le nom de votre entreprise",
        variant: "destructive"
      });
      return;
    }

    // Vérifier l'email
    if (!formData.email?.trim()) {
      toast({
        title: "Champ obligatoire",
        description: "Veuillez entrer votre email professionnel",
        variant: "destructive"
      });
      return;
    }

    // Pour les entreprises non-assujetties à la TVA (seulement pour la Belgique)
    if (country === 'BE' && formData.is_vat_exempt) {
      onNext();
      return;
    }

    // Vérifier le numéro de TVA/entreprise
    setVerifying(true);
    try {
      // Attempt to verify the VAT/business number
      console.log(`Verifying company ID: ${formData.vat_number}`);
      const result = await verifyVatNumber(formData.vat_number, country);
      
      if (result.valid) {
        // Extraire l'adresse de l'entreprise
        const addressData = parseAddressFromVIES(result.address);
        
        updateFormData({
          company_verified: true,
          company: result.companyName || formData.company,
          address: addressData.address,
          city: addressData.city,
          postal_code: addressData.postal_code
        });
        
        toast({
          title: "Vérification réussie",
          description: `Le ${idFormats[country as keyof typeof idFormats].label} a été vérifié avec succès.`,
          variant: "default"
        });
        
        // Proceed to next step
        onNext();
      } else {
        toast({
          title: "Vérification échouée",
          description: result.error || `Le ${idFormats[country as keyof typeof idFormats].label} n'a pas pu être vérifié. Veuillez vérifier et réessayer.`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error verifying business ID:", error);
      toast({
        title: "Erreur de vérification",
        description: `Une erreur est survenue lors de la vérification du ${idFormats[country as keyof typeof idFormats].label}.`,
        variant: "destructive"
      });
    } finally {
      setVerifying(false);
    }
  };

  // Déterminer si on doit afficher l'option d'exemption TVA (uniquement pour la Belgique)
  const showVatExemptOption = country === 'BE';

  return (
    <form onSubmit={handleVerifyVAT} className="space-y-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Informations de votre entreprise</h2>
        <p className="text-gray-600">Veuillez compléter les informations ci-dessous pour continuer</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="country">Pays</Label>
          <Select 
            value={country} 
            onValueChange={handleCountryChange}
          >
            <SelectTrigger id="country" className="w-full">
              <SelectValue placeholder="Sélectionnez votre pays" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BE">Belgique</SelectItem>
              <SelectItem value="FR">France</SelectItem>
              <SelectItem value="LU">Luxembourg</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="vat_number">{idFormats[country as keyof typeof idFormats].label} *</Label>
          <div className="flex space-x-2">
            <div className="relative flex-1">
              <Input
                id="vat_number"
                placeholder={idFormats[country as keyof typeof idFormats].example}
                value={formData.vat_number}
                onChange={handleVatNumberChange}
                required={true}
                className="pr-9"
              />
            </div>
            <Button
              type="button"
              size="icon"
              variant="outline"
              className={`flex-shrink-0 border-gray-300 transition-all ${vatNumberFilled ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-100 animate-pulse' : ''}`}
              onClick={handleSearchCompany}
              disabled={verifying || !formData.vat_number.trim()}
            >
              {verifying ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className={`h-4 w-4 ${vatNumberFilled ? 'text-blue-600' : ''}`} />
              )}
            </Button>
          </div>
          <p className="text-sm text-gray-500">
            Format: {idFormats[country as keyof typeof idFormats].format}
          </p>
          {vatNumberFilled && (
            <p className="text-sm text-blue-600 flex items-center mt-1">
              <Search className="h-3.5 w-3.5 mr-1" /> Cliquez sur la loupe pour vérifier le numéro
            </p>
          )}
        </div>

        {showVatExemptOption && (
          <div className="flex items-center space-x-2 pl-1">
            <Checkbox 
              id="is_vat_exempt" 
              checked={formData.is_vat_exempt}
              onCheckedChange={(checked) => {
                updateFormData({ is_vat_exempt: checked === true });
              }}
            />
            <Label htmlFor="is_vat_exempt" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Mon entreprise n'est pas assujettie à la TVA
            </Label>
          </div>
        )}
        
        <div className="space-y-2">
          <Label htmlFor="company">Nom de l'entreprise *</Label>
          <div className="relative">
            <Input
              id="company"
              placeholder="Nom de votre entreprise"
              value={formData.company}
              onChange={(e) => updateFormData({ company: e.target.value })}
              className="pl-10"
              required={true}
            />
            <Building className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
          <p className="text-sm text-gray-500">
            Sera complété automatiquement après vérification
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email professionnel *</Label>
          <div className="relative">
            <Input
              id="email"
              type="email"
              placeholder="nom@entreprise.com"
              value={formData.email || ''}
              onChange={(e) => updateFormData({ email: e.target.value })}
              className="pl-10"
              required={true}
            />
            <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button 
          type="submit" 
          disabled={verifying || !formData.vat_number.trim() || !formData.company.trim() || !formData.email?.trim()}
          className="min-w-[120px]"
        >
          {verifying ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
              Vérification...
            </>
          ) : (
            'Continuer'
          )}
        </Button>
      </div>
    </form>
  );
};

export default CompanyInfoForm;
