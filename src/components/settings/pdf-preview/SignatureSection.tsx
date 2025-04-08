
import React from "react";

interface SignatureSectionProps {
  pageHeight: number;
  scaleFactor?: number;
}

const SignatureSection: React.FC<SignatureSectionProps> = ({
  pageHeight,
  scaleFactor = 1
}) => {
  return (
    <div
      className="relative"
      style={{
        padding: `${10 * scaleFactor}px`,
        borderTop: `2px solid #E5E7EB`,
        borderColor: "#E5E7EB",
        backgroundColor: "rgba(255, 255, 255, 0.8)",
        marginTop: "10px"
      }}
    >
      <h3 
        className="text-center font-bold mb-2" 
        style={{ 
          fontSize: `${14 * scaleFactor}px`,
          color: "#1A2C3A",
          margin: `0 0 ${8 * scaleFactor}px 0`
        }}
      >
        Signature client
      </h3>
      <div
        className="border border-dashed rounded-md mx-auto flex items-center justify-center"
        style={{
          width: `${220 * scaleFactor}px`,
          height: `${70 * scaleFactor}px`,
          backgroundColor: "rgba(255, 255, 255, 0.9)",
          borderColor: "#94a3b8",
          borderRadius: "8px",
        }}
      >
        <p style={{ 
          color: "#9CA3AF", 
          fontSize: `${11 * scaleFactor}px`, 
          fontStyle: "italic",
          margin: 0
        }}>
          Signature précédée de "Bon pour accord"
        </p>
      </div>
    </div>
  );
};

export default SignatureSection;
