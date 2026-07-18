/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Sparkles, Shield, User, Lock, Eye, EyeOff, Loader2, ArrowLeft, AlertTriangle, ExternalLink } from 'lucide-react';

export default function Login() {
  const { login, forgotPassword } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isResetMode, setIsResetMode] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Por favor, informe um e-mail válido.');
      return;
    }
    
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isResetMode) {
        await forgotPassword(email);
        setSuccess('E-mail de recuperação enviado com sucesso! Verifique sua caixa de entrada.');
      } else {
        if (!password) {
          setError('Por favor, informe sua senha de acesso.');
          setLoading(false);
          return;
        }
        await login(email, password);
      }
    } catch (err: any) {
      let friendlyError = 'Ocorreu um erro ao processar sua solicitação.';
      
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        friendlyError = 'Credenciais inválidas. Verifique seu e-mail e senha.';
      } else if (err.code === 'auth/invalid-email') {
        friendlyError = 'O formato de e-mail informado é inválido.';
      } else if (err.code === 'auth/too-many-requests') {
        friendlyError = 'Múltiplas tentativas falhas. Sua conta foi temporariamente bloqueada. Tente novamente mais tarde.';
      } else if (err.code === 'auth/operation-not-allowed') {
        friendlyError = 'O provedor de E-mail/Senha está desativado no Firebase Console para este projeto.';
      } else if (err.message && err.message.includes('Acesso Bloqueado')) {
        friendlyError = err.message;
      } else if (err.message && err.message.includes('Perfil de usuário não encontrado')) {
        friendlyError = 'Esta conta não possui acesso autorizado ao sistema. Solicite a liberação ao administrador.';
      } else if (err.code === 'auth/network-request-failed') {
        friendlyError = 'Não foi possível conectar ao serviço de acesso. Verifique sua internet e tente novamente.';
      }
      
      setError(friendlyError);
    } finally {
      setLoading(false);
    }
  };

  const hasAuthError = error.includes('Firebase Console');

  return (
    <div className="min-h-screen w-full bg-[#1E293B] flex items-center justify-center p-4 sm:p-6 md:p-8" style={{
      backgroundImage: `radial-gradient(circle at 10% 20%, rgba(43, 76, 126, 0.9) 0%, rgba(30, 41, 59, 0.95) 100%), url('https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1200&auto=format&fit=crop&q=80')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }}>
      <div className={`w-full flex flex-col md:flex-row items-center justify-center gap-6 ${hasAuthError ? 'max-w-4xl' : 'max-w-md'}`}>
        
        {/* Main Login Card */}
        <div className="max-w-md w-full bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl overflow-hidden border border-[#FAF6E8] flex flex-col p-6 sm:p-8 space-y-6">
          
          {/* Logo and Titles */}
          <div className="text-center space-y-2">
            <div className="mx-auto w-12 h-12 rounded-full bg-[#2B4C7E] flex items-center justify-center shadow-md border border-[#D4AF37]/20">
              <Sparkles className="w-6 h-6 text-[#D4AF37] animate-pulse" />
            </div>
            <h2 className="text-2xl font-serif font-bold text-[#2B4C7E] tracking-wide">Espaço La Belle</h2>
            <p className="text-xs text-slate-500 uppercase tracking-widest font-medium">Gestão de Agenda & Salão</p>
            <div className="h-px bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent w-full" />
          </div>

          {/* Content Toggle Header */}
          <div className="space-y-1 text-center">
            <h3 className="text-lg font-serif font-medium text-slate-800">
              {isResetMode ? 'Recuperar Senha' : 'Acesso ao Sistema'}
            </h3>
            <p className="text-xs text-slate-400">
              {isResetMode 
                ? 'Digite o seu e-mail cadastrado para redefinir sua senha de acesso.' 
                : 'Seja bem-vindo de volta! Por favor, entre com suas credenciais.'
              }
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4" aria-busy={loading}>
            {error && (
              <div role="alert" className="bg-rose-50 border border-rose-200 text-rose-800 text-xs px-3 py-2.5 rounded-lg font-medium leading-relaxed flex flex-col gap-1">
                <span>{error}</span>
                {errCodeIsAuthDisabled(error) && (
                  <span className="text-[10px] text-rose-600 font-bold uppercase mt-1">Veja as instruções de configuração ao lado</span>
                )}
              </div>
            )}

            {success && (
              <div role="status" aria-live="polite" className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-3 py-2.5 rounded-lg font-medium leading-relaxed">
                {success}
              </div>
            )}

            {/* E-mail Field */}
            <div className="space-y-1">
              <label htmlFor="login-email" className="text-xs font-semibold text-slate-600 block">E-mail</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <User className="w-4 h-4" />
                </span>
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  autoCapitalize="none"
                  spellCheck={false}
                  placeholder="usuario@espaolabelle.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2B4C7E] focus:bg-white transition-all disabled:opacity-60"
                />
              </div>
            </div>

            {/* Password Field */}
            {!isResetMode && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label htmlFor="login-password" className="text-xs font-semibold text-slate-600">Senha</label>
                  <button
                    type="button"
                    onClick={() => setIsResetMode(true)}
                    disabled={loading}
                    className="text-xs font-semibold text-[#2B4C7E] hover:text-[#1C3358] focus:underline transition-colors cursor-pointer"
                  >
                    Esqueci minha senha
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    id="login-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    className="w-full pl-9 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2B4C7E] focus:bg-white transition-all disabled:opacity-60"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    title={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Action Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#2B4C7E] hover:bg-[#1C3358] text-[#FAF6E8] font-bold text-sm rounded-xl shadow-md transition-all duration-150 cursor-pointer flex items-center justify-center gap-2 border border-[#D4AF37]/20 disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Carregando...
                </>
              ) : isResetMode ? (
                'Enviar link de recuperação'
              ) : (
                'Acessar sistema'
              )}
            </button>
          </form>

          {/* Back option for reset mode */}
          {isResetMode && (
            <button
              type="button"
              onClick={() => {
                setIsResetMode(false);
                setError('');
                setSuccess('');
              }}
              disabled={loading}
              className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer self-center mt-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Voltar para o login
            </button>
          )}

          {/* Security watermark */}
          <div className="text-center pt-2">
            <p className="text-[10px] text-slate-400 flex items-center justify-center gap-1 font-mono">
              <Shield className="w-3.5 h-3.5 text-sky-800" /> CONEXÃO CRIPTOGRAFADA SEGURA
            </p>
          </div>

        </div>

        {/* Firebase Settings Instructions Card */}
        {hasAuthError && (
          <div className="max-w-md w-full bg-slate-900/95 backdrop-blur-md text-slate-100 rounded-2xl shadow-2xl p-6 sm:p-8 border border-amber-500/30 flex flex-col justify-between space-y-6 md:self-stretch">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-lg font-serif font-bold text-amber-400">Ativação do Firebase Auth</h3>
                  <p className="text-xs text-slate-400 uppercase tracking-widest font-mono">Configuração Necessária</p>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Para permitir acessos com e-mail e senha, você deve habilitar o provedor de login correspondente nas configurações de autenticação do seu painel do Firebase:
              </p>

              <div className="space-y-3 bg-slate-950/50 p-4 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300">
                <p className="font-semibold text-slate-200 uppercase tracking-wider text-[10px] border-b border-slate-800 pb-1.5 mb-2">Instruções de Configuração:</p>
                <div className="flex gap-2">
                  <span className="text-amber-500 font-bold">1.</span>
                  <span>Acesse o <strong>Firebase Console</strong> do seu projeto.</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-amber-500 font-bold">2.</span>
                  <span>No menu esquerdo, vá em <strong>Build</strong> &gt; <strong>Authentication</strong>.</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-amber-500 font-bold">3.</span>
                  <span>Selecione a aba <strong>Sign-in method</strong> no topo da página.</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-amber-500 font-bold">4.</span>
                  <span>Clique em <strong>Add new provider</strong> e escolha <strong>Email/Password</strong>.</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-amber-500 font-bold">5.</span>
                  <span>Ative a primeira chave (<strong>Email/Password</strong>) e clique em <strong>Save</strong>.</span>
                </div>
              </div>
            </div>

            <div className="space-y-2.5">
              <a
                href="https://console.firebase.google.com/"
                target="_blank"
                referrerPolicy="no-referrer"
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all font-sans cursor-pointer uppercase tracking-wider"
              >
                <span>Acessar Firebase Console</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="w-full py-2 bg-transparent hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-750 text-xs rounded-xl font-medium transition-all cursor-pointer font-sans"
              >
                Recarregar Página
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

function errCodeIsAuthDisabled(msg: string): boolean {
  return msg.includes('Firebase Console') || msg.includes('desativado');
}
