
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { updateUserAvatar, updateUserProfile } from "@/services/userService";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Mail, Upload } from "lucide-react";

const AccountSettings = () => {
  const { user, updateUserData } = useAuth();
  const [formData, setFormData] = useState({
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
    company: user?.company || "",
    title: user?.title || "",
    avatar_url: user?.avatar_url || ""
  });

  // Mettre à jour les données du formulaire lorsque l'utilisateur change
  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        company: user.company || "",
        title: user.title || "",
        avatar_url: user.avatar_url || ""
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value
    });
  };

  const handleSave = async () => {
    try {
      // Mettre à jour les données utilisateur via Auth
      await updateUserData({
        first_name: formData.first_name,
        last_name: formData.last_name,
        company: formData.company,
        title: formData.title
      });
      
      // Mettre à jour le profil dans la base de données
      if (user?.id) {
        await updateUserProfile(user.id, {
          first_name: formData.first_name,
          last_name: formData.last_name,
          company: formData.company,
          title: formData.title
        });
      }
      
      // Mettre à jour l'avatar séparément si l'URL a changé
      if (formData.avatar_url !== user?.avatar_url && formData.avatar_url.trim() !== '' && user?.id) {
        await updateUserAvatar(user.id, formData.avatar_url);
      }
      
      toast.success("Modifications enregistrées avec succès");
      
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
        <CardTitle>Mon profil</CardTitle>
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
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Changer d'avatar
            </Button>
            <div className="mt-2">
              <Label htmlFor="avatar_url">URL de l'avatar</Label>
              <Input 
                id="avatar_url" 
                placeholder="https://exemple.com/votre-avatar.jpg" 
                value={formData.avatar_url}
                onChange={handleChange}
                className="mt-1"
              />
            </div>
          </div>
        </div>

        <div className="bg-muted/50 p-4 rounded-lg flex items-center space-x-2">
          <Mail className="h-5 w-5 text-muted-foreground" />
          <div className="flex-1">
            <h4 className="text-sm font-medium">Email</h4>
            <p className="text-sm text-muted-foreground">Vous êtes connecté avec: <strong>{user?.email}</strong></p>
          </div>
          <Badge variant="outline" className="ml-auto">
            {user?.email_confirmed_at ? "Vérifiée" : "Non vérifiée"}
          </Badge>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2">
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
          <Label htmlFor="title">Titre professionnel</Label>
          <Input 
            id="title" 
            placeholder="Votre titre professionnel" 
            value={formData.title}
            onChange={handleChange}
          />
        </div>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row sm:justify-between space-y-4 sm:space-y-0">
        <div className="text-sm text-muted-foreground flex items-center">
          <AlertCircle className="h-4 w-4 mr-1" />
          Les modifications seront appliquées après actualisation
        </div>
        <div className="flex gap-2 w-full sm:w-auto justify-end">
          <Button variant="outline" onClick={() => window.location.reload()}>
            Annuler
          </Button>
          <Button onClick={handleSave}>
            Mettre à jour le profil
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default AccountSettings;
