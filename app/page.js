'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function LoginForm() {
  const searchParams = useSearchParams();
  const [clientIp, setClientIp] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState({ loading: false, msg: '', error: false });

  useEffect(() => {
    const ipParam = searchParams.get('ip');
    if (ipParam) setClientIp(ipParam);
  }, [searchParams]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, msg: 'Verificando credenciales...', error: false });

    try {
      const res = await fetch('/api/autorizar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, clientIp }),
      });

      const data = await res.json();
      if (res.ok) {
        setStatus({ loading: false, msg: data.message, error: false });
      } else {
        setStatus({ loading: false, msg: data.error || 'Error al ingresar', error: true });
      }
    } catch {
      setStatus({ loading: false, msg: 'Error de red al conectar con el portal.', error: true });
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 p-4">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl w-full max-w-sm space-y-5">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Acceso a Internet</h1>
          <p className="text-xs text-slate-400">Ingresa tus credenciales para habilitar tu conexión</p>
        </div>

        <div className="text-center">
          {clientIp ? (
            <span className="inline-block bg-emerald-950/60 text-emerald-400 border border-emerald-800/50 text-xs px-3 py-1 rounded-full">
              IP asignada: {clientIp}
            </span>
          ) : (
            <span className="inline-block bg-amber-950/60 text-amber-400 border border-amber-800/50 text-xs px-3 py-1 rounded-full">
              Esperando IP del router (?ip=...)
            </span>
          )}
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Correo electrónico</label>
            <input
              type="email"
              required
              placeholder="usuario@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Contraseña</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={status.loading || !clientIp}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-400 py-2.5 rounded-lg text-sm font-semibold transition cursor-pointer"
          >
            {status.loading ? 'Conectando...' : 'Conectar a la Red'}
          </button>
        </form>

        {status.msg && (
          <div
            className={`p-3 rounded-lg text-xs text-center border ${
              status.error
                ? 'bg-red-950/50 border-red-800 text-red-300'
                : 'bg-emerald-950/50 border-emerald-800 text-emerald-300'
            }`}
          >
            {status.msg}
          </div>
        )}
      </div>
    </main>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">Cargando...</div>}>
      <LoginForm />
    </Suspense>
  );
}