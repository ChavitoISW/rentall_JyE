import React, { useState, useEffect } from 'react';
import Menu from './Menu';
import Footer from './Footer';
import Spinner from './Spinner';
import styles from '../styles/Inventario.module.css';

interface InventarioConsolidado {
  nombre_equipo: string;
  nombre_categoria?: string;
  total: number;
  disponible: number;
  reservado: number;
  asignado: number;
  en_recoleccion: number;
  en_mantenimiento: number;
  no_disponible: number;
}

const InventarioEquipos: React.FC = () => {
  const [inventario, setInventario] = useState<InventarioConsolidado[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchInventario();
  }, []);

  const fetchInventario = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/inventario/consolidado');
      const result = await response.json();
      setInventario(Array.isArray(result.data) ? result.data : []);
    } catch (error) {
      console.error('Error al cargar inventario:', error);
      setInventario([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredInventario = inventario
    .filter(item =>
      item.nombre_equipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.nombre_categoria?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      // Los equipos con cantidad no_disponible > 0 van al final
      const aNoDisp = a.no_disponible > 0 ? 1 : 0;
      const bNoDisp = b.no_disponible > 0 ? 1 : 0;
      
      if (aNoDisp !== bNoDisp) {
        return aNoDisp - bNoDisp;
      }
      
      // Si ambos tienen o no tienen no_disponibles, ordenar alfabéticamente
      return a.nombre_equipo.localeCompare(b.nombre_equipo);
    });

  // Calcular totales generales
  const totales = filteredInventario.reduce((acc, item) => ({
    total: acc.total + item.total,
    disponible: acc.disponible + item.disponible,
    reservado: acc.reservado + item.reservado,
    asignado: acc.asignado + item.asignado,
    en_recoleccion: acc.en_recoleccion + item.en_recoleccion,
    en_mantenimiento: acc.en_mantenimiento + item.en_mantenimiento,
    no_disponible: acc.no_disponible + item.no_disponible
  }), {
    total: 0,
    disponible: 0,
    reservado: 0,
    asignado: 0,
    en_recoleccion: 0,
    en_mantenimiento: 0,
    no_disponible: 0
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className={styles.container}>
      {isLoading && <Spinner />}
      <Menu />

      <main className={styles.main}>
        <div className={styles.header}>
          <div>
            <h1>📊 Inventario Consolidado de Equipos</h1>
            <p className={styles.subtitle}>Vista general del estado de todos los equipos</p>
          </div>
          <div className={styles.headerButtons}>
            <button className={styles.btnPrint} onClick={handlePrint}>
              🖨️ Imprimir
            </button>
            <button className={styles.btnRefresh} onClick={fetchInventario}>
              ↻ Actualizar
            </button>
          </div>
        </div>

        <div className={styles.searchBar}>
          <input
            type="text"
            placeholder="🔍 Buscar por nombre de equipo o categoría..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        {/* Resumen de totales */}
        <div className={styles.summaryCards}>
          <div className={styles.summaryCard}>
            <div className={styles.cardIcon}>📦</div>
            <div className={styles.cardContent}>
              <div className={styles.cardLabel}>Total Equipos</div>
              <div className={styles.cardValue}>{totales.total}</div>
            </div>
          </div>
          <div className={`${styles.summaryCard} ${styles.cardDisponible}`}>
            <div className={styles.cardIcon}>✓</div>
            <div className={styles.cardContent}>
              <div className={styles.cardLabel}>Disponibles</div>
              <div className={styles.cardValue}>{totales.disponible}</div>
            </div>
          </div>
          <div className={`${styles.summaryCard} ${styles.cardReservado}`}>
            <div className={styles.cardIcon}>⏳</div>
            <div className={styles.cardContent}>
              <div className={styles.cardLabel}>Reservados</div>
              <div className={styles.cardValue}>{totales.reservado}</div>
            </div>
          </div>
          <div className={`${styles.summaryCard} ${styles.cardAsignado}`}>
            <div className={styles.cardIcon}>👷</div>
            <div className={styles.cardContent}>
              <div className={styles.cardLabel}>Asignados</div>
              <div className={styles.cardValue}>{totales.asignado}</div>
            </div>
          </div>
        </div>
        
        <div className={styles.printHeader}>
          <h2>Toma de Inventario</h2>
          <p className={styles.printDate}>
            Fecha: {new Date().toLocaleDateString('es-ES', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
        <div className={styles.tableWrapper}>
          <table className={styles.inventoryTable}>
            <thead>
              <tr>
                <th className={styles.thEquipo}>Equipo</th>
                <th className={styles.thCategoria}>Categoría</th>
                <th className={styles.thTotal}>Total</th>
                <th className={styles.thDisponible}>Disponible</th>
                <th className={styles.thReservado}>Reservado</th>
                <th className={styles.thAsignado}>Asignado</th>
                <th className={styles.thRecoleccion}>En Recolección</th>
                <th className={styles.thMantenimiento}>En Mantenimiento</th>
                <th className={styles.thNoDisponible}>No Disponible</th>
              </tr>
            </thead>
            <tbody>
              {filteredInventario.length === 0 ? (
                <tr>
                  <td colSpan={9} className={styles.noData}>
                    <div className={styles.noDataContent}>
                      <div className={styles.noDataIcon}>📭</div>
                      <div>No se encontraron equipos en el inventario</div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredInventario.map((item, index) => (
                  <tr key={index} className={styles.tableRow}>
                    <td className={styles.tdEquipo}>{item.nombre_equipo}</td>
                    <td className={styles.tdCategoria}>
                      <span className={styles.badge}>{item.nombre_categoria || '-'}</span>
                    </td>
                    <td className={styles.tdTotal}>
                      <span className={styles.badgeTotal}>{item.total}</span>
                    </td>
                    <td className={styles.tdDisponible}>
                      {item.disponible > 0 ? (
                        <span className={styles.badgeDisponible}>{item.disponible}</span>
                      ) : (
                        <span className={styles.badgeEmpty}>-</span>
                      )}
                    </td>
                    <td className={styles.tdReservado}>
                      {item.reservado > 0 ? (
                        <span className={styles.badgeReservado}>{item.reservado}</span>
                      ) : (
                        <span className={styles.badgeEmpty}>-</span>
                      )}
                    </td>
                    <td className={styles.tdAsignado}>
                      {item.asignado > 0 ? (
                        <span className={styles.badgeAsignado}>{item.asignado}</span>
                      ) : (
                        <span className={styles.badgeEmpty}>-</span>
                      )}
                    </td>
                    <td className={styles.tdRecoleccion}>
                      {item.en_recoleccion > 0 ? (
                        <span className={styles.badgeRecoleccion}>{item.en_recoleccion}</span>
                      ) : (
                        <span className={styles.badgeEmpty}>-</span>
                      )}
                    </td>
                    <td className={styles.tdMantenimiento}>
                      {item.en_mantenimiento > 0 ? (
                        <span className={styles.badgeMantenimiento}>{item.en_mantenimiento}</span>
                      ) : (
                        <span className={styles.badgeEmpty}>-</span>
                      )}
                    </td>
                    <td className={styles.tdNoDisponible}>
                      {item.no_disponible > 0 ? (
                        <span className={styles.badgeNoDisponible}>{item.no_disponible}</span>
                      ) : (
                        <span className={styles.badgeEmpty}>-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className={styles.printSignature}>
          <p>Realizado por: _____________________________________</p>
        </div>

        <Footer />
      </main>
    </div>
  );
};

export default InventarioEquipos;
