
import React, { useEffect } from "react";
import { Route, Routes, Navigate, useNavigate } from "react-router-dom";
import ClientDashboard from "@/pages/ClientDashboard";
import ClientContractsPage from "@/pages/ClientContractsPage";
import ClientRequestsPage from "@/pages/ClientRequestsPage";
import { useAuth } from "@/context/AuthContext";
import ClientSidebar from "./ClientSidebar";
import ClientsLoading from "@/components/clients/ClientsLoading";

// Placeholder components for client routes
const ClientEquipment = () => <div className="w-full"><h1 className="text-3xl font-bold mb-6">Mes Équipements</h1><p>Gestion des équipements en cours d'implémentation.</p></div>;
const ClientCatalog = () => <div className="w-full"><h1 className="text-3xl font-bold mb-6">Catalogue</h1><p>Catalogue en cours d'implémentation.</p></div>;
const ClientNewRequest = () => <div className="w-full"><h1 className="text-3xl font-bold mb-6">Nouvelle Demande</h1><p>Formulaire de création de demande en cours d'implémentation.</p></div>;

export const ClientLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex h-screen overflow-hidden">
      <ClientSidebar />
      <div className="flex-1 flex flex-col overflow-auto">
        <main className="flex-1 overflow-auto p-8">{children}</main>
      </div>
    </div>
  );
};

const ClientRoutes = () => {
  const { user, isLoading, isClient } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Si l'utilisateur n'est pas en cours de chargement et n'est pas un client, rediriger
    if (!isLoading && user && !isClient()) {
      navigate('/dashboard');
    }
  }, [isLoading, user, isClient, navigate]);

  if (isLoading) {
    return <ClientLayout><ClientsLoading /></ClientLayout>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return (
    <Routes>
      <Route path="dashboard" element={<ClientLayout><ClientDashboard /></ClientLayout>} />
      <Route path="contracts" element={<ClientLayout><ClientContractsPage /></ClientLayout>} />
      <Route path="equipment" element={<ClientLayout><ClientEquipment /></ClientLayout>} />
      <Route path="requests" element={<ClientLayout><ClientRequestsPage /></ClientLayout>} />
      <Route path="catalog" element={<ClientLayout><ClientCatalog /></ClientLayout>} />
      <Route path="new-request" element={<ClientLayout><ClientNewRequest /></ClientLayout>} />
      <Route path="*" element={<Navigate to="/client/dashboard" />} />
    </Routes>
  );
};

export default ClientRoutes;
