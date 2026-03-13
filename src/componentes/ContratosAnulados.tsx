import React, { useState, useEffect } from 'react';
import Menu from './Menu';
import Footer from './Footer';
import Table, { Column } from './Table';
import Spinner from './Spinner';
import { EstadoContrato, EstadoContratoLabels, Contrato } from '../types/contrato';
import styles from '../styles/SolicitudEquipo.module.css';

interface ContratoAnulado extends Contrato {
  numero_contrato?: string;
  numero_solicitud_equipo?: string;
  nombre_cliente?: string;
  motivo_anulacion?: string;
  anulado_por?: string;
  fecha_anulacion?: string;
}

const ContratosAnulados: React.FC = () => {
  const [contratos, setContratos] = useState<ContratoAnulado[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchContratosAnulados();
  }, []);

  const fetchContratosAnulados = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/contrato/anulados');
      if (response.ok) {
        const result = await response.json();
        setContratos(Array.isArray(result.data) ? result.data : []);
      } else {
        console.error('Error al obtener contratos anulados');
        setContratos([]);
      }
    } catch (error) {
      console.error('Error al cargar contratos anulados:', error);
      setContratos([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredContratos = contratos.filter(contrato =>
    contrato.numero_contrato?.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
    contrato.numero_solicitud_equipo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contrato.nombre_cliente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contrato.motivo_anulacion?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns: Column<ContratoAnulado>[] = [
    {
      key: 'numero_contrato',
      header: 'N° Contrato',
      render: (contrato) => contrato.numero_contrato || 'N/A',
    },
    {
      key: 'numero_solicitud_equipo',
      header: 'N° Solicitud',
      render: (contrato) => contrato.numero_solicitud_equipo || 'N/A',
    },
    {
      key: 'nombre_cliente',
      header: 'Cliente',
      render: (contrato) => contrato.nombre_cliente || 'N/A',
    },
    {
      key: 'created_at',
      header: 'Fecha Generación',
      render: (contrato) => {
        if (!contrato.created_at) return 'N/A';
        return new Date(contrato.created_at).toLocaleDateString('es-CR', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        });
      },
    },
    {
      key: 'fecha_anulacion',
      header: 'Fecha Anulación',
      render: (contrato) => {
        if (!contrato.fecha_anulacion) return 'N/A';
        return new Date(contrato.fecha_anulacion).toLocaleDateString('es-CR', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
      },
    },
    {
      key: 'motivo_anulacion',
      header: 'Motivo',
      render: (contrato) => (
        <span title={contrato.motivo_anulacion || 'Sin motivo'}>
          {contrato.motivo_anulacion 
            ? contrato.motivo_anulacion.length > 50 
              ? `${contrato.motivo_anulacion.substring(0, 50)}...`
              : contrato.motivo_anulacion
            : 'Sin motivo'}
        </span>
      ),
    },
    {
      key: 'anulado_por',
      header: 'Anulado Por',
      render: (contrato) => contrato.anulado_por || 'N/A',
    },
  ];

  return (
    <div className={styles.container}>
      <Menu />
      <div className={styles.content}>
        <div className={styles.header}>
          <h1>📋 Contratos Anulados</h1>
        </div>

        <div className={styles.controls}>
          <input
            type="text"
            placeholder="Buscar por N° Contrato, N° Solicitud, Cliente o Motivo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        {isLoading ? (
          <Spinner />
        ) : (
          <>
            <div style={{ marginBottom: '1rem', color: '#666' }}>
              Total de contratos anulados: <strong>{filteredContratos.length}</strong>
            </div>
            <Table
              data={filteredContratos}
              columns={columns}
              actions={[]}
              keyExtractor={(contrato) => contrato.id_contrato?.toString() || ''}
            />
            {filteredContratos.length === 0 && !isLoading && (
              <div style={{ 
                textAlign: 'center', 
                padding: '2rem', 
                color: '#666',
                fontSize: '1.1rem'
              }}>
                {searchTerm 
                  ? '🔍 No se encontraron contratos anulados con ese criterio de búsqueda'
                  : '✅ No hay contratos anulados'}
              </div>
            )}
          </>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default ContratosAnulados;
