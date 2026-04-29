import React, { useState, useEffect } from 'react';
import Menu from './Menu';
import Footer from './Footer';
import Spinner from './Spinner';
import { useAuth } from '../contexts/AuthContext';
import styles from '../styles/Home.module.css';

interface DashboardStats {
  equipos: number;
  clientes: number;
  usuarios: number;
  categorias_equipo: number;
  solicitudesEquipo: number;
  contratosPorVencer: number;
  contratosVencidos: number;
  ocupacionPorCategoria: Array<{
    nombre: string;
    total: number;
    disponibles: number;
    porcentaje: number;
  }>;
}

interface ContratoAlerta {
  id_contrato: number;
  numero_solicitud_equipo: string;
  nombre_cliente: string;
  telefono_cliente: string;
  equipos: string;
  fecha_vencimiento: string;
  estado_pago: string;
}

const Home: React.FC = () => {
  const { usuario } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    equipos: 0,
    clientes: 0,
    usuarios: 0,
    categorias_equipo: 0,
    solicitudesEquipo: 0,
    contratosPorVencer: 0,
    contratosVencidos: 0,
    ocupacionPorCategoria: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [contratosPorVencerList, setContratosPorVencerList] = useState<ContratoAlerta[]>([]);
  const [contratosVencidosList, setContratosVencidosList] = useState<ContratoAlerta[]>([]);
  const [modalAbierto, setModalAbierto] = useState<'porVencer' | 'vencidos' | null>(null);

  // Verificar si el usuario es chofer (rol 5)
  const esChofer = usuario?.usuario_rol === 5;
  const sinAccesoContratos = usuario?.usuario_rol === 4 || usuario?.usuario_rol === 5;

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [equiposRes, clientesRes, usuariosRes, catEquipoRes, solicitudesEquipoRes, contratosRes] = await Promise.all([
        fetch('/api/equipo'),
        fetch('/api/cliente'),
        fetch('/api/usuario'),
        fetch('/api/categoria-equipo'),
        fetch('/api/solicitud-equipo'),
        fetch('/api/contrato/con-pagos'),
      ]);

      const [equipos, clientes, usuarios, catEquipo, solicitudesEquipo, contratos] = await Promise.all([
        equiposRes.json(),
        clientesRes.json(),
        usuariosRes.json(),
        catEquipoRes.json(),
        solicitudesEquipoRes.json(),
        contratosRes.json(),
      ]);

      // Calcular ocupación por categoría
      const ocupacionPorCategoria: Array<{
        nombre: string;
        total: number;
        disponibles: number;
        porcentaje: number;
      }> = [];

      if (Array.isArray(catEquipo.data) && Array.isArray(equipos.data)) {
        for (const categoria of catEquipo.data) {
          const equiposCategoria = equipos.data.filter((e: any) => e.id_equipo_categoria === categoria.id);
          
          // Total = suma de cantidad_equipo de TODOS los equipos de esta categoría
          const total = equiposCategoria.reduce((sum: number, e: any) => sum + (e.cantidad_equipo || 0), 0);
          
          // Disponibles = suma de cantidad_disponible de todos los equipos
          const disponibles = equiposCategoria
            .reduce((sum: number, e: any) => sum + (e.cantidad_disponible || 0), 0);
          
          // Porcentaje de disponibilidad
          const porcentaje = total > 0 ? Math.round((disponibles / total) * 100) : 0;
          
          ocupacionPorCategoria.push({
            nombre: categoria.nombre,
            total,
            disponibles,
            porcentaje
          });
        }
      }

      // Calcular contratos que vencen en los próximos 3 días y contratos vencidos
      let contratosPorVencer = 0;
      let contratosVencidos = 0;
      const listaPorVencer: ContratoAlerta[] = [];
      const listaVencidos: ContratoAlerta[] = [];
      if (Array.isArray(contratos.data)) {
        const fechaActual = new Date();
        fechaActual.setHours(0, 0, 0, 0);
        
        contratos.data.forEach((contrato: any) => {
          if (contrato.fecha_vencimiento && contrato.estado !== 0) { // Solo contratos no anulados
            const [year, month, day] = contrato.fecha_vencimiento.split('T')[0].split('-');
            const fechaVencimiento = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            fechaVencimiento.setHours(0, 0, 0, 0);
            const diferenciaDias = Math.ceil((fechaVencimiento.getTime() - fechaActual.getTime()) / (1000 * 60 * 60 * 24));
            
            const alerta: ContratoAlerta = {
              id_contrato: contrato.id_contrato,
              numero_solicitud_equipo: contrato.numero_solicitud_equipo || '',
              nombre_cliente: contrato.nombre_cliente || 'Sin cliente',
              telefono_cliente: contrato.telefono_cliente || '',
              equipos: contrato.equipos || '',
              fecha_vencimiento: contrato.fecha_vencimiento,
              estado_pago: contrato.estado_pago || 'pendiente',
            };

            if (diferenciaDias < 0) {
              contratosVencidos++;
              listaVencidos.push(alerta);
            } else if (diferenciaDias <= 3) {
              contratosPorVencer++;
              listaPorVencer.push(alerta);
            }
          }
        });
      }

      setContratosPorVencerList(listaPorVencer);
      setContratosVencidosList(listaVencidos);

      setStats({
        equipos: Array.isArray(equipos.data) ? equipos.data.length : 0,
        clientes: Array.isArray(clientes.data) ? clientes.data.length : 0,
        usuarios: Array.isArray(usuarios.data) ? usuarios.data.length : 0,
        categorias_equipo: Array.isArray(catEquipo.data) ? catEquipo.data.length : 0,
        solicitudesEquipo: Array.isArray(solicitudesEquipo.data) ? solicitudesEquipo.data.length : 0,
        contratosPorVencer,
        contratosVencidos,
        ocupacionPorCategoria,
      });
    } catch (error) {
      console.error('Error al cargar datos del dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      {isLoading && <Spinner />}
      <Menu />

      <main className={styles.main}>
        <section className={styles.hero}>
          <h2>Sistema de Gestión de Alquiler de Equipos</h2>
          <p>Administra tus equipos y clientes de manera eficiente</p>
          <div className={styles.heroButtons}>
            <button 
              className={styles.btnPrimary} 
              onClick={() => !esChofer && (window.location.href = '/solicitudes-equipos')}
              disabled={esChofer}
              style={esChofer ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
              title={esChofer ? 'No tienes permisos para acceder a esta sección' : 'Ir a Solicitudes de Equipo'}
            >
              Comenzar
            </button>
            <button className={styles.btnSecondary} onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}>
              Ver Dashboard
            </button>
          </div>
        </section>

        <section className={styles.features}>
          {/* Card de Contratos por Vencer */}
          <div
            className={styles.featureCard}
            style={{
              backgroundColor: stats.contratosPorVencer > 0 ? '#fff3e0' : undefined,
              borderLeft: stats.contratosPorVencer > 0 ? '4px solid #ff9800' : undefined,
              cursor: (stats.contratosPorVencer > 0 && !sinAccesoContratos) ? 'pointer' : 'default',
            }}
            onClick={() => !sinAccesoContratos && stats.contratosPorVencer > 0 && setModalAbierto('porVencer')}
            title={!sinAccesoContratos && stats.contratosPorVencer > 0 ? 'Ver contratos próximos a vencer' : undefined}
          >
            <div className={styles.icon}>⚠️</div>
            <h3>Contratos por Vencer</h3>
            <p className={styles.statNumber} style={{ color: stats.contratosPorVencer > 0 ? '#ff9800' : undefined }}>{stats.contratosPorVencer}</p>
            <span className={styles.statDetail}>Próximos 3 días</span>
          </div>
          
          {/* Card de Contratos Vencidos */}
          <div
            className={styles.featureCard}
            style={{
              backgroundColor: stats.contratosVencidos > 0 ? '#ffebee' : undefined,
              borderLeft: stats.contratosVencidos > 0 ? '4px solid #f44336' : undefined,
              cursor: (stats.contratosVencidos > 0 && !sinAccesoContratos) ? 'pointer' : 'default',
            }}
            onClick={() => !sinAccesoContratos && stats.contratosVencidos > 0 && setModalAbierto('vencidos')}
            title={!sinAccesoContratos && stats.contratosVencidos > 0 ? 'Ver contratos vencidos' : undefined}
          >
            <div className={styles.icon}>🛑</div>
            <h3>Contratos Vencidos</h3>
            <p className={styles.statNumber} style={{ color: stats.contratosVencidos > 0 ? '#f44336' : undefined }}>{stats.contratosVencidos}</p>
            <span className={styles.statDetail}>Requieren atención</span>
          </div>
          
          {stats.ocupacionPorCategoria.length > 0 ? (
            stats.ocupacionPorCategoria.map((cat, index) => (
              <div key={index} className={styles.featureCard}>
                <div className={styles.icon}>
                  {cat.nombre.toLowerCase().includes('mezcladora') && '🚧'}
                  {cat.nombre.toLowerCase().includes('andamio') && '🪜'}
                  {cat.nombre.toLowerCase().includes('compactador') && '🔨'}
                  {cat.nombre.toLowerCase().includes('rompedor') && '⚒️'}
                  {cat.nombre.toLowerCase().includes('vibrador') && '📳'}
                  {cat.nombre.toLowerCase().includes('puntal') && '🏗️'}
                  {!['mezcladora', 'andamio', 'compactador', 'rompedor', 'vibrador', 'puntal'].some(t => cat.nombre.toLowerCase().includes(t)) && '📦'}
                </div>
                <h3>{cat.nombre}</h3>
                <p className={styles.statNumber}>{cat.porcentaje}%</p>
                <span className={styles.statDetail}>
                  {cat.disponibles} de {cat.total} equipos disponibles
                </span>
              </div>
            ))
          ) : (
            <div className={styles.featureCard}>
              <div className={styles.icon}>📦</div>
              <h3>Sin categorías</h3>
              <p>No hay categorías de equipos registradas</p>
            </div>
          )}
        </section>

        <section className={styles.stats}>
          <div className={styles.statCard}>
            <h4>Equipos Registrados</h4>
            <p className={styles.statNumber}>{stats.equipos}</p>
            <span className={styles.statDetail}>{stats.categorias_equipo} categorías</span>
          </div>
          
          <div className={styles.statCard}>
            <h4>Clientes Activos</h4>
            <p className={styles.statNumber}>{stats.clientes}</p>
            <span className={styles.statDetail}>Gestión de clientes</span>
          </div>
          
          <div className={styles.statCard}>
            <h4>Usuarios del Sistema</h4>
            <p className={styles.statNumber}>{stats.usuarios}</p>
            <span className={styles.statDetail}>Control de acceso</span>
          </div>
          
          <div className={styles.statCard}>
            <h4>Solicitudes Registradas</h4>
            <p className={styles.statNumber}>{stats.solicitudesEquipo}</p>
            <span className={styles.statDetail}>Gestión de alquiler</span>
          </div>
        </section>
      </main>

      {/* Modal Contratos por Vencer */}
      {modalAbierto === 'porVencer' && (
        <div className={styles.modalOverlay} onClick={() => setModalAbierto(null)}>
          <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader} style={{ borderBottom: '3px solid #ff9800' }}>
              <h3>⚠️ Contratos por Vencer</h3>
              <p className={styles.modalSubtitle}>Próximos 3 días</p>
              <button className={styles.modalClose} onClick={() => setModalAbierto(null)}>✕</button>
            </div>
            <div className={styles.modalBody}>
              <table className={styles.modalTable}>
                <thead>
                  <tr>
                    <th># Contrato</th>
                    <th>Cliente</th>
                    <th>Teléfono</th>
                    <th>Equipos</th>
                    <th>Estado Pago</th>
                    <th>Vencimiento</th>
                  </tr>
                </thead>
                <tbody>
                  {contratosPorVencerList.map((c) => (
                    <tr key={c.id_contrato}>
                      <td>
                        <a
                          href={`/contratos?buscar=${encodeURIComponent(c.numero_solicitud_equipo)}`}
                          className={styles.modalLink}
                          style={{ color: '#ff9800' }}
                        >
                          #{c.id_contrato}
                        </a>
                      </td>
                      <td>{c.nombre_cliente}</td>
                      <td>{c.telefono_cliente}</td>
                      <td>{c.equipos}</td>
                      <td>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          backgroundColor:
                            c.estado_pago === 'pagado' ? '#e8f5e9' :
                            c.estado_pago === 'pago_parcial' ? '#fff3e0' : '#ffebee',
                          color:
                            c.estado_pago === 'pagado' ? '#388e3c' :
                            c.estado_pago === 'pago_parcial' ? '#e65100' : '#c62828',
                        }}>
                          {c.estado_pago === 'pagado' ? 'Pagado' :
                           c.estado_pago === 'pago_parcial' ? 'Parcial' : 'Pendiente'}
                        </span>
                      </td>
                      <td style={{ color: '#ff9800', fontWeight: 700 }}>
                        {c.fecha_vencimiento.split('T')[0].split('-').reverse().join('/')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal Contratos Vencidos */}
      {modalAbierto === 'vencidos' && (
        <div className={styles.modalOverlay} onClick={() => setModalAbierto(null)}>
          <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader} style={{ borderBottom: '3px solid #f44336' }}>
              <h3>🛑 Contratos Vencidos</h3>
              <p className={styles.modalSubtitle}>Requieren atención inmediata</p>
              <button className={styles.modalClose} onClick={() => setModalAbierto(null)}>✕</button>
            </div>
            <div className={styles.modalBody}>
              <table className={styles.modalTable}>
                <thead>
                  <tr>
                    <th># Contrato</th>
                    <th>Cliente</th>
                    <th>Teléfono</th>
                    <th>Equipos</th>
                    <th>Estado Pago</th>
                    <th>Vencimiento</th>
                  </tr>
                </thead>
                <tbody>
                  {contratosVencidosList.map((c) => (
                    <tr key={c.id_contrato}>
                      <td>
                        <a
                          href={`/contratos?buscar=${encodeURIComponent(c.numero_solicitud_equipo)}`}
                          className={styles.modalLink}
                          style={{ color: '#f44336' }}
                        >
                          #{c.id_contrato}
                        </a>
                      </td>
                      <td>{c.nombre_cliente}</td>
                      <td>{c.telefono_cliente}</td>
                      <td>{c.equipos}</td>
                      <td>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          backgroundColor:
                            c.estado_pago === 'pagado' ? '#e8f5e9' :
                            c.estado_pago === 'pago_parcial' ? '#fff3e0' : '#ffebee',
                          color:
                            c.estado_pago === 'pagado' ? '#388e3c' :
                            c.estado_pago === 'pago_parcial' ? '#e65100' : '#c62828',
                        }}>
                          {c.estado_pago === 'pagado' ? 'Pagado' :
                           c.estado_pago === 'pago_parcial' ? 'Parcial' : 'Pendiente'}
                        </span>
                      </td>
                      <td style={{ color: '#f44336', fontWeight: 700 }}>
                        {c.fecha_vencimiento.split('T')[0].split('-').reverse().join('/')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default Home;
