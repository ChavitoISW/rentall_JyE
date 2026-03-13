import React from 'react';
import styles from '../styles/ConfirmDialog.module.css';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: 'danger' | 'warning' | 'info';
  showCancel?: boolean; // Nueva propiedad para controlar si se muestra el botón cancelar
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
  type = 'warning',
  showCancel = true // Por defecto muestra ambos botones
}) => {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={showCancel ? onCancel : undefined}>
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <div className={`${styles.header} ${styles[type]}`}>
          <h2>{title}</h2>
        </div>
        
        <div className={styles.body}>
          <p>{message}</p>
        </div>
        
        <div className={styles.footer}>
          {showCancel && (
            <button 
              className={styles.btnCancel} 
              onClick={onCancel}
            >
              {cancelText}
            </button>
          )}
          <button 
            className={`${styles.btnConfirm} ${styles[`btn${type.charAt(0).toUpperCase() + type.slice(1)}`]}`}
            onClick={() => {
              onConfirm();
              onCancel();
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
