
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Users, FileText, Building2 } from "lucide-react";
import { Leaser } from "@/types/equipment";

interface ClientInfoProps {
  clientId: string | null;
  clientName: string;
  clientEmail: string;
  clientCompany: string;
  remarks: string;
  setRemarks: (value: string) => void;
  onOpenClientSelector: () => void;
  handleSaveOffer: () => void;
  isSubmitting: boolean;
  selectedLeaser: Leaser | null;
  equipmentList: any[];
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
  hideFinancialDetails = false
}) => {
  return (
    <div className="space-y-6">
      {/* Client Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Informations Client
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            variant="outline"
            onClick={onOpenClientSelector}
            className="w-full"
          >
            {clientId ? "Modifier le client" : "Sélectionner un client"}
          </Button>
          
          {clientName && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="w-4 h-4 text-gray-600" />
                <span className="font-medium">{clientName}</span>
              </div>
              <div className="text-sm text-gray-600">
                <div>Email: {clientEmail}</div>
                {clientCompany && <div>Entreprise: {clientCompany}</div>}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Remarks Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Remarques
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Ajouter des remarques ou notes sur cette offre..."
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Save Button */}
      <Button
        onClick={handleSaveOffer}
        disabled={isSubmitting || !clientName || !clientEmail || equipmentList.length === 0}
        className="w-full"
        size="lg"
      >
        {isSubmitting ? "Enregistrement..." : "Enregistrer l'offre"}
      </Button>
    </div>
  );
};

export default ClientInfo;
