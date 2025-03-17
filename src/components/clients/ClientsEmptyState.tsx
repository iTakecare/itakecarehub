
import React from "react";
import { TableRow, TableCell } from "@/components/ui/table";
import { UserX } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const ClientsEmptyState = () => {
  const isMobile = useIsMobile();
  
  return (
    <TableRow>
      <TableCell colSpan={7} className="h-24 text-center">
        <div className="flex flex-col items-center justify-center py-8">
          <UserX className="h-10 w-10 text-muted-foreground mb-2" />
          <p className="text-muted-foreground">Aucun client trouvé</p>
          {isMobile && (
            <p className="text-xs text-muted-foreground/70 mt-2 max-w-xs text-center px-4">
              Utilisez le bouton "Ajouter un client" pour commencer
            </p>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
};

export default ClientsEmptyState;
