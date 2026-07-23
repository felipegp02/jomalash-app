import { useEffect, useState } from 'react';
import { useAuth } from './context/AuthContext';
import { api } from './api/client';
import Login from './pages/Login';
import Registrar from './pages/Registrar';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import Topbar from './components/Topbar';
import ResumenDia from './components/ResumenDia';
import './index.css';

const PAGINA_ACTUAL = 'registrar';
const TITULOS = { registrar: 'Registrar venta' };

function App() {
  const { usuario, cargando, logout } = useAuth();
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
      <Sidebar usuario={usuario} paginaActual={PAGINA_ACTUAL} />

      <div className="flex min-h-screen flex-1 flex-col">
        <Topbar
          usuario={usuario}
          titulo={TITULOS[PAGINA_ACTUAL]}
          onLogout={logout}
          sedes={sedes}
          sedeSeleccionada={sedeSeleccionada}
          onChangeSede={setSedeSeleccionada}
        />

        <main className="flex-1 px-5 py-6 pb-24 md:pb-10">
          <div className="mx-auto grid w-full max-w-[420px] grid-cols-1 gap-5 md:max-w-4xl md:grid-cols-2 md:items-start">
            <Registrar onVentaGuardada={() => setRefreshResumen((n) => n + 1)} />
            <ResumenDia
              usuario={usuario}
              sedeSeleccionada={sedeSeleccionada}
              sedes={sedes}
              refreshTrigger={refreshResumen}
            />
          </div>
        </main>
      </div>

      <BottomNav usuario={usuario} paginaActual={PAGINA_ACTUAL} />
    </div>
  );
}

export default App;
