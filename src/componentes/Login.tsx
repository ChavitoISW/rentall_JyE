import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import Image from 'next/image';
import styles from '../styles/Login.module.css';

const Login: React.FC = () => {
  const [identificacion, setIdentificacion] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mostrarContrasena, setMostrarContrasena] = useState(false);

  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!identificacion || !contrasena) {
      setError('Por favor complete todos los campos');
      return;
    }

    setIsLoading(true);

    const result = await login(identificacion, contrasena);

    setIsLoading(false);

    if (result.success) {
      router.push('/');
    } else {
      setError(result.error || 'Error al iniciar sesión');
      setContrasena('');
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
        <div className={styles.loginHeader}>
          <div className={styles.logo}>
            <h1>RentAll</h1>
          </div>
          <div className={styles.logoImage}>
            <img 
              src="/assets/logo.png" 
              alt="RentAll Logo" 
              width={280} 
              height={160}
            />
          </div>
          <p>Ingrese sus credenciales para acceder al sistema</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.loginForm}>
          {error && (
            <div className={styles.errorMessage}>
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <div className={styles.formGroup}>
            <label htmlFor="identificacion">Identificación</label>
            <div className={styles.inputWrapper}>
              <span className={styles.inputIcon}>👤</span>
              <input
                id="identificacion"
                type="text"
                placeholder="Ingrese su identificación"
                value={identificacion}
                onChange={(e) => setIdentificacion(e.target.value)}
                disabled={isLoading}
                autoFocus
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="contrasena">Contraseña</label>
            <div className={styles.inputWrapper}>
              <span className={styles.inputIcon}>🔒</span>
              <input
                id="contrasena"
                type={mostrarContrasena ? 'text' : 'password'}
                placeholder="Ingrese su contraseña"
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                disabled={isLoading}
              />
              <button
                type="button"
                className={styles.togglePassword}
                onClick={() => setMostrarContrasena(!mostrarContrasena)}
                disabled={isLoading}
              >
                {mostrarContrasena ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className={styles.loginButton}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className={styles.spinner}></span>
                Iniciando sesión...
              </>
            ) : (
              'Iniciar Sesión'
            )}
          </button>
        </form>

        <div className={styles.loginFooter}>
          <p>Sistema de Gestión de Alquiler de Equipos</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
