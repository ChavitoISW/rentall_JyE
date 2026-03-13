import React from 'react';
import styles from '../styles/Footer.module.css';

const Footer: React.FC = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <p className={styles.text}>
          © 2026 RentAll. Todos los derechos reservados.  Desarrollado por BraJos Soft®
        </p>
      </div>
    </footer>
  );
};

export default Footer;
