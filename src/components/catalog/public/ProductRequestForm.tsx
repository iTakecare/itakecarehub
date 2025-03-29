
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Product } from "@/types/catalog";
import { createProductRequest } from "@/services/requestInfoService";
import { formatCurrency } from "@/utils/formatters";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { ImageIcon } from "lucide-react"; // Updated import to use lucide-react instead

interface ProductRequestFormProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  quantity: number;
  selectedOptions: Record<string, string>;
  duration: number;
  monthlyPrice: number;
}

const ProductRequestForm: React.FC<ProductRequestFormProps> = ({
  isOpen,
  onClose,
  product,
  quantity,
  selectedOptions,
  duration,
  monthlyPrice
}) => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    message: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Construire la description de l'équipement à partir des options sélectionnées
      const optionsDescription = Object.entries(selectedOptions)
        .map(([key, value]) => `${key}: ${value}`)
        .join(", ");

      const equipmentDescription = `${product.name} (${quantity} unité(s)) - ${optionsDescription} - Durée: ${duration} mois`;

      await createProductRequest({
        client_name: formData.name,
        client_email: formData.email,
        client_company: formData.company,
        client_contact_email: formData.email,
        equipment_description: equipmentDescription,
        message: formData.message,
        amount: (product.price || 0) * quantity,
        monthly_payment: monthlyPrice,
        quantity: quantity,
        duration: duration
      });

      toast.success("Votre demande a été envoyée avec succès");
      onClose();
      navigate("/demande-envoyee");
    } catch (error) {
      console.error("Erreur lors de l'envoi de la demande:", error);
      toast.error("Une erreur est survenue lors de l'envoi de votre demande");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Demande d&apos;offre</DialogTitle>
          <DialogDescription>
            Remplissez ce formulaire pour recevoir une offre personnalisée
          </DialogDescription>
        </DialogHeader>
        
        {product && (
          <div className="mb-4">
            <div className="flex items-start gap-4">
              <div className="w-20 h-20 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
                {product.image_url ? (
                  <img 
                    src={product.image_url} 
                    alt={product.name} 
                    className="object-contain max-h-full max-w-full"
                    onError={(e) => {
                      e.currentTarget.src = "/placeholder.svg";
                    }}
                  />
                ) : (
                  <div className="text-gray-400">
                    <ImageIcon className="h-10 w-10" />
                  </div>
                )}
              </div>
              
              <div>
                <h4 className="font-bold text-lg">{product.name}</h4>
                <p className="text-sm text-gray-500">
                  {product.brand} - {quantity} {quantity > 1 ? "unités" : "unité"} - {duration} mois
                </p>
                
                {Object.keys(selectedOptions).length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {Object.entries(selectedOptions).map(([key, value]) => (
                      <Badge key={key} variant="secondary" className="text-xs">
                        {key}: {value}
                      </Badge>
                    ))}
                  </div>
                )}
                
                <div className="mt-2 text-primary font-semibold">
                  {formatCurrency(monthlyPrice)} HT / mois
                </div>
              </div>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom complet *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email professionnel *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone</Label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company">Entreprise *</Label>
              <Input
                id="company"
                name="company"
                value={formData.company}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="Précisez ici toute information complémentaire concernant votre demande..."
                rows={3}
              />
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border">
            <h4 className="font-medium mb-2">Récapitulatif de votre demande</h4>
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span>Produit:</span>
                <span className="font-medium">{product.name}</span>
              </div>
              <div className="flex justify-between">
                <span>Quantité:</span>
                <span>{quantity}</span>
              </div>
              <div className="flex justify-between">
                <span>Durée:</span>
                <span>{duration} mois</span>
              </div>
              <div className="flex justify-between">
                <span>Options:</span>
                <span>
                  {Object.entries(selectedOptions).length > 0 
                    ? Object.entries(selectedOptions).map(([key, value]) => (
                      <div key={key} className="text-right">
                        {key}: <span className="font-medium">{value}</span>
                      </div>
                    ))
                    : "Configuration standard"
                  }
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t mt-2">
                <span>Mensualité estimée:</span>
                <span className="font-bold text-indigo-700">{formatCurrency(monthlyPrice)} HT / mois</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Envoi en cours..." : "Envoyer ma demande"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProductRequestForm;
