
import React from "react";
import Container from "@/components/layout/Container";
import PageTransition from "@/components/layout/PageTransition";
import ITakecarePack from "@/components/packs/itakecare-pack";

const ClientITakecarePage = () => {
  return (
    <PageTransition>
      <Container>
        <ITakecarePack />
      </Container>
    </PageTransition>
  );
};

export default ClientITakecarePage;
