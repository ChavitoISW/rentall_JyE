import React from 'react';
import styles from '../styles/EnvironmentBanner.module.css';

const EnvironmentBanner: React.FC = () => {
  // Detectar si estamos en ambiente de pruebas
  const isTestEnvironment = process.env.NEXT_PUBLIC_ENV === 'test' || 
                           process.env.NODE_ENV === 'test' ||
                           (typeof window !== 'undefined' && window.location.port === '3002');

  // No mostrar nada en producción
  if (!isTestEnvironment) {
    return null;
  }

  return (
    <div className={styles.environmentBanner}>
      <div className={styles.bannerContent}>
        <span className={styles.warningIcon}>⚠️</span>
        <span className={styles.bannerText}>
          <strong>AMBIENTE DE PRUEBAS</strong> - Los cambios aquí NO afectan la base de datos de producción
        </span>
        <span className={styles.testBadge}>TEST</span>
      </div>
    </div>
  );
};

export default EnvironmentBanner;
