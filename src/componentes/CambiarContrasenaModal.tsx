import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import styles from '../styles/SolicitudEquipo.module.css';

interface CambiarContrasenaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CambiarContrasenaModal: React.FC<CambiarContrasenaModalProps> = ({ isOpen, onClose }) => {
  const { usuario } = useAuth();
  const [contrasenaActual, setContrasenaActual] = useState('');
  const [contrasenaNueva, setContrasenaNueva] = useState('');
  const [contrasenaConfirmar, setContrasenaConfirmar] = useState('');
  const [mostrarActual, setMostrarActual] = useState(false);
  const [mostrarNueva, setMostrarNueva] = useState(false);
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validaciones
    if (!contrasenaActual || !contrasenaNueva || !contrasenaConfirmar) {
      setError('Todos los campos son requeridos');
      return;
    }

    if (contrasenaNueva.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (contrasenaNueva !== contrasenaConfirmar) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (contrasenaActual === contrasenaNueva) {
      setError('La nueva contraseña debe ser diferente a la actual');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id_usuario: usuario?.id_usuario,
          contrasena_actual: contrasenaActual,
          contrasena_nueva: contrasenaNueva,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSuccess('Contraseña actualizada exitosamente');
        setTimeout(() => {
          handleClose();
        }, 2000);
      } else {
        setError(result.error || 'Error al cambiar la contraseña');
      }
    } catch (error) {
      console.error('Error al cambiar contraseña:', error);
      setError('Error de conexión');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setContrasenaActual('');
    setContrasenaNueva('');
    setContrasenaConfirmar('');
    setError('');
    setSuccess('');
    setMostrarActual(false);
    setMostrarNueva(false);
    setMostrarConfirmar(false);
    onClose();
  };

