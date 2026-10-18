import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { Play, AlertTriangle, CheckCircle2, XCircle, RefreshCw, Radio } from 'lucide-react';

interface EventLog {
  id: string;
  timestamp: string;
  eventType: string;
  correlationId: string;
  source: string;
  payload: any;
}

export function App() {
const [, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [logs, setLogs] = useState<EventLog[]>([]);
  
  // Formulario
  const [customerId, setCustomerId] = useState('CUST-1001');
  const [planId, setPlanId] = useState('PLAN-FIBRA-300');
  const [simulateFailure, setSimulateFailure] = useState<'none' | 'billing' | 'provisioning'>('none');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Conexión al WebSocket gateway de activation-api (puerto 3000)
    const newSocket = io('http://localhost:3000', {
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      setConnected(true);
      console.log('Conectado al gateway de WebSockets (activation-api)');
    });

    newSocket.on('disconnect', () => {
      setConnected(false);
    });

    newSocket.on('activation.event', (event: any) => {
      console.log('Evento recibido por WebSocket:', event);
      const logEntry: EventLog = {
        id: event.eventId || Math.random().toString(),
        timestamp: new Date().toLocaleTimeString(),
        eventType: event.eventType,
        correlationId: event.correlationId,
        source: event.source || 'system',
        payload: event.payload,
      };
      setLogs((prev) => [logEntry, ...prev]);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const handleTriggerActivation = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('Enviando solicitud de activación...');
      const response = await fetch('http://localhost:3000/api/activations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId,
          planId,
          simulateFailure: simulateFailure === 'none' ? undefined : simulateFailure,
        }),
      });

      if (!response.ok) {
        throw new Error(`Error HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Respuesta recibida del backend:', data);
    } catch (error) {
      console.error('Error al enviar la solicitud:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearLogs = () => setLogs([]);

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', backgroundColor: '#0f172a', color: '#f8fafc', minHeight: '100vh', padding: '2rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid #334155', paddingBottom: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: 0, color: '#38bdf8' }}>
            PoC: Arquitectura Event-Driven & Sagas
          </h1>
          <p style={{ margin: '0.5rem 0 0 0', color: '#94a3b8' }}>
            Aprovisionamiento de Servicios Telecomunicaciones
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: connected ? '#064e3b' : '#7f1d1d', padding: '0.5rem 1rem', borderRadius: '9999px', border: `1px solid ${connected ? '#10b981' : '#ef4444'}` }}>
          <Radio size={18} color={connected ? '#34d399' : '#f87171'} />
          <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>
            {connected ? 'WebSocket Conectado (Puerto 3000)' : 'Desconectado'}
          </span>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
        {/* Panel de Control / Formulario */}
        <section style={{ backgroundColor: '#1e293b', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid #334155', height: 'fit-content' }}>
          <h2 style={{ fontSize: '1.25rem', marginTop: 0, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f1f5f9' }}>
            <Play size={20} color="#38bdf8" /> Iniciar Activación
          </h2>

          <form onSubmit={handleTriggerActivation} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', color: '#94a3b8', marginBottom: '0.5rem' }}>ID Cliente</label>
              <input
                type="text"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                required
                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.375rem', backgroundColor: '#0f172a', border: '1px solid #475569', color: '#fff', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', color: '#94a3b8', marginBottom: '0.5rem' }}>Plan Seleccionado</label>
              <input
                type="text"
                value={planId}
                onChange={(e) => setPlanId(e.target.value)}
                required
                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.375rem', backgroundColor: '#0f172a', border: '1px solid #475569', color: '#fff', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <AlertTriangle size={16} color="#fbbf24" /> Simulación de Fallos (Escenarios TP)
              </label>
              <select
                value={simulateFailure}
                onChange={(e) => setSimulateFailure(e.target.value as any)}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.375rem', backgroundColor: '#0f172a', border: '1px solid #475569', color: '#fff', boxSizing: 'border-box' }}
              >
                <option value="none">Sin Fallos (Camino Feliz - Saga Completa)</option>
                <option value="billing">Fallo en Facturación (Falla Billing & Compensación)</option>
                <option value="provisioning">Fallo en Aprovisionamiento (Falla Provisioning & Compensación)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: '0.5rem',
                padding: '0.85rem',
                borderRadius: '0.375rem',
                backgroundColor: loading ? '#475569' : '#0284c7',
                color: '#fff',
                fontWeight: 'bold',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s',
              }}
            >
              {loading ? 'Enviando Evento...' : 'Disparar Evento de Activación'}
            </button>
          </form>
        </section>

        {/* Monitor en Vivo */}
        <section style={{ backgroundColor: '#1e293b', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid #334155' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.25rem', margin: 0, color: '#f1f5f9' }}>
              Monitor de Eventos en Tiempo Real (Kafka Choreography)
            </h2>
            <button
              onClick={clearLogs}
              style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', backgroundColor: 'transparent', border: '1px solid #475569', color: '#94a3b8', padding: '0.4rem 0.8rem', borderRadius: '0.375rem', cursor: 'pointer' }}
            >
              <RefreshCw size={14} /> Limpiar
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '600px', overflowY: 'auto' }}>
            {logs.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b', border: '2px dashed #334155', borderRadius: '0.5rem' }}>
                No hay eventos registrados aún. Inicia una activación para visualizar la coreografía.
              </div>
            ) : (
              logs.map((log) => {
                const isSuccess = log.eventType.includes('Completed') || log.eventType === 'ActivationRequested';
                const isFailed = log.eventType.includes('Failed');

                return (
                  <div
                    key={log.id}
                    style={{
                      padding: '1rem',
                      borderRadius: '0.5rem',
                      backgroundColor: '#0f172a',
                      borderLeft: `4px solid ${isFailed ? '#ef4444' : isSuccess ? '#10b981' : '#3b82f6'}`,
                      borderTop: '1px solid #1e293b',
                      borderRight: '1px solid #1e293b',
                      borderBottom: '1px solid #1e293b',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ fontWeight: 'bold', color: isFailed ? '#f87171' : isSuccess ? '#34d399' : '#60a5fa', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        {isFailed ? <XCircle size={16} /> : <CheckCircle2 size={16} />}
                        {log.eventType}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{log.timestamp}</span>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.4rem' }}>
                      <strong>Correlation ID:</strong> {log.correlationId} | <strong>Origen:</strong> {log.source}
                    </div>
                    <pre style={{ margin: 0, padding: '0.5rem', backgroundColor: '#1e293b', borderRadius: '0.25rem', fontSize: '0.75rem', color: '#cbd5e1', overflowX: 'auto' }}>
                      {JSON.stringify(log.payload, null, 2)}
                    </pre>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default App;