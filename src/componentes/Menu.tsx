import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import CambiarContrasenaModal from './CambiarContrasenaModal';
import EnvironmentBanner from './EnvironmentBanner';
import styles from '../styles/Menu.module.css';

const Menu: React.FC = () => {
  const { usuario, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isEquiposDropdownOpen, setIsEquiposDropdownOpen] = useState(false);
  const [isConfigDropdownOpen, setIsConfigDropdownOpen] = useState(false);
  const [isInventarioDropdownOpen, setIsInventarioDropdownOpen] = useState(false);
  const [isRutasDropdownOpen, setIsRutasDropdownOpen] = useState(false);
  const [isContratosDropdownOpen, setIsContratosDropdownOpen] = useState(false);
  const [isPagosDropdownOpen, setIsPagosDropdownOpen] = useState(false);
  const [isReportesDropdownOpen, setIsReportesDropdownOpen] = useState(false);
  const [isRHDropdownOpen, setIsRHDropdownOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);

  const equiposDropdownRef = useRef<HTMLLIElement>(null);
  const configDropdownRef = useRef<HTMLLIElement>(null);
  const inventarioDropdownRef = useRef<HTMLLIElement>(null);
  const rutasDropdownRef = useRef<HTMLLIElement>(null);
  const contratosDropdownRef = useRef<HTMLLIElement>(null);
  const pagosDropdownRef = useRef<HTMLLIElement>(null);
  const reportesDropdownRef = useRef<HTMLLIElement>(null);
  const rhDropdownRef = useRef<HTMLLIElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const toggleEquiposDropdown = () => {
    setIsEquiposDropdownOpen(!isEquiposDropdownOpen);
  };

  const toggleConfigDropdown = () => {
    setIsConfigDropdownOpen(!isConfigDropdownOpen);
  };

  const toggleInventarioDropdown = () => {
    setIsInventarioDropdownOpen(!isInventarioDropdownOpen);
  };

  const toggleRutasDropdown = () => {
    setIsRutasDropdownOpen(!isRutasDropdownOpen);
  };

  const toggleContratosDropdown = () => {
    setIsContratosDropdownOpen(!isContratosDropdownOpen);
  };

  const togglePagosDropdown = () => {
    setIsPagosDropdownOpen(!isPagosDropdownOpen);
  };

  const toggleReportesDropdown = () => {
    setIsReportesDropdownOpen(!isReportesDropdownOpen);
  };

  const toggleRHDropdown = () => {
    setIsRHDropdownOpen(!isRHDropdownOpen);
  };

  const toggleUserDropdown = () => {
    setIsUserDropdownOpen(!isUserDropdownOpen);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        equiposDropdownRef.current &&
        !equiposDropdownRef.current.contains(event.target as Node)
      ) {
        setIsEquiposDropdownOpen(false);
      }
      if (
        configDropdownRef.current &&
        !configDropdownRef.current.contains(event.target as Node)
      ) {
        setIsConfigDropdownOpen(false);
      }
      if (
        inventarioDropdownRef.current &&
        !inventarioDropdownRef.current.contains(event.target as Node)
      ) {
        setIsInventarioDropdownOpen(false);
      }
      if (
        rutasDropdownRef.current &&
        !rutasDropdownRef.current.contains(event.target as Node)
      ) {
        setIsRutasDropdownOpen(false);
      }
      if (
        contratosDropdownRef.current &&
        !contratosDropdownRef.current.contains(event.target as Node)
      ) {
        setIsContratosDropdownOpen(false);
      }
      if (
        pagosDropdownRef.current &&
        !pagosDropdownRef.current.contains(event.target as Node)
      ) {
        setIsPagosDropdownOpen(false);
      }
      if (
        reportesDropdownRef.current &&
        !reportesDropdownRef.current.contains(event.target as Node)
      ) {
        setIsReportesDropdownOpen(false);
      }
      if (
        rhDropdownRef.current &&
        !rhDropdownRef.current.contains(event.target as Node)
      ) {
        setIsRHDropdownOpen(false);
      }
      if (
        userDropdownRef.current &&
        !userDropdownRef.current.contains(event.target as Node)
      ) {
        setIsUserDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <>
    <nav className={styles.menu}>
      <div className={styles.menuContainer}>       

        <button className={styles.hamburger} onClick={toggleMenu}>
          <span></span>
          <span></span>
          <span></span>
        </button>

        <ul className={`${styles.menuList} ${isOpen ? styles.menuOpen : ''}`}>
          {usuario?.usuario_rol !== 4 && usuario?.usuario_rol !== 5 && (
            <li className={styles.menuItem}>
              <Link href="/">Inicio</Link>
            </li>
          )}
          {usuario?.usuario_rol !== 4 && usuario?.usuario_rol !== 5 && (
            <li className={styles.menuItem}>
              <Link href="/clientes">Clientes</Link>
            </li>
          )}
          {usuario?.usuario_rol !== 4 && usuario?.usuario_rol !== 5 && (
            <li className={styles.menuItem}>
              <Link href="/solicitudes-equipos">Solicitudes</Link>
            </li>
          )}

          {usuario?.usuario_rol !== 4 && usuario?.usuario_rol !== 5 && (
            <li className={`${styles.menuItem} ${styles.dropdown}`} ref={contratosDropdownRef}>
              <button 
                className={styles.dropdownToggle} 
                onClick={toggleContratosDropdown}
              >
                Contratos
                <span className={styles.dropdownArrow}>▼</span>
              </button>
              {isContratosDropdownOpen && (
                <ul className={styles.dropdownMenu}>
                  <li className={styles.dropdownItem}>
                    <Link href="/contratos">Contratos</Link>
                  </li>
                  <li className={styles.dropdownItem}>
                    <Link href="/contratos-anulados">Contratos Anulados</Link>
                  </li>
                </ul>
              )}
            </li>
          )}
          
          {/* Dropdown Pagos - visible para roles no 5 (Chofer) */}
          {usuario?.usuario_rol !== 5 && (
            <li className={`${styles.menuItem} ${styles.dropdown}`} ref={pagosDropdownRef}>
              <button 
                className={styles.dropdownToggle} 
                onClick={togglePagosDropdown}
              >
                Pagos
                <span className={styles.dropdownArrow}>▼</span>
              </button>
              {isPagosDropdownOpen && (
                <ul className={styles.dropdownMenu}>
                  <li className={styles.dropdownItem}>
                    <Link href="/control-pagos">Control de Pagos</Link>
                  </li>
                  <li className={styles.dropdownItem}>
                    <Link href="/control-facturacion">Control de Facturación</Link>
                  </li>
                </ul>
              )}
            </li>
          )}

          {/* Hojas de Ruta - visible para rol 5 (Chofer) */}
          {usuario?.usuario_rol === 5 && (
            <li className={styles.menuItem}>
              <Link href="/hojas-ruta">Hojas de Ruta</Link>
            </li>
          )}

          {usuario?.usuario_rol !== 4 && usuario?.usuario_rol !== 5 && (
            <li className={`${styles.menuItem} ${styles.dropdown}`} ref={rutasDropdownRef}>
              <button 
                className={styles.dropdownToggle} 
                onClick={toggleRutasDropdown}
              >
                Rutas y Logística
                <span className={styles.dropdownArrow}>▼</span>
              </button>
              {isRutasDropdownOpen && (
                <ul className={styles.dropdownMenu}>
                  <li className={styles.dropdownItem}>
                    <Link href="/hojas-ruta">Hojas de Ruta</Link>
                  </li>
                  <li className={styles.dropdownItem}>
                    <Link href="/ordenes-recoleccion">Órdenes de Recolección</Link>
                  </li>
                  <li className={styles.dropdownItem}>
                    <Link href="/ordenes-cambio">Órdenes de Cambio</Link>
                  </li>
                </ul>
              )}
            </li>
          )}

          {usuario?.usuario_rol !== 4 && usuario?.usuario_rol !== 5 && (
            <li className={`${styles.menuItem} ${styles.dropdown}`} ref={inventarioDropdownRef}>
              <button 
                className={styles.dropdownToggle} 
                onClick={toggleInventarioDropdown}
              >
                Inventario
                <span className={styles.dropdownArrow}>▼</span>
              </button>
              {isInventarioDropdownOpen && (
                <ul className={styles.dropdownMenu}>
                  <li className={styles.dropdownItem}>
                    <Link href="/inventario-equipos">Inventario Consolidado</Link>
                  </li>
                  <li className={styles.dropdownItem}>
                    <Link href="/bitacora-equipo">Bitácora Equipos</Link>
                  </li>
                  <li className={styles.dropdownItem}>
                    <Link href="/equipos-mantenimiento">Equipos en Mantenimiento</Link>
                  </li>
                </ul>
              )}
            </li>
          )}

          {usuario?.usuario_rol !== 5 && (
            <li className={`${styles.menuItem} ${styles.dropdown}`} ref={reportesDropdownRef}>
              <button 
                className={styles.dropdownToggle} 
                onClick={toggleReportesDropdown}
              >
                Reportes
                <span className={styles.dropdownArrow}>▼</span>
              </button>
              {isReportesDropdownOpen && (
                <ul className={styles.dropdownMenu}>
                  <li className={styles.dropdownItem}>
                    <Link href="/reportes">Ingresos por equipos</Link>
                  </li>
                  <li className={styles.dropdownItem}>
                    <Link href="/pagos">Reporte de Pagos</Link>
                  </li>
                  <li className={styles.dropdownItem}>
                    <Link href="/reporte-equipos-cliente">Equipos por Cliente</Link>
                  </li>
                  <li className={styles.dropdownItem}>
                    <Link href="/reporte-facturas">Reporte de Facturas</Link>
                  </li>
                </ul>
              )}
            </li>
          )}
          
          
          {usuario?.usuario_rol === 1 && (
            <li className={`${styles.menuItem} ${styles.dropdown}`} ref={equiposDropdownRef}>
              <button 
                className={styles.dropdownToggle} 
                onClick={toggleEquiposDropdown}
              >
                Detalles Equipos
                <span className={styles.dropdownArrow}>▼</span>
              </button>
              {isEquiposDropdownOpen && (
                <ul className={styles.dropdownMenu}>
                  <li className={styles.dropdownItem}>
                    <Link href="/mezcladoras">Mezcladoras</Link>
                  </li>
                  <li className={styles.dropdownItem}>
                    <Link href="/andamios">Andamios</Link>
                  </li>
                  <li className={styles.dropdownItem}>
                    <Link href="/compactadores">Compactadores</Link>
                  </li>
                  <li className={styles.dropdownItem}>
                    <Link href="/rompedores">Rompedores</Link>
                  </li>
                  <li className={styles.dropdownItem}>
                    <Link href="/vibradores">Vibradores</Link>
                  </li>
                  <li className={styles.dropdownItem}>
                    <Link href="/puntales">Puntales</Link>
                  </li>
                </ul>
              )}
            </li>
          )}
          {usuario?.usuario_rol === 1 && (
            <li className={`${styles.menuItem} ${styles.dropdown}`} ref={configDropdownRef}>
              <button 
                className={styles.dropdownToggle} 
                onClick={toggleConfigDropdown}
              >
                Mantenimientos
                <span className={styles.dropdownArrow}>▼</span>
              </button>
              {isConfigDropdownOpen && (
                <ul className={styles.dropdownMenu}>
                  <li className={styles.dropdownItem}>
                    <Link href="/equipos">Mant. Equipos</Link>
                  </li>
                  <li className={styles.dropdownItem}>
                    <Link href="/usuarios">Mant.Usuarios</Link>
                  </li>
                  <li className={styles.dropdownItem}>
                    <Link href="/roles">Mant. Roles</Link>
                  </li>                
                  <li className={styles.dropdownItem}>
                    <Link href="/categoria-equipo">Mant. de Categorias de Equipos</Link>
                  </li>
                  <li className={styles.dropdownItem}>
                    <Link href="/ajuste-inventario">Ajuste Manual de Inventario</Link>
                  </li>
                  
                </ul>
              )}
            </li>
          )}
          {usuario?.usuario_rol === 1 && (
            <li className={`${styles.menuItem} ${styles.dropdown}`} ref={rhDropdownRef}>
              <button 
                className={styles.dropdownToggle} 
                onClick={toggleRHDropdown}
              >
                RH
                <span className={styles.dropdownArrow}>▼</span>
              </button>
              {isRHDropdownOpen && (
                <ul className={styles.dropdownMenu}>
                  <li className={styles.dropdownItem}>
                    <Link href="/empleados">Empleados</Link>
                  </li>
                  <li className={styles.dropdownItem}>
                    <Link href="/solicitudes-vacaciones">Solicitudes de Vacaciones</Link>
                  </li>
                  <li className={styles.dropdownItem}>
                    <Link href="/reporte-vacaciones">Reporte de Vacaciones</Link>
                  </li>
                </ul>
              )}
            </li>
          )}
        </ul>

        <div className={styles.menuActions}>
          {usuario && (
            <div className={styles.userDropdown} ref={userDropdownRef}>
              <button className={styles.userButton} onClick={toggleUserDropdown}>
                <span className={styles.userIcon}>👤</span>
                <span className={styles.userName}>
                  {usuario.nombre_usuario} {usuario.apellido_usuario}
                </span>
                <span className={styles.dropdownArrow}>▼</span>
              </button>
              {isUserDropdownOpen && (
                <div className={styles.userDropdownMenu}>
                  <button 
                    className={styles.userDropdownItem}
                    onClick={() => {
                      setIsUserDropdownOpen(false);
                      setIsChangePasswordModalOpen(true);
                    }}
                  >
                    <span>🔑</span>
                    <span>Cambiar Contraseña</span>
                  </button>
                  <div className={styles.userDropdownDivider}></div>
                  <button className={styles.userDropdownLogout} onClick={logout}>
                    <span>🚪</span>
                    <span>Cerrar Sesión</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>

    <EnvironmentBanner />

    <CambiarContrasenaModal 
      isOpen={isChangePasswordModalOpen}
      onClose={() => setIsChangePasswordModalOpen(false)}
    />
    </>
  );
};

export default Menu;