  return (
    <div className={styles.modalOverlay} onClick={handleClose} style={{ zIndex: 9999 }}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '550px' }}>
        <div className={styles.modalHeader}>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.8rem' }}>🔒</span>
            Cambiar Contraseña
          </h2>
          <button 
            className={styles.closeBtn} 
            onClick={handleClose}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div style={{ padding: '2rem' }}>
            {error && (
              <div style={{
                padding: '1rem 1.25rem',
                backgroundColor: '#fee',
                color: '#c33',
                borderRadius: '10px',
                marginBottom: '1.5rem',
                borderLeft: '4px solid #e74c3c',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                fontSize: '0.95rem',
                animation: 'shake 0.5s'
              }}>
                <span style={{ fontSize: '1.3rem' }}>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div style={{
                padding: '1rem 1.25rem',
                backgroundColor: '#d4edda',
                color: '#155724',
                borderRadius: '10px',
                marginBottom: '1.5rem',
                borderLeft: '4px solid #28a745',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                fontSize: '0.95rem'
              }}>
                <span style={{ fontSize: '1.3rem' }}>✓</span>
                <span>{success}</span>
              </div>
            )}

            <div className={styles.formGroup}>
              <label style={{ 
                fontWeight: 600, 
                marginBottom: '0.5rem',
                display: 'block',
                color: '#333',
                fontSize: '0.95rem'
              }}>
                Contraseña Actual *
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute',
                  left: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: '1.1rem',
                  opacity: 0.6
                }}>
                  🔐
                </span>
                <input
                  type={mostrarActual ? 'text' : 'password'}
                  value={contrasenaActual}
                  onChange={(e) => setContrasenaActual(e.target.value)}
                  disabled={isLoading || !!success}
                  required
                  placeholder="Ingrese su contraseña actual"
                  style={{
                    width: '100%',
                    padding: '0.875rem 3.5rem 0.875rem 3rem',
                    border: '2px solid #e0e0e0',
                    borderRadius: '10px',
                    fontSize: '1rem',
                    transition: 'all 0.3s',
                    backgroundColor: isLoading || success ? '#f5f5f5' : '#f8f9fa'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setMostrarActual(!mostrarActual)}
                  disabled={isLoading || !!success}
                  style={{
                    position: 'absolute',
                    right: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: isLoading || success ? 'not-allowed' : 'pointer',
                    fontSize: '1.3rem',
                    opacity: 0.6,
                    transition: 'opacity 0.2s'
                  }}
                >
                  {mostrarActual ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label style={{ 
                fontWeight: 600, 
                marginBottom: '0.5rem',
                display: 'block',
                color: '#333',
                fontSize: '0.95rem'
              }}>
                Nueva Contraseña *
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute',
                  left: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: '1.1rem',
                  opacity: 0.6
                }}>
                  🔑
                </span>
                <input
                  type={mostrarNueva ? 'text' : 'password'}
                  value={contrasenaNueva}
                  onChange={(e) => setContrasenaNueva(e.target.value)}
                  disabled={isLoading || !!success}
                  required
                  minLength={6}
                  placeholder="Mínimo 6 caracteres"
                  style={{
                    width: '100%',
                    padding: '0.875rem 3.5rem 0.875rem 3rem',
                    border: '2px solid #e0e0e0',
                    borderRadius: '10px',
                    fontSize: '1rem',
                    transition: 'all 0.3s',
                    backgroundColor: isLoading || success ? '#f5f5f5' : '#f8f9fa'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setMostrarNueva(!mostrarNueva)}
                  disabled={isLoading || !!success}
                  style={{
                    position: 'absolute',
                    right: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: isLoading || success ? 'not-allowed' : 'pointer',
                    fontSize: '1.3rem',
                    opacity: 0.6,
                    transition: 'opacity 0.2s'
                  }}
                >
                  {mostrarNueva ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label style={{ 
                fontWeight: 600, 
                marginBottom: '0.5rem',
                display: 'block',
                color: '#333',
                fontSize: '0.95rem'
              }}>
                Confirmar Nueva Contraseña *
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute',
                  left: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: '1.1rem',
                  opacity: 0.6
                }}>
                  ✓
                </span>
                <input
                  type={mostrarConfirmar ? 'text' : 'password'}
                  value={contrasenaConfirmar}
                  onChange={(e) => setContrasenaConfirmar(e.target.value)}
                  disabled={isLoading || !!success}
                  required
                  placeholder="Repita la nueva contraseña"
                  style={{
                    width: '100%',
                    padding: '0.875rem 3.5rem 0.875rem 3rem',
                    border: '2px solid #e0e0e0',
                    borderRadius: '10px',
                    fontSize: '1rem',
                    transition: 'all 0.3s',
                    backgroundColor: isLoading || success ? '#f5f5f5' : '#f8f9fa'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setMostrarConfirmar(!mostrarConfirmar)}
                  disabled={isLoading || !!success}
                  style={{
                    position: 'absolute',
                    right: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: isLoading || success ? 'not-allowed' : 'pointer',
                    fontSize: '1.3rem',
                    opacity: 0.6,
                    transition: 'opacity 0.2s'
                  }}
                >
                  {mostrarConfirmar ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            {contrasenaNueva && (
              <div style={{
                marginTop: '1rem',
                padding: '1rem',
                backgroundColor: contrasenaNueva.length >= 6 ? '#d4edda' : '#fff3cd',
                borderRadius: '8px',
                borderLeft: `4px solid ${contrasenaNueva.length >= 6 ? '#28a745' : '#ffc107'}`,
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <span style={{ fontSize: '1.2rem' }}>
                  {contrasenaNueva.length >= 6 ? '✓' : 'ℹ️'}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    color: contrasenaNueva.length >= 6 ? '#155724' : '#856404',
                    marginBottom: '0.25rem'
                  }}>
                    Requisitos de contraseña
                  </div>
                  <div style={{
                    fontSize: '0.85rem',
                    color: contrasenaNueva.length >= 6 ? '#155724' : '#856404'
                  }}>
                    {contrasenaNueva.length >= 6 ? '✓' : '○'} Mínimo 6 caracteres ({contrasenaNueva.length}/6)
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className={styles.modalActions} style={{ 
            borderTop: '1px solid #e0e0e0',
            padding: '1.5rem 2rem',
            backgroundColor: '#f8f9fa'
          }}>
            <button 
              type="button" 
              className={styles.btnCancel} 
              onClick={handleClose}
              disabled={isLoading}
              style={{
                padding: '0.875rem 2rem',
                fontSize: '0.95rem',
                fontWeight: 600,
                borderRadius: '8px'
              }}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className={styles.btnSubmit}
              disabled={isLoading || !!success}
              style={{
                padding: '0.875rem 2rem',
                fontSize: '0.95rem',
                fontWeight: 600,
                borderRadius: '8px',
                background: isLoading || success ? '#ccc' : 'linear-gradient(135deg, #4a90e2 0%, #2874d9 100%)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              {isLoading && (
                <span style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  borderTopColor: 'white',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite'
                }} />
              )}
              {isLoading ? 'Cambiando...' : success ? '✓ Cambiada' : 'Cambiar Contraseña'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CambiarContrasenaModal;
