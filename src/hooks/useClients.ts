
import { useState, useEffect, useCallback } from 'react';
import { getAllClients } from '@/services/clientService';
import type { Client as ClientType } from '@/types/client';
import { toast } from 'sonner';

export const useClients = () => {
  const [clients, setClients] = useState<ClientType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [showAmbassadorClients, setShowAmbassadorClients] = useState(false);

  const fetchClients = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null); // Reset error state before fetching
      
      console.log("Appel à getAllClients pour récupérer tous les clients");
      const clientsData = await getAllClients();
      
      if (clientsData && clientsData.length > 0) {
        console.log('Clients récupérés:', clientsData.length);
        
        // Ensure clients have updated_at property
        const formattedClients: ClientType[] = clientsData.map(client => ({
          ...client,
          company: client.company || '',
          updated_at: client.updated_at || new Date(), // Ensure updated_at exists
          status: client.status || 'active' // Ensure status exists
        }));
        
        setClients(formattedClients);
      } else {
        console.log('Aucun client trouvé');
        setClients([]);
      }
    } catch (err) {
      console.error("Erreur lors de la récupération des clients:", err);
      setError(err instanceof Error ? err : new Error('Erreur lors de la récupération des clients'));
      toast.error("Erreur lors du chargement des clients");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  // Make sure filteredClients is always initialized as an array
  const filteredClients = clients ? clients.filter((client) => {
    // Ne plus filtrer par statut "duplicate" - afficher tous les clients
    
    const matchesSearch = 
      searchTerm === "" ||
      (client.name && client.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (client.company && client.company.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = 
      selectedStatus === "all" ||
      client.status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  }) : [];

  console.log('Clients filtrés:', filteredClients.length);

  const refreshClients = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      console.log("Refreshing clients list...");
      const refreshedClients = await getAllClients();
      
      setClients(refreshedClients.map(client => ({
        ...client,
        company: client.company || '',
        updated_at: client.updated_at || new Date()
      })));
    } catch (err) {
      console.error("Erreur lors du rafraîchissement des clients:", err);
      toast.error("Erreur lors du rafraîchissement des clients");
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    clients: filteredClients,
    allClients: clients, // Ajouter tous les clients pour le debugging
    isLoading,
    error,
    searchTerm,
    setSearchTerm,
    selectedStatus,
    setSelectedStatus,
    showAmbassadorClients,
    setShowAmbassadorClients,
    refreshClients
  };
};
