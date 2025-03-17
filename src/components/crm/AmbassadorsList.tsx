
import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HeartHandshake, MoreHorizontal, Mail, Phone, AlertCircle, Loader2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useIsMobile } from "@/hooks/use-mobile";
import { getAmbassadors, Ambassador } from "@/services/ambassadorService";
import { toast } from "sonner";

interface AmbassadorsListProps {
  searchTerm?: string;
  statusFilter?: string;
}

const AmbassadorsList: React.FC<AmbassadorsListProps> = ({ searchTerm = '', statusFilter = 'all' }) => {
  const isMobile = useIsMobile();
  const [ambassadors, setAmbassadors] = useState<Ambassador[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchAmbassadors = async () => {
      try {
        setLoading(true);
        const data = await getAmbassadors();
        setAmbassadors(data);
        setError(null);
      } catch (err) {
        console.error("Error fetching ambassadors:", err);
        setError("Une erreur est survenue lors du chargement des ambassadeurs");
        toast.error("Impossible de charger les ambassadeurs");
      } finally {
        setLoading(false);
      }
    };
    
    fetchAmbassadors();
  }, []);

  // Filter ambassadors based on search term and status filter
  const filteredAmbassadors = ambassadors.filter(ambassador => {
    const matchesSearch = 
      ambassador.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ambassador.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ambassador.company && ambassador.company.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === "all" || ambassador.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
        <p className="text-muted-foreground">Chargement des ambassadeurs...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (ambassadors.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <AlertCircle className="h-12 w-12 text-gray-300 mb-4" />
        <p className="text-muted-foreground">Aucun ambassadeur n'a été trouvé</p>
      </div>
    );
  }
  
  // Mobile card view for ambassadors
  const renderMobileView = () => {
    return (
      <div className="space-y-4">
        {filteredAmbassadors.length > 0 ? (
          filteredAmbassadors.map((ambassador) => (
            <div key={ambassador.id} className="bg-card rounded-lg shadow p-4 border">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium">{ambassador.name}</h3>
                  <div className="text-xs text-muted-foreground mt-1 break-all">
                    <div className="flex items-center">
                      <Mail className="h-3 w-3 mr-1 flex-shrink-0" />
                      <span className="truncate">{ambassador.email}</span>
                    </div>
                    {ambassador.phone && (
                      <div className="flex items-center mt-1">
                        <Phone className="h-3 w-3 mr-1 flex-shrink-0" />
                        {ambassador.phone}
                      </div>
                    )}
                  </div>
                </div>
                <Badge variant={ambassador.status === 'active' ? 'default' : 'secondary'} className={
                  ambassador.status === 'active' 
                    ? "bg-green-100 text-green-800 hover:bg-green-100" 
                    : "bg-gray-100 text-gray-800 hover:bg-gray-100"
                }>
                  {ambassador.status === 'active' ? 'Actif' : 'Inactif'}
                </Badge>
              </div>
              
              <div className="grid grid-cols-3 gap-2 mt-3 text-sm">
                <div>
                  <span className="text-xs text-muted-foreground block">Entreprise</span>
                  {ambassador.company || "-"}
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Clients</span>
                  {ambassador.clients_count || 0}
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Commissions</span>
                  {ambassador.commissions_total || 0}€
                </div>
              </div>
              
              <div className="mt-3 pt-3 border-t flex justify-end">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <span className="sr-only">Actions</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>Afficher le profil</DropdownMenuItem>
                    <DropdownMenuItem>Modifier</DropdownMenuItem>
                    <DropdownMenuItem>Voir les clients</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className={ambassador.status === 'active' ? "text-amber-600" : "text-green-600"}>
                      {ambassador.status === 'active' ? 'Désactiver' : 'Activer'}
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600">Supprimer</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center p-6 text-center">
            <AlertCircle className="h-12 w-12 mb-2 text-gray-300" />
            <p className="text-muted-foreground">Aucun ambassadeur trouvé</p>
          </div>
        )}
      </div>
    );
  };

  // Desktop table view
  const renderDesktopView = () => {
    return (
      <div className="space-y-4 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="whitespace-nowrap">Nom</TableHead>
              <TableHead className="whitespace-nowrap">Contact</TableHead>
              <TableHead className="whitespace-nowrap">Entreprise</TableHead>
              <TableHead className="whitespace-nowrap">Clients</TableHead>
              <TableHead className="whitespace-nowrap">Commissions</TableHead>
              <TableHead className="whitespace-nowrap">Statut</TableHead>
              <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAmbassadors.length > 0 ? (
              filteredAmbassadors.map((ambassador) => (
                <TableRow key={ambassador.id}>
                  <TableCell className="font-medium">{ambassador.name}</TableCell>
                  <TableCell>
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Mail className="h-3 w-3 mr-1 flex-shrink-0" />
                        <span className="truncate max-w-[150px]">{ambassador.email}</span>
                      </div>
                      {ambassador.phone && (
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Phone className="h-3 w-3 mr-1 flex-shrink-0" />
                          {ambassador.phone}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{ambassador.company || "-"}</TableCell>
                  <TableCell>{ambassador.clients_count || 0} clients</TableCell>
                  <TableCell>{ambassador.commissions_total || 0} €</TableCell>
                  <TableCell>
                    <Badge variant={ambassador.status === 'active' ? 'default' : 'secondary'} className={
                      ambassador.status === 'active' 
                        ? "bg-green-100 text-green-800 hover:bg-green-100" 
                        : "bg-gray-100 text-gray-800 hover:bg-gray-100"
                    }>
                      {ambassador.status === 'active' ? 'Actif' : 'Inactif'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>Afficher le profil</DropdownMenuItem>
                        <DropdownMenuItem>Modifier</DropdownMenuItem>
                        <DropdownMenuItem>Voir les clients</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className={ambassador.status === 'active' ? "text-amber-600" : "text-green-600"}>
                          {ambassador.status === 'active' ? 'Désactiver' : 'Activer'}
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">Supprimer</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <AlertCircle className="h-12 w-12 mb-2 text-gray-300" />
                    <p>Aucun ambassadeur trouvé</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {isMobile ? renderMobileView() : renderDesktopView()}
    </div>
  );
};

export default AmbassadorsList;
