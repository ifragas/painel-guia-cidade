
import { useState } from 'react';
import {
  Compass,
  Mail,
  Lock,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import api from '../services/api';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await api.post('/login', { email, password });

      localStorage.setItem('admin_token', data.token);
      localStorage.setItem('admin_email', data.email);

      onLogin(data.email);
    } catch (err) {
      setError(
        err.message || 'Erro de conexão. Verifique sua internet.'
      );
      console.error('Erro:', err);
    } finally {
      setLoading(false);
    }
  };

  const inputClasses =
    'w-full rounded-xl border border-slate-300 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-600/20';

  const labelClasses =
    'mb-2 block text-xs font-bold uppercase tracking-wider text-slate-600';

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-8">
      <div className="flex w-full max-w-md flex-col items-center rounded-3xl border border-slate-100 bg-white p-8 shadow-2xl sm:p-10">

        {/* Logotipo */}
        <div className="mb-5 flex items-center justify-center rounded-2xl bg-emerald-600 p-4 text-white shadow-lg shadow-emerald-600/25">
          <Compass size={32} strokeWidth={2} />
        </div>

        {/* Títulos */}
        <h1 className="mb-1 text-center text-2xl font-bold tracking-tight text-slate-900">
          Guia da Cidade
        </h1>

        <p className="mb-7 text-center text-sm leading-relaxed text-slate-500">
          Bem-vindo de volta. Insira suas credenciais para acessar o sistema.
        </p>

        {/* Mensagem de erro */}
        {error && (
          <div
            role="alert"
            className="mb-5 flex w-full items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
          >
            <AlertCircle
              size={18}
              className="mt-0.5 shrink-0"
            />
            <span>{error}</span>
          </div>
        )}

        {/* Formulário */}
        <form
          onSubmit={handleSubmit}
          className="flex w-full flex-col gap-5"
        >
          {/* E-mail */}
          <div>
            <label htmlFor="email" className={labelClasses}>
              E-mail
            </label>

            <div className="relative flex items-center">
              <Mail
                size={18}
                className="pointer-events-none absolute left-3.5 text-slate-400"
              />

              <input
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="exemplo@email.com"
                className={inputClasses}
              />
            </div>
          </div>

          {/* Senha */}
          <div>
            <label htmlFor="password" className={labelClasses}>
              Senha
            </label>

            <div className="relative flex items-center">
              <Lock
                size={18}
                className="pointer-events-none absolute left-3.5 text-slate-400"
              />

              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Digite sua senha"
                className={inputClasses}
              />
            </div>
          </div>

          {/* Botão de login */}
          <button
            type="submit"
            disabled={loading}
            className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition duration-200 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                <span>Entrando...</span>
              </>
            ) : (
              <span>Entrar</span>
            )}
          </button>
        </form>

        {/* Rodapé */}
        <p className="mt-7 text-center text-xs text-slate-400">
          Acesso restrito à administração
        </p>
      </div>
    </div>
  );
}
