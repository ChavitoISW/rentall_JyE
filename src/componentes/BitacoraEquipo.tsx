import React, { useState, useEffect } from 'react';
import Menu from './Menu';
import Footer from './Footer';
import Table, { Column } from './Table';
import Spinner from './Spinner';
import styles from '../styles/SolicitudEquipo.module.css';
import bitacoraStyles from '../styles/BitacoraEquipo.module.css';

interface BitacoraEquipo {
  id_bitacora: number;
  id_equipo: number;
  nombre_equipo: string;
  id_solicitud_equipo: number;
  numero_solicitud_equipo: string;
  cantidad_equipo: number;
  fecha_inicio: string;
  fecha_devolucion: string | null;
  estado_uso: string;
  estado_bitacora: number;
  observaciones: string;
  nombre_cliente: string;
  id_contrato: number | null;
  created_at: string;
}

interface Equipo {
  id_equipo: number;
  nombre_equipo: string;
  nombre_categoria: string;
}

const BitacoraEquipo: React.FC = () => {
  const [bitacora, setBitacora] = useState<BitacoraEquipo[]>([]);
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [selectedEquipo, setSelectedEquipo] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchEquipos();
  }, []);

  const fetchEquipos = async () => {
    try {
      const response = await fetch('/api/bitacora-equipo/equipos');
      const result = await response.json();
      setEquipos(Array.isArray(result.data) ? result.data : []);
    } catch (error) {
      console.error('Error al cargar equipos:', error);
      setEquipos([]);
    }
  };

  const fetchBitacora = async (id_equipo: number) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/bitacora-equipo?id_equipo=${id_equipo}`);
      const result = await response.json();
      setBitacora(Array.isArray(result.data) ? result.data : []);
    } catch (error) {
      console.error('Error al cargar bitácora:', error);
      setBitacora([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEquipoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = parseInt(e.target.value);
    setSelectedEquipo(id);
    if (id) {
      fetchBitacora(id);
    } else {
      setBitacora([]);
    }
  };

  const filteredBitacora = bitacora.filter(item => item.estado_bitacora !== 0);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    
    const fechaParte = dateString.includes('T') ? dateString.split('T')[0] : dateString.split(' ')[0];
    const partes = fechaParte.split('-');
    
    if (partes.length !== 3) return dateString;
    
    const [year, month, day] = partes;
    const dayStr = day.padStart(2, '0');
    const monthStr = month.padStart(2, '0');
    return `${dayStr}/${monthStr}/${year}`;
  };

  const getEstadoBadge = (estado: string) => {
    let className = styles.statusActive;
    
    switch(estado) {
      case 'En uso':
        className = styles.statusActive;
        break;
      case 'Programado':
        className = styles.statusSuccess;
        break;
      case 'Devuelto':
        className = styles.statusInactive;
        break;
    }

    return <span className={className}>{estado}</span>;
  };

  const columns: Column<BitacoraEquipo>[] = [
    {
      key: 'nombre_equipo',
      header: 'Equipo',
      width: '200px'
    },
    {
      key: 'nombre_cliente',
      header: 'Cliente',
      width: '200px'
    },
    {
      key: 'numero_solicitud_equipo',
      header: 'N° Solicitud',
      width: '130px',
      render: (item) => (
        <a 
          href={`/solicitudes-equipos?numero=${item.numero_solicitud_equipo}`}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.linkSolicitud}
        >
          {item.numero_solicitud_equipo}
        </a>
      )
    },
    {
      key: 'id_contrato',
      header: '# Contrato',
      width: '110px',
      render: (item) => item.id_contrato ? `#${item.id_contrato}` : '-'
    },
    {
      key: 'cantidad_equipo',
      header: 'Cantidad',
      width: '100px',
      render: (item) => <span style={{ fontWeight: '600' }}>{item.cantidad_equipo}</span>
    },
    {
      key: 'fecha_inicio',
      header: 'Fecha Inicio',
      width: '140px',
      render: (item) => formatDate(item.fecha_inicio)
    },
    {
      key: 'fecha_devolucion',
      header: 'Fecha Devolución',
      width: '150px',
      render: (item) => formatDate(item.fecha_devolucion)
    },
    {
      key: 'estado_uso',
      header: 'Estado',
      width: '130px',
      render: (item) => getEstadoBadge(item.estado_uso)
    },
    {
      key: 'observaciones',
      header: 'Observaciones',
      render: (item) => item.observaciones || '-'
    }
  ];

  return (
    <div className={styles.container}>
      {isLoading && <Spinner />}
      <Menu />

      <main className={styles.main}>
        <div className={styles.header}>
          <div>
            <h1>📋 Bitácora de Equipos</h1>
            <p className={bitacoraStyles.subtitle} style={{ color: 'white' }}>Historial de uso y asignación de equipos</p>
          </div>
          {selectedEquipo && (
            <button className={styles.btnEdit} onClick={() => fetchBitacora(selectedEquipo)}>
              ↻ Actualizar
            </button>
          )}
        </div>

        <div className={bitacoraStyles.selectorBar}>
          <label htmlFor="equipoSelector" className={bitacoraStyles.selectorLabel}>
            Seleccionar Equipo:
          </label>
          <select
            id="equipoSelector"
            value={selectedEquipo || ''}
            onChange={handleEquipoChange}
            className={styles.searchInput}
            style={{ width: '400px' }}
          >
            <option value="">-- Seleccione un equipo --</option>
            {equipos.map((equipo) => (
              <option key={equipo.id_equipo} value={equipo.id_equipo}>
                {equipo.nombre_equipo} ({equipo.nombre_categoria})
              </option>
            ))}
          </select>
        </div>

        {!selectedEquipo ? (
          <div className={bitacoraStyles.emptyState}>
            <div className={bitacoraStyles.emptyIcon}>🔍</div>
            <h2>Seleccione un equipo para ver su bitácora</h2>
            <p>Utilice el selector arriba para elegir un equipo y visualizar su historial de uso</p>
          </div>
        ) : (
          <>
            <Table
              columns={columns}
              data={filteredBitacora}
              keyExtractor={(item) => item.id_bitacora}
              noDataMessage="No se encontraron registros en la bitácora"
              itemsPerPage={15}
            />
          </>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default BitacoraEquipo;
