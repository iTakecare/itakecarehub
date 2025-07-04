import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Calendar, User, Building2, Euro, FileText, Receipt } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Contract } from "@/services/contractService";
import ContractStatusBadge from "./ContractStatusBadge";
import { areAllSerialNumbersComplete, generateLocalInvoice, getBillitIntegration } from "@/services/invoiceService";
import { useMultiTenant } from "@/hooks/useMultiTenant";
import { toast } from "sonner";

interface ContractDetailHeaderProps {
  contract: Contract;
  onRefresh?: () => void;
}

const ContractDetailHeader: React.FC<ContractDetailHeaderProps> = ({ contract, onRefresh }) => {
  const navigate = useNavigate();
  const { companyId } = useMultiTenant();
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false);
  const [billitEnabled, setBillitEnabled] = useState(false);
  const [canGenerateInvoice, setCanGenerateInvoice] = useState(false);

  useEffect(() => {
    const checkBillitIntegration = async () => {
      if (!companyId) return;
      
      const integration = await getBillitIntegration(companyId);
      setBillitEnabled(integration?.is_enabled || false);
    };

    checkBillitIntegration();
  }, [companyId]);

  useEffect(() => {
    // Pour maintenant, simplifier la vérification - on ajoutera invoice_generated dans useContractDetail
    const canGenerate = billitEnabled && 
                       contract.status === 'active';
    
    setCanGenerateInvoice(canGenerate);
  }, [billitEnabled, contract]);

  const handleGenerateInvoice = async () => {
    if (!companyId || !canGenerateInvoice) return;

    setIsGeneratingInvoice(true);
    try {
      const invoice = await generateLocalInvoice(contract.id, companyId);
      toast.success("Facture générée en brouillon avec succès !");
      
      // Rediriger vers la page de facturation
      navigate(`/admin/invoicing/${invoice.id}`);
      
      onRefresh?.();
    } catch (error: any) {
      console.error("Erreur lors de la génération de la facture:", error);
      toast.error(error.message || "Erreur lors de la génération de la facture");
    } finally {
      setIsGeneratingInvoice(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-primary/5 to-accent/5 border-b">
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate('/contracts')}
              className="hover:bg-background/80"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Contrat {`CON-${contract.id.slice(0, 8)}`}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  Créé le {formatDate(contract.created_at)}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {canGenerateInvoice && (
              <Button 
                onClick={handleGenerateInvoice}
                disabled={isGeneratingInvoice}
                className="flex items-center gap-2"
              >
                <Receipt className="h-4 w-4" />
                {isGeneratingInvoice ? "Génération..." : "Générer la facture"}
              </Button>
            )}
            <ContractStatusBadge status={contract.status} />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-background/60 backdrop-blur rounded-lg p-4 border">
            <div className="flex items-center gap-2 mb-1">
              <User className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-muted-foreground">Client</span>
            </div>
            <p className="font-semibold">{contract.client_name}</p>
            {(contract.client_email || contract.clients?.email) && (
              <p className="text-sm text-muted-foreground">
                {contract.client_email || contract.clients?.email}
              </p>
            )}
          </div>

          <div className="bg-background/60 backdrop-blur rounded-lg p-4 border">
            <div className="flex items-center gap-2 mb-1">
              <Euro className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-muted-foreground">Mensualité</span>
            </div>
            <p className="font-semibold text-lg">{formatCurrency(contract.monthly_payment)}</p>
          </div>

          <div className="bg-background/60 backdrop-blur rounded-lg p-4 border">
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-muted-foreground">Bailleur</span>
            </div>
            <p className="font-semibold">{contract.leaser_name}</p>
          </div>

          {contract.tracking_number && (
            <div className="bg-background/60 backdrop-blur rounded-lg p-4 border">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-muted-foreground">Suivi</span>
              </div>
              <p className="font-semibold">{contract.tracking_number}</p>
              {contract.delivery_carrier && (
                <p className="text-sm text-muted-foreground">{contract.delivery_carrier}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContractDetailHeader;