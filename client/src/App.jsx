import { useEffect, useState } from 'react';
import { useAuth } from './context/AuthContext';
import { api } from './api/client';
import Login from './pages/Login';
import Registrar from './pages/Registrar';
import Dashboard from './pages/Dashboard';
import Historial from './pages/Historial';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import Topbar from './components/Topbar';
import ResumenDia from './components/ResumenDia';
import './index.css';

const TITULOS = { dashboard: 'Dashboard', registrar: 'Registrar venta', historial: 'Historial' };

function App() {
  const { usuario, cargando, logout } = useAuth();
  const [paginaActual, setPaginaActual] = useState('dashboard');
  const [sedes, setSedes] = useState([]);
  const [sedeSeleccionada, setSedeSeleccionada] = useState(null);
  const [refreshResumen, setRefreshResumen] = useState(0);

  useEffect(() => {
    if (usuario) {
      setSedeSeleccionada(usuario.sede_id);
    }
    if (usuario?.rol === 'admin') {
      api.get('/sedes').then((data) => setSedes(data.sedes));
    }
  }, [usuario]);

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
        </main>
      </div>

      <BottomNav usuario={usuario} paginaActual={paginaActual} onNavegar={setPaginaActual} />
    </div>
  );
}

export default App;
