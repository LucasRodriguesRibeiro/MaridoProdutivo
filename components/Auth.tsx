
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { TrendingUp, Mail, Lock, Loader2, Heart, ShieldCheck, ChevronRight } from 'lucide-react';

export const Auth: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({ email, password });
                if (error) throw error;
                alert('Cadastro realizado! Verifique seu e-mail para confirmar.');
            } else {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
            }
        } catch (err: any) {
            setError(err.message || 'Ocorreu um erro na autenticação.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#020617] flex font-inter text-slate-200 selection:bg-indigo-500/30">
            {/* Left Side: Brand Story & Impact (Hidden on Mobile) */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-slate-900 border-r border-white/5">
                {/* Abstract Visual Elements */}
                <div className="absolute top-[-10%] left-[-10%] w-[80%] h-[80%] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-blue-600/10 rounded-full blur-[100px]" />

                <div className="relative z-10 w-full flex flex-col justify-between p-16">
                    <div className="flex items-center gap-3">
                        <div className="bg-indigo-600 w-12 h-12 rounded-2xl shadow-2xl shadow-indigo-500/40 flex items-center justify-center">
                            <TrendingUp size={28} strokeWidth={2.5} className="text-white" />
                        </div>
                        <span className="text-xl font-black tracking-tighter uppercase text-white font-outfit">Marido Produtivo</span>
                    </div>

                    <div className="max-w-lg">
                        <h2 className="text-6xl font-black text-white leading-[1.1] mb-8 font-outfit">
                            Assuma o <span className="text-indigo-400">comando</span> do seu dia.
                        </h2>
                        <div className="space-y-6">
                            <div className="flex items-start gap-4">
                                <div className="mt-1 bg-white/5 p-2 rounded-lg border border-white/10 shrink-0">
                                    <ShieldCheck size={20} className="text-indigo-400" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-white mb-1">Liderança Consciente</h4>
                                    <p className="text-slate-400 text-sm leading-relaxed">Não se trata apenas de tarefas, mas de cuidar das frentes que importam para sua família.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="mt-1 bg-white/5 p-2 rounded-lg border border-white/10 shrink-0">
                                    <Heart size={20} className="text-emerald-400" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-white mb-1">Legado e Foco</h4>
                                    <p className="text-slate-400 text-sm leading-relaxed">Pequenas vitórias diárias constroem um destino extraordinário.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-6 text-slate-500 border-t border-white/5 pt-8">
                        <div className="text-xs font-black tracking-[0.2em] uppercase">Estratégia</div>
                        <div className="w-1.5 h-1.5 bg-slate-700 rounded-full" />
                        <div className="text-xs font-black tracking-[0.2em] uppercase">Constância</div>
                        <div className="w-1.5 h-1.5 bg-slate-700 rounded-full" />
                        <div className="text-xs font-black tracking-[0.2em] uppercase">Impacto</div>
                    </div>
                </div>
            </div>

            {/* Right Side: Auth Form */}
            <div className="flex-1 flex flex-col justify-center items-center p-8 bg-[#020617] relative">
                {/* Mobile-only Logo */}
                <div className="lg:hidden mb-12 flex flex-col items-center">
                    <div className="bg-indigo-600 w-14 h-14 rounded-2xl shadow-2xl shadow-indigo-500/40 mb-4 flex items-center justify-center">
                        <TrendingUp size={28} strokeWidth={2.5} className="text-white" />
                    </div>
                    <h1 className="text-2xl font-black text-white uppercase font-outfit tracking-tighter">Marido Produtivo</h1>
                </div>

                <div className="w-full max-w-[400px]">
                    <div className="mb-10 text-center lg:text-left">
                        <h2 className="text-3xl font-black text-white mb-3 tracking-tight font-outfit">
                            {isSignUp ? 'Inicie sua jornada' : 'Boas-vindas'}
                        </h2>
                        <p className="text-slate-500 font-medium">
                            {isSignUp
                                ? 'Crie sua conta e comece a liderar seu tempo.'
                                : 'Acesse seu painel para continuar evoluindo.'}
                        </p>
                    </div>

                    <form onSubmit={handleAuth} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Seu E-mail</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-400 transition-colors" size={18} />
                                <input
                                    type="email"
                                    required
                                    placeholder="usuario@dominio.com"
                                    className="w-full bg-slate-900/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all placeholder:text-slate-700"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between px-1">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sua Senha</label>
                                {!isSignUp && (
                                    <button type="button" className="text-[10px] font-black text-indigo-500 uppercase tracking-widest hover:text-indigo-400 transition-colors">Esqueci a senha</button>
                                )}
                            </div>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-400 transition-colors" size={18} />
                                <input
                                    type="password"
                                    required
                                    placeholder="••••••••"
                                    className="w-full bg-slate-900/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all placeholder:text-slate-700"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-2xl text-[11px] font-bold animate-shake text-center">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black h-14 rounded-2xl shadow-[0_10px_40px_-10px_rgba(79,70,229,0.4)] transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 uppercase tracking-widest text-[12px] mt-2 group"
                        >
                            {loading ? (
                                <Loader2 className="animate-spin" size={20} />
                            ) : (
                                <>
                                    <span>{isSignUp ? 'Criar minha conta' : 'Entrar no dashboard'}</span>
                                    <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-12 text-center">
                        <p className="text-slate-500 text-sm font-medium">
                            {isSignUp ? 'Já faz parte da jornada?' : 'Novo por aqui?'}
                            <button
                                onClick={() => setIsSignUp(!isSignUp)}
                                className="ml-2 text-white font-black hover:text-indigo-400 transition-colors underline-offset-4 hover:underline"
                            >
                                {isSignUp ? 'Fazer Login' : 'Criar conta agora'}
                            </button>
                        </p>
                    </div>
                </div>

                {/* Secure Badge */}
                <div className="absolute bottom-8 flex items-center gap-2 text-[9px] text-slate-600 uppercase tracking-[0.2em] font-black">
                    <ShieldCheck size={12} className="text-slate-700" />
                    <span>Dados encriptados • Supabase Auth</span>
                </div>
            </div>
        </div>
    );
};
