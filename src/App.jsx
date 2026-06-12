import React, { useState, useEffect } from 'react';
import { useGoogleLogin, googleLogout } from '@react-oauth/google';
import Gantt from './Gantt';

const DEFAULT_TEAM = [
  { id: "r1", role: "Líder de proyecto", personName: "" },
  { id: "r2", role: "Analista de procesos", personName: "" },
  { id: "r3", role: "Arquitecto de software", personName: "" },
  { id: "r4", role: "Equipo de desarrollo", personName: "" },
  { id: "r5", role: "QA / Testing", personName: "" },
  { id: "r6", role: "Documentación técnica", personName: "" },
  { id: "r7", role: "Capacitación", personName: "" },
];

const DEFAULT_TASKS = [
  { id: 1, name: "Producto 1", short: "Plan de trabajo", desc: "Plan de trabajo con metodología y cronograma de actividades.", who: "r1", dur: 15, linked: false, off: 0, prog: 0 },
  { id: 2, name: "Producto 2", short: "Levantamiento y validación", desc: "Informe técnico de levantamiento y validación de documentos (diagnóstico, flujogramas, manual de procesos).", who: "r2", dur: 105, linked: true, off: 0, prog: 0 },
  { id: 3, name: "Producto 3", short: "Diseño del sistema", desc: "Diseño del sistema y del módulo de conflictos (arquitectura, prototipos UI/UX, plan de integración).", who: "r3", dur: 90, linked: true, off: 0, prog: 0 },
  { id: 4, name: "Producto 4", short: "Desarrollo SISNAP + Módulo", desc: "Desarrollo del SISNAP y del Módulo de Conflictos Socioambientales (código, integración, gestión de usuarios).", who: "r4", dur: 70, linked: true, off: 0, prog: 0 },
  { id: 5, name: "Producto 5", short: "Pruebas y optimización", desc: "Ejecución de pruebas y optimización del sistema; versión final lista para implementación.", who: "r5", dur: 80, linked: true, off: 0, prog: 0 },
  { id: 6, name: "Producto 6", short: "Evaluación y manuales", desc: "Sistema de evaluación y manuales técnicos (programador, instalación, usuario, base de datos).", who: "r6", dur: 40, linked: true, off: 0, prog: 0 },
  { id: 7, name: "Producto 7", short: "Capacitación y entrega", desc: "Implementación del proceso de capacitación y entrega final del sistema.", who: "r7", dur: 20, linked: true, off: 0, prog: 0 },
];

function App() {
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [currentProjectId, setCurrentProjectId] = useState(null);

  // Cargar proyectos de localStorage al inicio
  useEffect(() => {
    const saved = localStorage.getItem('nexaflow_projects');
    if (saved) {
      try { 
        const parsed = JSON.parse(saved);
        if (parsed && parsed.length > 0) {
            setProjects(parsed);
            return;
        }
      } catch (e) { console.error(e); }
    }
    
    // Si no hay proyectos guardados, inicializar con el proyecto original "SISNAP"
    const defaultProject = {
      id: "default-1",
      title: "SISNAP",
      start: "2026-06-12",
      team: JSON.parse(JSON.stringify(DEFAULT_TEAM)),
      tasks: JSON.parse(JSON.stringify(DEFAULT_TASKS))
    };
    setProjects([defaultProject]);
  }, []);

  // Guardar en localStorage cada vez que projects cambie
  useEffect(() => {
    localStorage.setItem('nexaflow_projects', JSON.stringify(projects));
  }, [projects]);

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const userInfo = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        }).then(res => res.json());
        setUser(userInfo);
      } catch (error) {
        console.error("Error fetching user info:", error);
      }
    },
    onError: () => {
      console.error('Login Failed');
      alert('Error al iniciar sesión con Google.');
    }
  });

  const handleLogout = () => {
    googleLogout();
    setUser(null);
  };

  const createProject = () => {
    const title = prompt("Ingresa el nombre del nuevo proyecto:");
    if (!title) return;
    const newProject = {
      id: Date.now().toString(),
      title,
      start: new Date().toISOString().split('T')[0],
      team: JSON.parse(JSON.stringify(DEFAULT_TEAM)),
      tasks: JSON.parse(JSON.stringify(DEFAULT_TASKS))
    };
    setProjects(prev => [...prev, newProject]);
  };

  const updateProject = (updatedProject) => {
    setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
  };

  const deleteProject = (id) => {
    if (window.confirm("¿Seguro que deseas eliminar este proyecto?")) {
      setProjects(prev => prev.filter(p => p.id !== id));
    }
  };

  if (!user) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'system-ui', background: '#FBFAF9', color: '#22222C' }}>
        <h1 style={{ marginBottom: '10px' }}>Cronogramas Nexaflow IA</h1>
        <p style={{ marginBottom: '30px', color: '#8A8794' }}>Inicia sesión para acceder a tus proyectos.</p>
        <button 
          onClick={() => login()}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            background: '#4F46E5',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          Iniciar sesión con Google
        </button>
      </div>
    );
  }

  const currentProject = projects.find(p => p.id === currentProjectId);

  return (
    <div style={{ background: '#FBFAF9', minHeight: '100vh', fontFamily: 'system-ui' }}>
      <div style={{ padding: '10px 20px', background: '#1E1B4B', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          {user.picture && <img src={user.picture} alt="Avatar" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />}
          <span>{user.name}</span>
        </div>
        <button 
          onClick={handleLogout}
          style={{
            padding: '6px 12px',
            fontSize: '13px',
            background: 'transparent',
            color: 'white',
            border: '1px solid #A5A1D4',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Cerrar sesión
        </button>
      </div>

      <div style={{ padding: '20px' }}>
        {!currentProject ? (
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2>Mis Proyectos</h2>
              <button 
                onClick={createProject}
                style={{ padding: '8px 16px', background: '#4F46E5', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                + Crear Proyecto
              </button>
            </div>
            
            {projects.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', background: '#fff', borderRadius: '12px', border: '1px dashed #D8D5E0' }}>
                <p style={{ color: '#8A8794' }}>No tienes proyectos. Crea uno para comenzar.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '15px' }}>
                {projects.map(p => (
                  <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '15px 20px', borderRadius: '10px', border: '1px solid #E7E5DF', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                    <div>
                      <h3 style={{ margin: '0 0 5px 0', cursor: 'pointer', color: '#4F46E5' }} onClick={() => setCurrentProjectId(p.id)}>{p.title}</h3>
                      <small style={{ color: '#8A8794' }}>Inicio: {p.start} · {p.tasks.length} tareas</small>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button onClick={() => setCurrentProjectId(p.id)} style={{ padding: '6px 12px', background: '#EEF', color: '#4F46E5', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Abrir</button>
                      <button onClick={() => deleteProject(p.id)} style={{ padding: '6px 12px', background: '#FEE2E2', color: '#DC2626', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Eliminar</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            <button 
              onClick={() => setCurrentProjectId(null)}
              style={{ marginBottom: '15px', padding: '6px 12px', background: 'transparent', border: '1px solid #D8D5E0', borderRadius: '6px', cursor: 'pointer' }}
            >
              ← Volver a Proyectos
            </button>
            <Gantt project={currentProject} onUpdate={updateProject} />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
