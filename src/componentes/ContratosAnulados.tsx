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

  // Formatear fecha sin depender del locale del navegador
  // Formato: dd/mm/yyyy
  const formatearFecha = (fechaStr: string): string => {
    if (!fechaStr) return 'N/A';
    
    const fechaParte = fechaStr.includes('T') ? fechaStr.split('T')[0] : fechaStr.split(' ')[0];
    const partes = fechaParte.split('-');
    
    if (partes.length !== 3) return fechaStr;
    
    const [year, month, day] = partes;
    const dayStr = day.padStart(2, '0');
    const monthStr = month.padStart(2, '0');
    return `${dayStr}/${monthStr}/${year}`;
  };

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
      key: 'id_contrato',
      header: '# Contrato',
      width: '120px',
      render: (contrato) => `#${contrato.id_contrato}`
    },
    {
      key: 'numero_solicitud_equipo',
      header: 'Solicitud',
      width: '140px',
      render: (c) => (
        <a 
          href={`/solicitudes-equipos?numero=${c.numero_solicitud_equipo}`}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.linkSolicitud}
        >
          {c.numero_solicitud_equipo || 'N/A'}
        </a>
      )
    },
    {
      key: 'nombre_cliente',
      header: 'Cliente',
      width: '220px'
    },
    {
      key: 'created_at',
      header: 'Fecha Generación',
      width: '140px',
      render: (contrato) => {
        if (!contrato.created_at) return 'N/A';
        return formatearFecha(contrato.created_at);
      },
    },
    {
      key: 'fecha_anulacion',
      header: 'Fecha Anulación',
      width: '140px',
      render: (contrato) => {
        if (!contrato.fecha_anulacion) return 'N/A';
        return formatearFecha(contrato.fecha_anulacion);
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
      width: '150px',
      render: (contrato) => contrato.anulado_por || 'N/A',
    },
  ];

  return (
    <div className={styles.container}>
      {isLoading && <Spinner />}
      <Menu />

      <main className={styles.main}>
        <div className={styles.header}>
          <h1>Contratos Anulados</h1>
        </div>

        <div className={styles.searchBar}>
          <input
            type="text"
            placeholder="Buscar contratos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <Table
          columns={columns}
          data={filteredContratos}
          actions={[]}
          keyExtractor={(c) => c.id_contrato!}
          noDataMessage="No se encontraron contratos anulados"
        />
      </main>

      <Footer />
    </div>
  );
};

export default ContratosAnulados;
