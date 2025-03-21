
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Ambassador, getAmbassadorById } from "@/services/ambassadorService";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import PageTransition from "@/components/layout/PageTransition";
import Container from "@/components/layout/Container";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin } from "lucide-react";
import ClientsView from "@/components/crm/detail/ClientsView";
import CommissionsView from "@/components/crm/detail/CommissionsView";
import { 
  CommissionLevel, 
  getCommissionLevelWithRates, 
  getCommissionLevels,
  updateAmbassadorCommissionLevel 
} from "@/services/commissionService";
import ContactInfoSection from "@/components/crm/detail/sections/ContactInfoSection";
import CompanyInfoSection from "@/components/crm/detail/sections/CompanyInfoSection";
import CommissionLevelSelector from "@/components/crm/detail/sections/CommissionLevelSelector";
import StatsSummary from "@/components/crm/detail/sections/StatsSummary";
import NotesSection from "@/components/crm/detail/sections/NotesSection";
import { Card, CardContent } from "@/components/ui/card";

const AmbassadorDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [ambassador, setAmbassador] = useState<Ambassador | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState("overview");
  const [commissionLevel, setCommissionLevel] = useState<CommissionLevel | null>(null);
  const [commissionLevels, setCommissionLevels] = useState<CommissionLevel[]>([]);
  const [currentLevelId, setCurrentLevelId] = useState<string>("");
  const [clients, setClients] = useState<any[]>([]);
  const [commissionLoading, setCommissionLoading] = useState(false);

  useEffect(() => {
    if (!id) {
      toast.error("ID d'ambassadeur manquant");
      navigate("/ambassadors");
      return;
    }

    const loadAmbassador = async () => {
      try {
        setLoading(true);
        const data = await getAmbassadorById(id);
        if (!data) {
          setError("Ambassadeur introuvable");
          toast.error("Ambassadeur introuvable");
          setTimeout(() => navigate("/ambassadors"), 2000);
          return;
        }
        
        console.log("Ambassador data loaded:", data);
        setAmbassador(data);
        
        // Load commission level
        if (data.commission_level_id) {
          setCurrentLevelId(data.commission_level_id);
          loadCommissionLevel(data.commission_level_id);
        } else {
          setCommissionLevel(null);
          setCurrentLevelId("");
        }
        
        loadCommissionLevels();
      } catch (error: any) {
        console.error("Erreur lors du chargement de l'ambassadeur:", error);
        
        if (error.message && error.message.includes("invalid input syntax for type uuid")) {
          setError("L'identifiant fourni n'est pas valide");
          toast.error("ID d'ambassadeur invalide");
        } else {
          setError("Erreur lors du chargement de l'ambassadeur");
          toast.error("Erreur lors du chargement de l'ambassadeur");
        }
        
        setTimeout(() => navigate("/ambassadors"), 2000);
      } finally {
        setLoading(false);
      }
    };

    loadAmbassador();
  }, [id, navigate]);

  const loadCommissionLevels = async () => {
    try {
      const levels = await getCommissionLevels("ambassador");
      setCommissionLevels(levels);
    } catch (error) {
      console.error("Error loading commission levels:", error);
    }
  };

  const loadCommissionLevel = async (levelId: string) => {
    setCommissionLoading(true);
    try {
      const level = await getCommissionLevelWithRates(levelId);
      setCommissionLevel(level);
    } catch (error) {
      console.error("Error loading commission level:", error);
    } finally {
      setCommissionLoading(false);
    }
  };

  const handleUpdateCommissionLevel = async (levelId: string) => {
    try {
      if (!ambassador?.id) return;
      
      console.log("Updating commission level to:", levelId);
      await updateAmbassadorCommissionLevel(ambassador.id, levelId);
      setCurrentLevelId(levelId);
      loadCommissionLevel(levelId);
      
      // Mettre à jour l'ambassadeur dans le composant parent
      if (ambassador && typeof ambassador === 'object') {
        ambassador.commission_level_id = levelId;
      }
      
      toast.success("Barème de commissionnement mis à jour");
    } catch (error) {
      console.error("Error updating commission level:", error);
      toast.error("Erreur lors de la mise à jour du barème");
    }
  };

  // Fonction pour gérer l'édition de l'ambassadeur
  const handleEdit = () => {
    if (ambassador && ambassador.id) {
      console.log("Navigating to edit page for ambassador:", ambassador.id);
      navigate(`/ambassadors/${ambassador.id}/edit`);
    }
  };

  // Fonction pour gérer la création d'une offre
  const handleCreateOffer = () => {
    navigate(`/ambassadors/${id}/create-offer`);
  };

  if (loading) {
    return (
      <PageTransition>
        <Container>
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Chargement des données...</span>
          </div>
        </Container>
      </PageTransition>
    );
  }

  if (error) {
    return (
      <PageTransition>
        <Container>
          <div className="p-4 text-center max-w-md mx-auto mt-12">
            <div className="rounded-full bg-destructive/10 w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <span className="text-destructive text-3xl">!</span>
            </div>
            <h1 className="text-xl font-bold mb-2">Erreur</h1>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button 
              className="px-4 py-2" 
              onClick={() => navigate("/ambassadors")}
            >
              Retour à la liste
            </Button>
          </div>
        </Container>
      </PageTransition>
    );
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <PageTransition>
      <Container>
        <div className="flex justify-between items-center mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/ambassadors")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" /> Retour aux ambassadeurs
          </Button>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleEdit}
              className="flex items-center gap-2"
            >
              Modifier l'ambassadeur
            </Button>
            
            <Button 
              onClick={handleCreateOffer}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Créer une offre
            </Button>
          </div>
        </div>
        
        {ambassador && (
          <div className="mt-4">
            <div className="flex items-start gap-4 mb-6">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-primary text-white text-xl">
                  {getInitials(ambassador.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold">{ambassador.name}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge
                    variant={ambassador.status === "active" ? "default" : "secondary"}
                  >
                    {ambassador.status === "active" ? "Actif" : "Inactif"}
                  </Badge>
                  {ambassador.region && (
                    <span className="flex items-center text-xs gap-1 text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {ambassador.region}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <Card className="mb-6">
              <CardContent className="pt-6">
                <Tabs value={tab} onValueChange={setTab}>
                  <TabsList className="mb-4 grid w-full grid-cols-3">
                    <TabsTrigger value="overview">Aperçu</TabsTrigger>
                    <TabsTrigger value="clients">Clients</TabsTrigger>
                    <TabsTrigger value="commissions">Commissions</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview">
                    <div className="space-y-6">
                      <ContactInfoSection 
                        email={ambassador.email} 
                        phone={ambassador.phone} 
                      />

                      <CompanyInfoSection 
                        company={ambassador.company}
                        vat_number={ambassador.vat_number}
                        address={ambassador.address}
                        postal_code={ambassador.postal_code}
                        city={ambassador.city}
                        country={ambassador.country}
                      />

                      <CommissionLevelSelector 
                        ambassadorId={ambassador.id}
                        currentLevelId={currentLevelId}
                        commissionLevel={commissionLevel}
                        commissionLevels={commissionLevels}
                        loading={commissionLoading}
                        onUpdateCommissionLevel={handleUpdateCommissionLevel}
                      />

                      <StatsSummary 
                        clientsCount={ambassador.clients_count || 0}
                        commissionsTotal={ambassador.commissions_total || 0}
                      />

                      <NotesSection notes={ambassador.notes} />
                    </div>
                  </TabsContent>

                  <TabsContent value="clients">
                    <ClientsView 
                      owner={{ id: ambassador.id, name: ambassador.name, type: 'ambassador' }}
                      clients={clients}
                      isOpen={tab === "clients"}
                      onClose={() => setTab("overview")}
                    />
                  </TabsContent>

                  <TabsContent value="commissions">
                    <CommissionsView
                      owner={{ id: ambassador.id, name: ambassador.name, type: 'ambassador' }}
                      isOpen={tab === "commissions"}
                      onClose={() => setTab("overview")}
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        )}
      </Container>
    </PageTransition>
  );
};

export default AmbassadorDetail;
