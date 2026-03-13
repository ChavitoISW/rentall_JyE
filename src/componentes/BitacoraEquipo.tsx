import React, { useState, useEffect } from 'react';
import Menu from './Menu';
import Footer from './Footer';
import Spinner from './Spinner';
import styles from '../styles/BitacoraEquipo.module.css';

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
  const [searchTerm, setSearchTerm] = useState('');

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
    setSearchTerm('');
    if (id) {
      fetchBitacora(id);
    } else {
      setBitacora([]);
    }
  };

  const filteredBitacora = bitacora.filter(item =>
    item.nombre_equipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.numero_solicitud_equipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.nombre_cliente.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  const getEstadoBadge = (estado: string) => {
    const badgeClass = {
      'En uso': styles.badgeEnUso,
      'Programado': styles.badgeProgramado,
      'Devuelto': styles.badgeDevuelto
    }[estado] || '';

    return <span className={`${styles.badge} ${badgeClass}`}>{estado}</span>;
  };

  return (
    <div className={styles.container}>
      {isLoading && <Spinner />}
      <Menu />

      <main className={styles.main}>
        <div className={styles.header}>
          <div>
            <h1>📋 Bitácora de Equipos</h1>
            <p className={styles.subtitle}>Historial de uso y asignación de equipos</p>
          </div>
          {selectedEquipo && (
            <button className={styles.btnRefresh} onClick={() => fetchBitacora(selectedEquipo)}>
              ↻ Actualizar
            </button>
          )}
        </div>

        <div className={styles.selectorBar}>
          <label htmlFor="equipoSelector" className={styles.selectorLabel}>
            Seleccionar Equipo:
          </label>
          <select
            id="equipoSelector"
            value={selectedEquipo || ''}
            onChange={handleEquipoChange}
            className={styles.equipoSelector}
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
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🔍</div>
            <h2>Seleccione un equipo para ver su bitácora</h2>
            <p>Utilice el selector arriba para elegir un equipo y visualizar su historial de uso</p>
          </div>
        ) : (
          <>
            <div className={styles.searchBar}>
              <input
                type="text"
                placeholder="🔍 Buscar por solicitud o cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.searchInput}
              />
            </div>

        <div className={styles.summaryCards}>
          <div className={styles.summaryCard}>
            <div className={styles.cardIcon}>📦</div>
            <div className={styles.cardContent}>
              <div className={styles.cardLabel}>Total Registros</div>
              <div className={styles.cardValue}>{bitacora.length}</div>
            </div>
          </div>
          <div className={`${styles.summaryCard} ${styles.cardEnUso}`}>
            <div className={styles.cardIcon}>🔧</div>
            <div className={styles.cardContent}>
              <div className={styles.cardLabel}>En Uso</div>
              <div className={styles.cardValue}>
                {bitacora.filter(b => b.estado_uso === 'En uso').length}
              </div>
            </div>
          </div>
          <div className={`${styles.summaryCard} ${styles.cardProgramado}`}>
            <div className={styles.cardIcon}>📅</div>
            <div className={styles.cardContent}>
              <div className={styles.cardLabel}>Programado</div>
              <div className={styles.cardValue}>
                {bitacora.filter(b => b.estado_uso === 'Programado').length}
              </div>
            </div>
          </div>
          <div className={`${styles.summaryCard} ${styles.cardDevuelto}`}>
            <div className={styles.cardIcon}>✓</div>
            <div className={styles.cardContent}>
              <div className={styles.cardLabel}>Devueltos</div>
              <div className={styles.cardValue}>
                {bitacora.filter(b => b.estado_uso === 'Devuelto').length}
              </div>
            </div>
          </div>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.bitacoraTable}>
            <thead>
              <tr>
                <th>Equipo</th>
                <th>Cliente</th>
                <th>N° Solicitud</th>
                <th>Cantidad</th>
                <th>Fecha Inicio</th>
                <th>Fecha Devolución</th>
                <th>Estado</th>
                <th>Observaciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredBitacora.length === 0 ? (
                <tr>
                  <td colSpan={8} className={styles.noData}>
                    <div className={styles.noDataContent}>
                      <div className={styles.noDataIcon}>📭</div>
                      <div>No se encontraron registros en la bitácora</div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredBitacora.map((item) => (
                  <tr key={item.id_bitacora} className={styles.tableRow}>
                    <td className={styles.tdEquipo}>{item.nombre_equipo}</td>
                    <td className={styles.tdCliente}>{item.nombre_cliente}</td>
                    <td className={styles.tdSolicitud}>{item.numero_solicitud_equipo}</td>
                    <td className={styles.tdCantidad}>{item.cantidad_equipo}</td>
                    <td className={styles.tdFecha}>{formatDate(item.fecha_inicio)}</td>
                    <td className={styles.tdFecha}>{formatDate(item.fecha_devolucion)}</td>
                    <td className={styles.tdEstado}>{getEstadoBadge(item.estado_uso)}</td>
                    <td className={styles.tdObservaciones}>
                      {item.observaciones || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default BitacoraEquipo;
