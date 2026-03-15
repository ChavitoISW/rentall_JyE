import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import OrdenesCambio from '../componentes/OrdenesCambio';

const OrdenesCambioPage: React.FC = () => {
  const { usuario } = useAuth();

  if (!usuario) {
    return <div>Cargando...</div>;
  }

  return <OrdenesCambio />;
};

export default OrdenesCambioPage;
