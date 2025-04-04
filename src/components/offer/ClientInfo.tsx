
import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { UserPlus, Save, Loader2 } from "lucide-react";
import { Equipment, Leaser } from "@/types/equipment";

interface ClientInfoProps {
  clientId: string | null;
  clientName: string;
  clientEmail: string;
  clientCompany: string;
  remarks: string;
  setRemarks: (remarks: string) => void;
  onOpenClientSelector: () => void;
  handleSaveOffer: () => void;
  isSubmitting: boolean;
  selectedLeaser: Leaser | null;
  equipmentList: Equipment[];
  hideFinancialDetails?: boolean;
}

const ClientInfo: React.FC<ClientInfoProps> = ({
  clientId,
  clientName,
  clientEmail,
  clientCompany,
  remarks,
  setRemarks,
  onOpenClientSelector,
  handleSaveOffer,
  isSubmitting,
  selectedLeaser,
  equipmentList,
  hideFinancialDetails
}) => {
  const canSubmit = clientName && clientEmail && equipmentList.length > 0;
  
  return (
    <Card className="mt-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Informations client</CardTitle>
        <CardDescription className="text-xs">
          Renseignez les informations du client pour finaliser l'offre
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Button 
              onClick={onOpenClientSelector}
              variant="outline"
              className="w-full flex justify-between items-center"
            >
              <div className="flex items-center">
                <UserPlus className="h-4 w-4 mr-2 text-primary" />
                <div className="text-left">
                  <p className="text-sm font-medium">
                    {clientId ? "Client sélectionné" : "Sélectionner un client"}
                  </p>
                  {clientId && (
                    <p className="text-xs text-muted-foreground">
                      {clientName}{clientCompany ? ` - ${clientCompany}` : ""}
                    </p>
                  )}
                </div>
              </div>
              <span className="text-xs text-muted-foreground">
                {clientId ? "Changer" : "Sélectionner"}
              </span>
            </Button>
          </div>
          
          {clientId || clientName ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="client-name">Nom</Label>
                  <Input id="client-name" value={clientName} readOnly={!!clientId} className={clientId ? "bg-muted/50" : ""} />
                </div>
                <div>
                  <Label htmlFor="client-email">Email</Label>
                  <Input id="client-email" value={clientEmail} readOnly={!!clientId} className={clientId ? "bg-muted/50" : ""} />
                </div>
              </div>
              
              {!hideFinancialDetails && (
                <div>
                  <Label htmlFor="client-remarks">Remarques (optionnel)</Label>
                  <Textarea 
                    id="client-remarks"
                    placeholder="Ajoutez des remarques pour cette offre..."
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    rows={3}
                  />
                </div>
              )}
              
              <Separator />
              
              <Button 
                onClick={handleSaveOffer}
                disabled={!canSubmit || isSubmitting}
                className="w-full"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Enregistrer l'offre
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground text-sm">
              Sélectionnez un client pour continuer
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ClientInfo;
