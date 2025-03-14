
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CardTitle, CardDescription, CardHeader, CardContent, CardFooter, Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from '@/context/AuthContext';
import Container from '@/components/layout/Container';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const navigate = useNavigate();
  const { signIn, session } = useAuth();

  useEffect(() => {
    // Check if we have a password reset token in the URL
    const hash = window.location.hash;
    if (hash && hash.includes('type=recovery')) {
      console.log("Password reset flow detected:", hash);
      
      // Extract the access token from the hash
      const hashParams = new URLSearchParams(hash.substring(1));
      const accessToken = hashParams.get('access_token');
      
      if (accessToken) {
        console.log("Reset token found. Entering password reset mode");
        setIsResetMode(true);
        setResetToken(accessToken);
      }
    } else if (session) {
      // Only redirect if we're not in a password reset flow
      console.log("User session found, redirecting to dashboard");
      navigate('/dashboard');
    }
  }, [session, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);
    try {
      const { error } = await signIn(email, password);
      if (error) {
        console.error('Error during login:', error);
        toast.error('Échec de la connexion : ' + (error.message || 'Erreur inconnue'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPassword || !confirmPassword) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }
    
    if (newPassword.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    
    setLoading(true);
    try {
      console.log("Attempting to update password with token");
      
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) {
        console.error('Error updating password:', error);
        toast.error('Échec de la mise à jour du mot de passe : ' + error.message);
      } else {
        toast.success('Votre mot de passe a été mis à jour avec succès');
        // Clear the hash to avoid re-entering reset flow on refresh
        window.location.hash = '';
        navigate('/login');
        setIsResetMode(false);
      }
    } catch (error: any) {
      console.error('Exception updating password:', error);
      toast.error('Erreur lors de la mise à jour du mot de passe : ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (isResetMode) {
    return (
      <Container>
        <div className="flex justify-center items-center min-h-[80vh]">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Réinitialisation du mot de passe</CardTitle>
              <CardDescription>Créez un nouveau mot de passe pour votre compte</CardDescription>
            </CardHeader>
            <form onSubmit={handlePasswordReset}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">Nouveau mot de passe</Label>
                  <Input 
                    id="new-password" 
                    type="password" 
                    placeholder="Entrez votre nouveau mot de passe" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
                  <Input 
                    id="confirm-password" 
                    type="password" 
                    placeholder="Confirmez votre nouveau mot de passe" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="flex justify-center items-center min-h-[80vh]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Connexion</CardTitle>
            <CardDescription>Connectez-vous à votre compte</CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="nom@exemple.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="password">Mot de passe</Label>
                  <Link 
                    to="/login" 
                    onClick={(e) => {
                      e.preventDefault();
                      if (email) {
                        setLoading(true);
                        supabase.auth.resetPasswordForEmail(email, {
                          redirectTo: `${window.location.origin}/login`
                        }).then(({ error }) => {
                          setLoading(false);
                          if (error) {
                            toast.error('Erreur: ' + error.message);
                          } else {
                            toast.success('Email de réinitialisation envoyé');
                          }
                        });
                      } else {
                        toast.error('Veuillez entrer votre email');
                      }
                    }} 
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Mot de passe oublié?
                  </Link>
                </div>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="Entrez votre mot de passe" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Connexion...' : 'Se connecter'}
              </Button>
              <div className="text-center text-sm">
                Vous n'avez pas de compte? <Link to="/signup" className="text-blue-600 hover:underline">S'inscrire</Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </Container>
  );
};

export default Login;
