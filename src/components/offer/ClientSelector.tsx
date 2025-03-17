
import React from 'react';
import { Button } from "@/components/ui/button";
import { Client } from '@/types/client';

// Interface for the button component
interface ClientSelectorProps {
  selectedClient: Client | null;
  onSelect: () => void;
}

// Button component
const ClientSelectorButton: React.FC<ClientSelectorProps> = ({ 
  selectedClient, 
  onSelect 
}) => {
  return (
    <Button 
      onClick={onSelect} 
      variant="outline" 
      className="flex-1 justify-start text-left font-normal"
    >
      <span className="truncate">
        {selectedClient ? `${selectedClient.name}${selectedClient.company ? ` - ${selectedClient.company}` : ''}` : "Sélectionner un client"}
      </span>
    </Button>
  );
};

// Interface for the modal component
interface FullClientSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (client: Client) => void;
  clients: Client[];
}

// Modal component
const ClientSelectorModal: React.FC<FullClientSelectorProps> = ({
  isOpen,
  onClose,
  onSelect,
  clients
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg w-full max-w-md p-4 max-h-[80vh] overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Sélectionner un client</h2>
          <button onClick={onClose} className="text-gray-500">&times;</button>
        </div>
        
        <div className="space-y-2">
          {clients && clients.length > 0 ? (
            clients.map(client => (
              <div
                key={client.id}
                className="p-3 border rounded-md cursor-pointer hover:bg-muted transition-colors"
                onClick={() => onSelect(client)}
              >
                <div className="font-medium">{client.name}</div>
                {client.company && (
                  <div className="text-sm text-muted-foreground">{client.company}</div>
                )}
                <div className="text-sm text-muted-foreground">{client.email}</div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Aucun client disponible
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Export both components
export { ClientSelectorButton, ClientSelectorModal };

// Default export the button component
export default ClientSelectorButton;
