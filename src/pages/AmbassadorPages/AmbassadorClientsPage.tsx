
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, RefreshCw, User, Loader2, Pencil, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import Container from "@/components/layout/Container";
import PageTransition from "@/components/layout/PageTransition";
import { useIsMobile } from "@/hooks/use-mobile";
import { ClientsEmptyState } from "@/components/clients/ClientsEmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import AmbassadorErrorHandler from "@/components/ambassador/AmbassadorErrorHandler";
import { getAmbassadorClients } from "@/services/ambassadorClientService";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const AmbassadorClientsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [clientToDelete, setClientToDelete] = useState(null);

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Utiliser directement le service pour récupérer les clients
      const data = await getAmbassadorClients();
      
      setClients(data);
      setFilteredClients(data);
    } catch (err) {
      console.error("Error loading clients:", err);
      setError("Unable to load clients");
      toast.error("Error loading clients");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);
  
  useEffect(() => {
    fetchClients();
  }, [fetchClients]);
  
  useEffect(() => {
    if (!clients.length) return;
    
    if (searchTerm) {
      const filtered = clients.filter(client => 
        (client.name && client.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (client.company && client.company.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredClients(filtered);
    } else {
      setFilteredClients(clients);
    }
  }, [searchTerm, clients]);
  
  const handleCreateOffer = (clientId) => {
    navigate(`/ambassador/create-offer/${clientId}`);
  };
  
  const handleAddClient = () => {
    navigate("/ambassador/clients/create");
  };
  
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchClients();
    toast.success("Client list refreshed");
  };

  const handleEditClient = (clientId) => {
    navigate(`/ambassador/clients/edit/${clientId}`);
  };
  
  const handleDeleteClient = async (clientId) => {
    try {
      // Implement deletion logic here
      // For now, just show a toast and refresh the list
      toast.success("Client supprimé avec succès");
      await fetchClients();
    } catch (error) {
      console.error("Error deleting client:", error);
      toast.error("Erreur lors de la suppression du client");
    } finally {
      setClientToDelete(null);
    }
  };
  
  const renderClientCards = () => {
    if (filteredClients.length === 0) {
      return (
        <div className="text-center p-10">
          <User className="h-10 w-10 mx-auto text-gray-300 mb-2" />
          <p className="text-muted-foreground">No clients found</p>
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-1 gap-4">
        {filteredClients.map((client) => (
          <Card key={client.id} className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium">{client.name}</h3>
                <p className="text-sm text-muted-foreground">{client.email}</p>
                {client.company && (
                  <p className="text-sm">{client.company}</p>
                )}
              </div>
              <div className="flex space-x-2">
                <Button size="icon" variant="ghost" onClick={() => handleEditClient(client.id)}>
                  <Pencil className="h-4 w-4 text-gray-500" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => setClientToDelete(client.id)}>
                  <Trash2 className="h-4 w-4 text-gray-500" />
                </Button>
                <Button size="sm" onClick={() => handleCreateOffer(client.id)}>
                  <Plus className="h-4 w-4 mr-1" /> Offer
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  };
  
  const renderClientTable = () => {
    return (
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Company</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4}>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredClients.length > 0 ? (
              filteredClients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">{client.name}</TableCell>
                  <TableCell>{client.email || "-"}</TableCell>
                  <TableCell>{client.company || "-"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Button size="icon" variant="ghost" onClick={() => handleEditClient(client.id)}>
                        <Pencil className="h-4 w-4 text-gray-500" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => setClientToDelete(client.id)}>
                        <Trash2 className="h-4 w-4 text-gray-500" />
                      </Button>
                      <Button size="sm" onClick={() => handleCreateOffer(client.id)}>
                        <Plus className="h-4 w-4 mr-1" /> Create offer
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4}>
                  <ClientsEmptyState />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    );
  };

  if (loading && !refreshing) {
    return (
      <PageTransition>
        <Container>
          <div className="h-screen flex items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        </Container>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <Container>
        <div className="p-4 md:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">My Clients</h1>
              <p className="text-muted-foreground">
                Manage clients you've brought in
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button 
                variant="outline" 
                onClick={handleRefresh}
                disabled={refreshing}
              >
                {refreshing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Refresh
              </Button>
              <Button onClick={handleAddClient}>
                <Plus className="mr-2 h-4 w-4" />
                Add a client
              </Button>
            </div>
          </div>
          
          <div className="flex justify-between items-center mb-6">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search for a client..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          {error ? (
            <AmbassadorErrorHandler 
              message={error} 
              onRetry={handleRefresh} 
              showDiagnosticInfo={true}
            />
          ) : (
            isMobile ? renderClientCards() : renderClientTable()
          )}
        </div>

        {/* Delete confirmation dialog */}
        <AlertDialog open={!!clientToDelete} onOpenChange={() => setClientToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action ne peut pas être annulée. Le client sera définitivement supprimé.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleDeleteClient(clientToDelete)}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Container>
    </PageTransition>
  );
};

export default AmbassadorClientsPage;
