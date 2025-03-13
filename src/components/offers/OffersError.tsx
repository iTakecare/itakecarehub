
import React from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Container from "@/components/layout/Container";
import PageTransition from "@/components/layout/PageTransition";

interface OffersErrorProps {
  errorMessage: string;
  onRetry: () => void;
}

const OffersError = ({ errorMessage, onRetry }: OffersErrorProps) => {
  return (
    <PageTransition>
      <Container>
        <div className="flex h-[40vh] items-center justify-center">
          <div className="flex flex-col items-center space-y-3">
            <div className="rounded-full bg-red-100 p-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
            </div>
            <p className="text-base font-medium">{errorMessage}</p>
            <Button onClick={onRetry} size="sm">
              Réessayer
            </Button>
          </div>
        </div>
      </Container>
    </PageTransition>
  );
};

export default OffersError;
