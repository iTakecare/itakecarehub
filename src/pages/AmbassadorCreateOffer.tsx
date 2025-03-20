
import React, { useState, useEffect } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import ClientInfo from "@/components/offer/ClientInfo";
import EquipmentForm from "@/components/offer/EquipmentForm";
import EquipmentList from "@/components/offer/EquipmentList";
import { Equipment, Leaser } from "@/types/equipment";
import PageTransition from "@/components/layout/PageTransition";
import Container from "@/components/layout/Container";
import { useAuth } from "@/context/AuthContext";
import { v4 as uuidv4 } from "uuid";

// Version du calculateur adaptée pour les ambassadeurs
const AmbassadorCreateOffer = () => {
  const location = useLocation();
  const { clientId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(false);
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [equipment, setEquipment] = useState<Equipment>({
    id: uuidv4(),
    title: "",
    purchasePrice: 0,
    margin: 20,
    monthlyPayment: 0,
  });
  const [selectedLeaser, setSelectedLeaser] = useState<Leaser | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [targetMonthlyPayment, setTargetMonthlyPayment] = useState(0);
  const [coefficient, setCoefficient] = useState(0.039);
  const [calculatedMargin, setCalculatedMargin] = useState({ percentage: 20, amount: 0 });
  
  // Si clientId est présent, charger les informations du client
  useEffect(() => {
    if (clientId) {
      fetchClient(clientId);
    }
  }, [clientId]);
  
  const fetchClient = async (id: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("id", id)
        .single();
      
      if (error) throw error;
      setClient(data);
    } catch (error) {
      console.error("Erreur lors du chargement du client:", error);
      toast.error("Impossible de charger les informations du client");
    } finally {
      setLoading(false);
    }
  };
  
  const calculateMonthlyPayment = (equipment: Equipment): number => {
    // Pour les ambassadeurs, on calcule simplement la mensualité sans montrer les marges
    return parseFloat((equipment.purchasePrice * coefficient).toFixed(2));
  };
  
  const calculateCalculatedMargin = (purchase: number, target: number): { percentage: number; amount: number } => {
    if (purchase <= 0 || target <= 0 || !coefficient) {
      return { percentage: 20, amount: 0 };
    }
    
    const requiredTotal = target / coefficient;
    const marginAmount = requiredTotal - purchase;
    const marginPercentage = (marginAmount / purchase) * 100;
    
    return {
      percentage: parseFloat(marginPercentage.toFixed(2)),
      amount: parseFloat(marginAmount.toFixed(2))
    };
  };
  
  const applyCalculatedMargin = () => {
    if (calculatedMargin.percentage >= 0) {
      setEquipment({
        ...equipment,
        margin: calculatedMargin.percentage
      });
      toast.success(`Marge de ${calculatedMargin.percentage}% appliquée`);
    }
  };
  
  useEffect(() => {
    if (targetMonthlyPayment > 0 && equipment.purchasePrice > 0) {
      const margin = calculateCalculatedMargin(
        equipment.purchasePrice,
        targetMonthlyPayment
      );
      setCalculatedMargin(margin);
    }
  }, [targetMonthlyPayment, equipment.purchasePrice, coefficient]);
  
  const monthlyPayment = calculateMonthlyPayment(equipment);
  
  const handleAddEquipment = () => {
    if (editingId) {
      // Mise à jour d'un équipement existant
      setEquipmentList(
        equipmentList.map((item) =>
          item.id === editingId
            ? { ...equipment, monthlyPayment: monthlyPayment }
            : item
        )
      );
      setEditingId(null);
    } else {
      // Ajout d'un nouvel équipement
      setEquipmentList([
        ...equipmentList,
        { ...equipment, monthlyPayment: monthlyPayment }
      ]);
    }
    
    // Réinitialiser le formulaire
    setEquipment({
      id: uuidv4(),
      title: "",
      purchasePrice: 0,
      margin: 20,
      monthlyPayment: 0
    });
    setTargetMonthlyPayment(0);
  };
  
  const handleEditEquipment = (id: string) => {
    const itemToEdit = equipmentList.find((item) => item.id === id);
    if (itemToEdit) {
      setEquipment(itemToEdit);
      setEditingId(id);
    }
  };
  
  const handleDeleteEquipment = (id: string) => {
    setEquipmentList(equipmentList.filter((item) => item.id !== id));
  };
  
  const handleCancelEditing = () => {
    setEditingId(null);
    setEquipment({
      id: uuidv4(),
      title: "",
      purchasePrice: 0,
      margin: 20,
      monthlyPayment: 0
    });
    setTargetMonthlyPayment(0);
  };
  
  const handleSaveOffer = async () => {
    if (!client) {
      toast.error("Veuillez d'abord sélectionner un client");
      return;
    }
    
    if (equipmentList.length === 0) {
      toast.error("Veuillez ajouter au moins un équipement");
      return;
    }
    
    try {
      setLoading(true);
      
      // Calculer le montant total
      const totalMonthlyPayment = equipmentList.reduce(
        (sum, item) => sum + (item.monthlyPayment || 0),
        0
      );
      
      const totalPurchasePrice = equipmentList.reduce(
        (sum, item) => sum + item.purchasePrice,
        0
      );
      
      // Décrire l'équipement
      const equipmentDescription = equipmentList
        .map((item) => `${item.title} (${item.monthlyPayment}€/mois)`)
        .join(", ");
      
      // Créer l'offre dans la base de données
      const { data, error } = await supabase.from("offers").insert([
        {
          client_id: client.id,
          client_name: client.name,
          client_email: client.email,
          amount: totalPurchasePrice,
          monthly_payment: totalMonthlyPayment,
          equipment_description: equipmentDescription,
          workflow_status: "draft",
          type: "ambassador_offer",
          user_id: user?.id,
        }
      ]).select();
      
      if (error) throw error;
      
      toast.success("Offre créée avec succès!");
      
      // Rediriger vers la page des offres
      navigate("/ambassador/offers");
    } catch (error) {
      console.error("Erreur lors de la sauvegarde de l'offre:", error);
      toast.error("Impossible de sauvegarder l'offre");
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <PageTransition>
      <Container>
        <div className="w-full space-y-8 p-4 md:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Calculateur d'offre</h1>
              <p className="text-muted-foreground">
                Calculez une offre adaptée pour votre client
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => navigate(-1)}
              >
                Annuler
              </Button>
              <Button 
                onClick={handleSaveOffer}
                disabled={loading || equipmentList.length === 0 || !client}
              >
                {loading ? "Sauvegarde..." : "Sauvegarder l'offre"}
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <ClientInfo 
                client={client} 
                onClientChange={setClient} 
                isAmbassadorMode={true}
              />
              
              <Card className="mt-6">
                <CardContent className="p-6">
                  <div className="mb-4 text-lg font-medium">
                    Mensualité totale: {equipmentList.reduce((sum, item) => sum + (item.monthlyPayment || 0), 0).toFixed(2)}€
                  </div>
                  
                  <EquipmentList
                    equipmentList={equipmentList}
                    onEdit={handleEditEquipment}
                    onDelete={handleDeleteEquipment}
                    hideFinancialDetails={true}
                  />
                </CardContent>
              </Card>
            </div>
            
            <div className="lg:col-span-3">
              <EquipmentForm
                equipment={equipment}
                setEquipment={setEquipment}
                selectedLeaser={selectedLeaser}
                addToList={handleAddEquipment}
                editingId={editingId}
                cancelEditing={handleCancelEditing}
                onOpenCatalog={() => {}}
                coefficient={coefficient}
                monthlyPayment={monthlyPayment}
                targetMonthlyPayment={targetMonthlyPayment}
                setTargetMonthlyPayment={setTargetMonthlyPayment}
                calculatedMargin={calculatedMargin}
                applyCalculatedMargin={applyCalculatedMargin}
                hideFinancialDetails={true}
              />
            </div>
          </div>
        </div>
      </Container>
    </PageTransition>
  );
};

export default AmbassadorCreateOffer;
