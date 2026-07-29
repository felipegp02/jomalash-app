import { useEffect, useState } from 'react';
import { useAuth } from './context/AuthContext';
import { api } from './api/client';
import { puedeVerPestana } from './components/navegacion';
import Login from './pages/Login';
import Restablecer from './pages/Restablecer';
import CambiarPasswordObligatorio from './pages/CambiarPasswordObligatorio';
import Registrar from './pages/Registrar';
import Dashboard from './pages/Dashboard';
import Historial from './pages/Historial';
import Insumos from './pages/Insumos';
import Ajustes from './pages/Ajustes';
import Caja from './pages/Caja';
import Nomina from './pages/Nomina';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import Topbar from './components/Topbar';
import ResumenDia from './components/ResumenDia';
import ModalMiCuenta from './components/ModalMiCuenta';
import './index.css';

const TITULOS = {
  dashboard: 'Dashboard',
  registrar: 'Registrar venta',
  historial: 'Historial',
  insumos: 'Insumos',
  caja: 'Caja',
  nomina: 'Nómina',
  ajustes: 'Ajustes',
};

function App() {
  const { usuario, cargando, logout } = useAuth();
  const [paginaActual, setPaginaActual] = useState('dashboard');
  const [sedes, setSedes] = useState([]);
  const [sedeSeleccionada, setSedeSeleccionada] = useState(null);
  const [refreshResumen, setRefreshResumen] = useState(0);
  const [mostrarMiCuenta, setMostrarMiCuenta] = useState(false);

  useEffect(() => {
    if (usuario) {
      setSedeSeleccionada(usuario.sede_id);
      // GET /sedes no tiene restriccion de permiso: cualquier usuario
      // logueado puede necesitarla (Registrar, o Caja/Ajustes si tiene el
      // permiso puntual), no solo un rol admin.
      api.get('/sedes').then((data) => setSedes(data.sedes));
    }
  }, [usuario]);

  // El enlace de recuperacion de contraseña ("olvidaste tu contraseña")
  // apunta a esta ruta y debe funcionar este o no logueado; se chequea
  // antes que cualquier otra cosa, sin esperar a saber quien esta logueado.
  if (window.location.pathname === '/restablecer') {
    return <Restablecer />;
  }

  if (cargando) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-crema text-texto">
        Cargando...
      </div>
    );
  }

  if (!usuario) {
    return <Login />;
  }

  if (usuario.debe_cambiar_password) {
    return <CambiarPasswordObligatorio />;
  }

  return (
    <div className="flex min-h-screen bg-crema">
      <Sidebar usuario={usuario} paginaActual={paginaActual} onNavegar={setPaginaActual} />

      <div className="flex min-h-screen flex-1 flex-col">
        <Topbar
          usuario={usuario}
          titulo={TITULOS[paginaActual]}
          onLogout={logout}
          sedes={sedes}
          sedeSeleccionada={sedeSeleccionada}
          onChangeSede={setSedeSeleccionada}
          onAbrirMiCuenta={() => setMostrarMiCuenta(true)}
        />

        <main className="flex-1 px-5 py-6 pb-24 md:pb-10">
          {paginaActual === 'dashboard' && (
            <div className="mx-auto w-full max-w-7xl">
              <Dashboard />
            </div>
          )}

          {paginaActual === 'registrar' && (
            <div className="mx-auto grid w-full max-w-[420px] grid-cols-1 gap-5 md:max-w-4xl md:grid-cols-2 md:items-start">
              <Registrar onVentaGuardada={() => setRefreshResumen((n) => n + 1)} />
              <ResumenDia
                usuario={usuario}
                sedeSeleccionada={sedeSeleccionada}
                sedes={sedes}
                refreshTrigger={refreshResumen}
              />
            </div>
          )}

          {paginaActual === 'historial' && <Historial />}

          {paginaActual === 'insumos' && puedeVerPestana('insumos', usuario) && <Insumos />}

          {paginaActual === 'ajustes' && puedeVerPestana('ajustes', usuario) && <Ajustes />}

          {paginaActual === 'caja' && puedeVerPestana('caja', usuario) && (
            <Caja sedes={sedes} sedeSeleccionada={sedeSeleccionada} />
          )}

          {paginaActual === 'nomina' && puedeVerPestana('nomina', usuario) && (
            <Nomina sedeSeleccionada={sedeSeleccionada} />
          )}
        </main>
      </div>

      <BottomNav
        usuario={usuario}
        paginaActual={paginaActual}
        onNavegar={setPaginaActual}
        onAbrirMiCuenta={() => setMostrarMiCuenta(true)}
        onLogout={logout}
      />

      {mostrarMiCuenta && <ModalMiCuenta usuario={usuario} onCerrar={() => setMostrarMiCuenta(false)} />}
    </div>
  );
}

export default App;
