
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { updateUserAvatar } from "@/services/userService";

const AccountSettings = () => {
  const { user, updateUserData } = useAuth();
  const [formData, setFormData] = useState({
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
    company: user?.company || "",
    title: user?.title || "",
    avatar_url: user?.avatar_url || ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value
    });
  };

  const handleSave = async () => {
    try {
      await updateUserData({
        first_name: formData.first_name,
        last_name: formData.last_name,
        company: formData.company,
        title: formData.title
      });
      
      // Mettre à jour l'avatar séparément si l'URL a changé
      if (formData.avatar_url !== user?.avatar_url && formData.avatar_url.trim() !== '') {
        await updateUserAvatar(user?.id || '', formData.avatar_url);
      }
      
      toast.success("Modifications enregistrées");
      
      // Actualiser la page pour que les changements soient visibles immédiatement
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error("Erreur lors de l'enregistrement du profil:", error);
      toast.error("Erreur lors de l'enregistrement du profil");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Paramètres du compte</CardTitle>
        <CardDescription>
          Gérez les informations de votre compte
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col items-center space-y-4 sm:items-start sm:flex-row sm:space-y-0 sm:space-x-4 mb-4">
          <Avatar className="h-20 w-20">
            {formData.avatar_url ? (
              <AvatarImage src={formData.avatar_url} alt={`${formData.first_name || ''} ${formData.last_name || ''}`} />
            ) : (
              <AvatarFallback className="text-xl">
                {formData.first_name?.[0] || ''}{formData.last_name?.[0] || ''}
              </AvatarFallback>
            )}
          </Avatar>
          <div className="space-y-2 flex-1">
            <Label htmlFor="avatar_url">URL de l'avatar</Label>
            <Input 
              id="avatar_url" 
              placeholder="https://exemple.com/votre-avatar.jpg" 
              value={formData.avatar_url}
              onChange={handleChange}
            />
            <p className="text-xs text-muted-foreground">
              Entrez l'URL complète d'une image pour votre avatar. Formats recommandés: JPG, PNG (carré).
            </p>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="first_name">Prénom</Label>
          <Input 
            id="first_name" 
            placeholder="Votre prénom" 
            value={formData.first_name}
            onChange={handleChange}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="last_name">Nom</Label>
          <Input 
            id="last_name" 
            placeholder="Votre nom" 
            value={formData.last_name}
            onChange={handleChange}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="company">Entreprise</Label>
          <Input 
            id="company" 
            placeholder="Votre entreprise" 
            value={formData.company}
            onChange={handleChange}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="title">Titre (affiché sous votre avatar)</Label>
          <Input 
            id="title" 
            placeholder="Votre titre" 
            value={formData.title}
            onChange={handleChange}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={user?.email} disabled />
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSave}>
          Enregistrer
        </Button>
      </CardFooter>
    </Card>
  );
};

export default AccountSettings;
