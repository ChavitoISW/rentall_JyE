import React from 'react';
import Menu from './Menu';
import Footer from './Footer';
import { EstadoEquipo, EstadoEquipoLabels } from '../types/estadoEquipo';
import styles from '../styles/EstadoEquipo.module.css';

const EstadosEquipo: React.FC = () => {
  // Convertir el enum a un array para mostrar
  const estadosArray = Object.entries(EstadoEquipo)
    .filter(([key, value]) => typeof value === 'number')
    .map(([key, value]) => ({
      id: value,
      nombre: EstadoEquipoLabels[value as EstadoEquipo]
    }));

  return (
    <div className={styles.container}>
      <Menu />

      <main className={styles.main}>
        <div className={styles.header}>
          <h1>Estados de Equipos</h1>
          <p className={styles.subtitle}>
            Estados predefinidos del sistema (solo lectura)
          </p>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: '100px' }}>ID</th>
                <th>Nombre del Estado</th>
              </tr>
            </thead>
            <tbody>
              {estadosArray.map((estado) => (
                <tr key={estado.id}>
                  <td>{estado.id}</td>
                  <td>{estado.nombre}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Footer />
      </main>
    </div>
  );
};

export default EstadosEquipo;
