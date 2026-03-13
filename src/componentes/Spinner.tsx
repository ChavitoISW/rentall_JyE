import React from 'react';
import styles from '../styles/Spinner.module.css';

const Spinner: React.FC = () => {
  return (
    <div className={styles.spinnerOverlay}>
      <div className={styles.spinner}>
        <div className={styles.loaderContainer}>
          <div className={styles.circleSpinner}>
            <div className={styles.segment}></div>
            <div className={styles.segment}></div>
            <div className={styles.segment}></div>
            <div className={styles.segment}></div>
            <div className={styles.segment}></div>
            <div className={styles.segment}></div>
          </div>
        </div>
        <p className={styles.spinnerText}>Cargando...</p>
      </div>
    </div>
  );
};

export default Spinner;
