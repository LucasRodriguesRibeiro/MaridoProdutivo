
import React, { useState, useEffect } from 'react';
import {
  ClipboardList,
  Calendar,
  CheckCircle2,
  History as HistoryIcon,
  LogOut,
  Menu,
  X,
  Plus,
  Trash2,
  ChevronRight,
  TrendingUp,
  Heart,
  Briefcase,
  Cross,
  Dumbbell,
  Home,
  DollarSign,
  Smile,
  Meh,
  Frown,
  BrainCircuit,
  CheckCircle,
  Loader2,
  ChevronDown,
  Pencil
} from 'lucide-react';
import { Task, LifeArea, RoutineEntry, ScheduleItem, DailyPlanning } from './types';
import { transformTextToTask, transformTextToSchedule } from './services/geminiService';
import { supabase } from './lib/supabase';
import { Auth } from './components/Auth';

// --- Utils ---
const getTodayStr = () => new Date().toISOString().split('T')[0];

const formatDateHuman = (dateStr: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T12:00:00'); // Mitigate timezone issues
  return new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' }).format(date);
};

const LifeAreaIcon = ({ area, className }: { area: LifeArea, className?: string }) => {
  switch (area) {
    case 'Casamento': return <Heart className={className} />;
    case 'Trabalho': return <Briefcase className={className} />;
    case 'Espiritual': return <Cross className={className} />;
    case 'Saúde': return <Dumbbell className={className} />;
    case 'Financeiro': return <DollarSign className={className} />;
    case 'Casa': return <Home className={className} />;
    default: return <ClipboardList className={className} />;
  }
};

// --- Mock Initial Data & State (removed for DB) ---
const INITIAL_ROUTINE_ACTIVITIES = { prayer: false, reading: false, workout: false, spouseTime: false, planning: false };

// --- Components ---

const Sidebar = ({ activeTab, setActiveTab, setIsMenuOpen }: any) => {
  const tabs = [
    { id: 'tasks', label: 'Tarefas', icon: ClipboardList, description: 'Minha lista de ação' },
    { id: 'planning', label: 'Planejamento', icon: Calendar, description: 'Direção e intenção' },
    { id: 'routine', label: 'Minha Base', icon: CheckCircle2, description: 'Rotina e constância' },
    { id: 'history', label: 'Vitórias', icon: HistoryIcon, description: 'O que já conquistamos' },
  ];

  return (
    <div className="flex flex-col h-full bg-[#0f172a] text-slate-100 p-6 pt-10">
      <div className="flex items-center gap-3 px-2 mb-12">
        <div className="bg-indigo-600 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
          <TrendingUp size={22} className="text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold leading-tight tracking-tight">Marido <span className="text-indigo-400">Produtivo</span></h1>
          <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Liderança e Foco</p>
        </div>
      </div>

      <nav className="flex-1 space-y-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setIsMenuOpen(false); }}
            className={`w-full flex items-start gap-4 px-4 py-4 rounded-2xl transition-all duration-300 group ${activeTab === tab.id
              ? 'bg-white/10 text-white border border-white/10 shadow-xl'
              : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'
              }`}
          >
            <div className={`mt-0.5 p-2 rounded-lg transition-colors ${activeTab === tab.id ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-500 group-hover:bg-slate-700'}`}>
              <tab.icon size={20} />
            </div>
            <div className="text-left">
              <span className="block font-bold text-sm tracking-wide">{tab.label}</span>
              <span className="block text-[11px] text-slate-500 font-medium">{tab.description}</span>
            </div>
          </button>
        ))}
      </nav>

      <div className="mt-auto pt-6">
        <button
          onClick={() => supabase.auth.signOut()}
          className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all group"
        >
          <LogOut size={18} className="group-hover:translate-x-0.5 transition-transform" />
          <span className="font-bold text-sm">Sair do sistema</span>
        </button>
      </div>
    </div>
  );
};

// --- View: Tasks ---
const TasksView = ({ tasks, setTasks, onDelete }: { tasks: Task[], setTasks: React.Dispatch<React.SetStateAction<Task[]>>, onDelete: (id: string) => void }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', area: 'Trabalho' as LifeArea, deadline: '' });
  const [isAdding, setIsAdding] = useState(false);

  const isOverdue = (deadline?: string) => {
    if (!deadline) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(deadline) < today;
  };

  const toggleTask = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('marido_tasks')
      .update({ completed: !currentStatus })
      .eq('id', id);

    if (!error) {
      setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !currentStatus } : t));
    }
  };

  const addTask = async (e?: React.FormEvent, quickTitle?: string) => {
    if (e) e.preventDefault();
    const title = quickTitle || newTask.title;
    if (!title.trim()) return;

    setIsAdding(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setIsAdding(false);
      return;
    }

    const taskData = {
      user_id: user.id,
      title: title,
      area: quickTitle ? 'Casa' : newTask.area,
      deadline: quickTitle ? null : (newTask.deadline || null),
      completed: false
    };

    const { data, error } = await supabase
      .from('marido_tasks')
      .insert([taskData])
      .select()
      .single();

    if (!error && data) {
      setTasks([data, ...tasks]);
      setNewTask({ title: '', area: 'Trabalho', deadline: '' });
      setShowAdd(false);
    }
    setIsAdding(false);
  };

  // Filters & Sorting
  const [filterArea, setFilterArea] = useState<LifeArea | 'Todas'>('Todas');

  const pendingTasks = tasks
    .filter(t => !t.completed)
    .filter(t => filterArea === 'Todas' ? true : t.area === filterArea)
    .sort((a, b) => {
      const aOverdue = isOverdue(a.deadline);
      const bOverdue = isOverdue(b.deadline);
      if (aOverdue && !bOverdue) return -1;
      if (!aOverdue && bOverdue) return 1;

      if (a.deadline && b.deadline) return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      if (a.deadline) return -1;
      if (b.deadline) return 1;

      return 0;
    });

  const overdueCount = pendingTasks.filter(t => isOverdue(t.deadline)).length;

  const areaOptions: (LifeArea | 'Todas')[] = ['Todas', 'Casamento', 'Trabalho', 'Espiritual', 'Saúde', 'Financeiro', 'Casa'];

  return (
    <div className="view-enter max-w-2xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div className="flex items-center gap-6">
          <div className="bg-indigo-600 w-16 h-16 rounded-[24px] flex items-center justify-center text-white shadow-xl shadow-indigo-600/20 shrink-0">
            <ClipboardList size={28} />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight font-outfit uppercase">Lista de Ação</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-slate-500 font-medium text-sm">{pendingTasks.length} frentes pendentes</span>
              {overdueCount > 0 && (
                <span className="flex items-center gap-1 text-red-500 font-bold text-[10px] uppercase tracking-wider bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
                  {overdueCount} em atraso
                </span>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 h-14 rounded-2xl shadow-xl shadow-indigo-600/20 flex items-center gap-3 transition-all hover:scale-105 active:scale-95 group ml-auto md:ml-0 font-bold"
        >
          <Plus size={20} className="group-hover:rotate-90 transition-transform" />
          <span>Novo Objetivo</span>
        </button>
      </div>

      {/* Filter Area - New UX Element */}
      <div className="flex gap-2 mb-8 overflow-x-auto no-scrollbar pb-1">
        {areaOptions.map(area => (
          <button
            key={area}
            onClick={() => setFilterArea(area)}
            className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border-2 ${filterArea === area
              ? 'bg-slate-900 border-slate-900 text-white shadow-lg'
              : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
              }`}
          >
            {area}
          </button>
        ))}
      </div>

      {/* Quick Add Input - Premium Experience */}
      <div className="mb-10 group">
        <div className="relative">
          <input
            type="text"
            placeholder="No que vamos focar agora? (Pressione Enter)"
            className="w-full bg-white border-2 border-slate-100 rounded-[28px] pl-12 md:pl-14 pr-24 h-14 md:h-16 text-slate-700 font-bold text-base md:text-lg placeholder:text-slate-300 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all shadow-sm"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                addTask(undefined, e.currentTarget.value);
                e.currentTarget.value = '';
              }
            }}
          />
          <div className="absolute left-4 md:left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors">
            <Plus size={24} />
          </div>
          <div className="absolute right-5 top-1/2 -translate-y-1/2">
            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100">Quick Add</span>
          </div>
        </div>
      </div>

      {/* Tasks List */}
      <div className="space-y-4">
        {pendingTasks.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[48px] border border-dashed border-slate-200 shadow-sm relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-50/50 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10">
              <div className="bg-slate-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                <CheckCircle size={40} className="text-emerald-400" />
              </div>
              <h4 className="text-slate-900 font-black text-xl mb-2 font-outfit uppercase tracking-tight">Território Dominado</h4>
              <p className="text-slate-400 font-medium px-10 leading-relaxed max-w-xs mx-auto">
                Todas as frentes de ação foram vencidas. Sua mente está livre para liderar com clareza e autoridade.
              </p>
            </div>
          </div>
        ) : (
          pendingTasks.map(task => {
            const overdue = isOverdue(task.deadline);
            return (
              <div
                key={task.id}
                className={`bg-white p-5 md:p-6 rounded-[24px] md:rounded-[32px] border transition-all duration-300 flex items-center gap-4 md:gap-5 shadow-sm hover:shadow-md hover:border-indigo-100 group relative overflow-hidden ${overdue ? 'border-red-100 bg-red-50/30' : 'border-slate-100'}`}
              >
                {/* Overdue Indicator Bar */}
                {overdue && (
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-red-500" />
                )}

                {/* Custom Checkbox - Optimized Touch Target */}
                <button
                  onClick={() => toggleTask(task.id, task.completed)}
                  className={`h-11 w-11 rounded-xl border-2 shrink-0 flex items-center justify-center transition-all duration-500 ${overdue ? 'border-red-200 bg-white' : 'border-slate-200 hover:border-indigo-400 hover:scale-110 bg-white'}`}
                >
                  <div className="h-5 w-5 rounded-full bg-indigo-600 scale-0 transition-transform group-active:scale-100" />
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1.5">
                    <LifeAreaIcon area={task.area} className={`w-4 h-4 ${overdue ? 'text-red-500' : 'text-indigo-500'}`} />
                    <span className={`text-[10px] font-black uppercase tracking-[0.15em] ${overdue ? 'text-red-400' : 'text-slate-400'}`}>
                      {task.area}
                    </span>
                  </div>
                  <h3 className={`font-bold text-base md:text-lg leading-snug tracking-tight mb-1 transition-colors ${overdue ? 'text-red-900' : 'text-slate-800'}`}>
                    {task.title}
                  </h3>
                  {task.deadline && (
                    <div className="flex items-center gap-1.5">
                      <Calendar size={12} className={overdue ? 'text-red-400' : 'text-slate-400'} />
                      <span className={`text-xs font-bold tracking-tight ${overdue ? 'text-red-500' : 'text-slate-400'}`}>
                        {overdue ? 'Atrasado: ' : 'Até: '} {new Date(task.deadline + 'T12:00:00').toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                {/* Actions - Visible on mobile swap/long press logic if needed, but keeping hover for desktop. Mobile actions could be swipe? For now, we allow them to show always on mobile or specific layout. */}
                <div className="flex md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onDelete(task.id)}
                    className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                    title="Excluir objetivo"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Refined Modal Add Task */}
      {showAdd && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[100] flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[32px] md:rounded-[48px] p-6 md:p-10 shadow-2xl animate-in slide-in-from-bottom-12 duration-500 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-50" />

            <div className="relative z-10">
              <div className="flex justify-between items-center mb-10">
                <div className="flex items-center gap-4">
                  <div className="bg-indigo-600 w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-600/20 text-white">
                    <Plus size={24} strokeWidth={3} />
                  </div>
                  <div>
                    <h3 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight font-outfit uppercase">Novo Objetivo</h3>
                    <p className="text-slate-500 text-sm font-medium">Defina seu próximo passo estratégico.</p>
                  </div>
                </div>
                <button onClick={() => setShowAdd(false)} className="w-12 h-12 flex items-center justify-center bg-slate-50 text-slate-400 hover:text-slate-600 rounded-2xl transition-all hover:rotate-90">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={addTask} className="space-y-8">
                <div className="group">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 px-1 group-focus-within:text-indigo-600 transition-colors">O que você vai dominar?</label>
                  <input
                    autoFocus
                    required
                    className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-3xl p-4 md:p-5 text-lg font-bold text-slate-800 placeholder:text-slate-300 transition-all outline-none"
                    value={newTask.title}
                    onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                    placeholder="Ex: Definir orçamento familiar mensal"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 px-1">Área da Vida</label>
                    <div className="relative">
                      <select
                        className="w-full appearance-none bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-3xl p-5 font-bold text-slate-800 outline-none transition-all cursor-pointer"
                        value={newTask.area}
                        onChange={e => setNewTask({ ...newTask, area: e.target.value as LifeArea })}
                      >
                        <option value="Casamento">💍 Casamento</option>
                        <option value="Trabalho">💼 Trabalho</option>
                        <option value="Espiritual">🙏 Espiritual</option>
                        <option value="Saúde">💪 Saúde</option>
                        <option value="Financeiro">💰 Financeiro</option>
                        <option value="Casa">🏠 Casa</option>
                      </select>
                      <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <ChevronRight size={20} className="rotate-90" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 px-1">Meta de Entrega</label>
                    <div className="relative">
                      <input
                        type="date"
                        className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-3xl p-5 font-bold text-slate-800 outline-none transition-all cursor-pointer"
                        value={newTask.deadline}
                        onChange={e => setNewTask({ ...newTask, deadline: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isAdding}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black h-18 rounded-[32px] shadow-2xl shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 text-lg uppercase tracking-widest flex items-center justify-center gap-3"
                  >
                    {isAdding ? (
                      <>
                        <Loader2 className="animate-spin" size={24} />
                        <span>Sincronizando...</span>
                      </>
                    ) : (
                      <>
                        <span>Confirmar Objetivo</span>
                        <Plus size={24} />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- View: Planning ---
const PlanningView = () => {
  const [viewMode, setViewMode] = useState<'list' | 'create' | 'detail'>('list');
  const [plans, setPlans] = useState<DailyPlanning[]>([]);
  const [activePlan, setActivePlan] = useState<DailyPlanning | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper to persist changes to a specific plan
  const persistPlanItems = async (planId: string, items: ScheduleItem[]) => {
    const { error } = await supabase
      .from('marido_planning')
      .update({ items })
      .eq('id', planId);

    if (error) console.error('Error persisting items:', error);
  };

  const toggleItemCompletion = (itemId: string) => {
    if (!activePlan) return;

    const updatedItems = activePlan.items.map(item =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );

    // Optimistic update
    const updatedPlan = { ...activePlan, items: updatedItems };
    setActivePlan(updatedPlan);

    setPlans(prev => prev.map(p =>
      p.id === activePlan.id ? updatedPlan : p
    ));

    // Persist to DB
    persistPlanItems(activePlan.id, updatedItems);
  };

  // Form states for creation
  // Form states for creation
  const [createDate, setCreateDate] = useState(getTodayStr());
  const [dayDrafts, setDayDrafts] = useState<Record<string, ScheduleItem[]>>({});
  const [showDateSelector, setShowDateSelector] = useState(false);
  const [newStartTime, setNewStartTime] = useState('');
  const [newEndTime, setNewEndTime] = useState('');
  const [newActivity, setNewActivity] = useState('');

  // --- Detail View State ---
  const [showItemForm, setShowItemForm] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  const handleEditItem = (item: ScheduleItem) => {
    const [start, end] = item.time.split(' - ');
    setNewStartTime(start);
    setNewEndTime(end || '');
    setNewActivity(item.task);
    setEditingItemId(item.id);
    setShowItemForm(true);
  };

  const handleAddItem = () => {
    setNewStartTime('');
    setNewEndTime('');
    setNewActivity('');
    setEditingItemId(null);
    setShowItemForm(true);
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!activePlan) return;
    if (!confirm('Tem certeza que deseja remover este item?')) return;

    const updatedItems = activePlan.items.filter(i => i.id !== itemId);
    const updatedPlan = { ...activePlan, items: updatedItems };
    setActivePlan(updatedPlan);
    setPlans(prev => prev.map(p => p.id === activePlan.id ? updatedPlan : p));
    await persistPlanItems(activePlan.id, updatedItems);
  };

  const handleSaveActiveItem = async () => {
    if (!activePlan || !newStartTime || !newActivity) return;

    const timeRange = newEndTime ? `${newStartTime} - ${newEndTime}` : newStartTime;
    const newItem: ScheduleItem = {
      id: editingItemId || Math.random().toString(36).substr(2, 9),
      time: timeRange,
      task: newActivity,
      completed: editingItemId ? activePlan.items.find(i => i.id === editingItemId)?.completed || false : false
    };

    let updatedItems;
    if (editingItemId) {
      updatedItems = activePlan.items.map(i => i.id === editingItemId ? newItem : i);
    } else {
      updatedItems = [...activePlan.items, newItem];
    }

    // Sort by time
    updatedItems.sort((a, b) => a.time.localeCompare(b.time));

    const updatedPlan = { ...activePlan, items: updatedItems };
    setActivePlan(updatedPlan);
    setPlans(prev => prev.map(p => p.id === activePlan.id ? updatedPlan : p)); // Optimistically update list
    await persistPlanItems(activePlan.id, updatedItems);

    setShowItemForm(false);
    setNewStartTime('');
    setNewEndTime('');
    setNewActivity('');
    setEditingItemId(null);
  };

  // Derived state for current view
  const createItems = dayDrafts[createDate] || [];

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: dbPlans, error } = await supabase
      .from('marido_planning')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    if (!error && dbPlans) {
      const formattedPlans = dbPlans.map(p => ({
        id: p.id,
        userId: p.user_id,
        date: p.date,
        dayName: p.day_name,
        items: p.items || []
      }));
      setPlans(formattedPlans);
    }
    setLoading(false);
  };

  const saveRoutine = async () => {
    if (!createDate) return;

    if (createItems.length === 0) {
      alert("Adicione ao menos uma atividade para finalizar o dia.");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const newPlan = {
      user_id: user.id,
      date: createDate,
      day_name: formatDateHuman(createDate),
      items: createItems,
      type: 'daily',
      content: {}
    };

    const { data: created, error } = await supabase
      .from('marido_planning')
      .insert([newPlan])
      .select()
      .single();

    if (error) {
      console.error(error);
      alert(`Erro ao salvar a rotina: ${error.message}`);
      return;
    }

    if (created) {
      const formatted = {
        id: created.id,
        userId: created.user_id,
        date: created.date,
        dayName: created.day_name,
        items: created.items
      };
      setPlans(prev => [formatted, ...prev].sort((a, b) => b.date.localeCompare(a.date)));

      // Clear draft for this date
      setDayDrafts(prev => {
        const next = { ...prev };
        delete next[createDate];
        return next;
      });

      setCreateDate(getTodayStr());
      setViewMode('list');
      alert('Rotina criada com sucesso');
    }
  };

  const addActivity = () => {
    if (!newStartTime || !newActivity) return;
    const timeRange = newEndTime ? `${newStartTime} - ${newEndTime}` : newStartTime;
    const newItem: ScheduleItem = {
      id: Math.random().toString(36).substr(2, 9),
      time: timeRange,
      task: newActivity
    };

    setDayDrafts(prev => {
      const current = prev[createDate] || [];
      const updated = [...current, newItem].sort((a, b) => a.time.localeCompare(b.time));
      return { ...prev, [createDate]: updated };
    });

    setNewStartTime('');
    setNewEndTime('');
    setNewActivity('');
  };

  const removeCreateItem = (id: string) => {
    setDayDrafts(prev => {
      const current = prev[createDate] || [];
      return {
        ...prev,
        [createDate]: current.filter(item => item.id !== id)
      };
    });
  };

  const deletePlan = async (id: string) => {
    const { error } = await supabase.from('marido_planning').delete().eq('id', id);
    if (!error) {
      setPlans(prev => prev.filter(p => p.id !== id));
      if (activePlan?.id === id) setViewMode('list');
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-600" size={40} /></div>;

  // --- LIST MODE ---
  if (viewMode === 'list') {
    return (
      <div className="view-enter max-w-4xl mx-auto pb-32">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
          <div className="space-y-2">
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight font-outfit uppercase leading-none">
              Meus <span className="text-indigo-600">Cronogramas</span>
            </h2>
            <p className="text-slate-500 font-medium text-lg">Histórico de planejamento estratégico.</p>
          </div>
          <button
            onClick={() => setViewMode('create')}
            className="bg-slate-900 hover:bg-black text-white px-10 py-5 rounded-[32px] font-black uppercase tracking-widest text-xs flex items-center gap-4 transition-all shadow-2xl active:scale-95 group"
          >
            <Plus size={20} className="group-hover:rotate-90 transition-transform" />
            Novo Dia
          </button>
        </div>

        {plans.length === 0 ? (
          <div className="text-center py-40 bg-white rounded-[64px] border border-dashed border-slate-200">
            <Calendar size={64} className="text-slate-200 mx-auto mb-8" />
            <h3 className="text-2xl font-black text-slate-900 mb-2 font-outfit uppercase">Inicie sua Jornada</h3>
            <p className="text-slate-500 font-medium max-w-xs mx-auto">Você ainda não tem rotinas planejadas. Comece agora!</p>
            <button
              onClick={() => setViewMode('create')}
              className="mt-8 bg-indigo-600 text-white px-10 py-5 rounded-[24px] font-black uppercase tracking-widest text-xs hover:bg-indigo-700 transition-all"
            >
              Planejar meu dia
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {plans.map(p => (
              <div
                key={p.id}
                onClick={() => { setActivePlan(p); setViewMode('detail'); }}
                className="bg-white p-6 md:p-8 rounded-[32px] md:rounded-[48px] border border-slate-100 shadow-sm hover:shadow-2xl hover:border-indigo-100 transition-all group cursor-pointer relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-slate-50 p-3 rounded-2xl group-hover:bg-indigo-50 transition-colors">
                    <ChevronRight size={20} className="text-slate-400 group-hover:text-indigo-600" />
                  </div>
                </div>
                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-3 block">
                  {formatDateHuman(p.date).split(',')[0]}
                </span>
                <h3 className="text-3xl font-black text-slate-900 font-outfit mb-4">
                  {new Date(p.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
                </h3>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${new Date(p.date + 'T12:00:00').getTime() < new Date().setHours(0, 0, 0, 0) ? 'bg-emerald-400' : 'bg-indigo-400'}`} />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {new Date(p.date + 'T12:00:00').getTime() < new Date().setHours(0, 0, 0, 0) ? 'Concluído' : 'Planejado'}
                    </span>
                    <span className="text-[10px] font-black text-slate-200 uppercase tracking-widest">•</span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {p.items.length} ITENS
                    </span>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); deletePlan(p.id); }}
                    className="p-3 text-slate-300 hover:text-red-500 rounded-xl transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // --- CREATE MODE ---
  if (viewMode === 'create') {
    return (
      <div className="view-enter max-w-6xl mx-auto pb-32">
        <div className="flex items-center gap-6 mb-12">
          <button onClick={() => setViewMode('list')} className="w-14 h-14 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors shadow-sm">
            <X size={24} />
          </button>
          <div>
            <h2 className="text-4xl font-black text-slate-900 font-outfit uppercase tracking-tight">Planejar meu dia</h2>
            <p className="text-slate-500 font-medium">Defina sua estratégia de domínio.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left Column: Form */}
          <div className="lg:col-span-5 space-y-10">
            {/* Date Selector */}
            <div className="relative z-50">
              <button
                onClick={() => setShowDateSelector(!showDateSelector)}
                className="w-full bg-white p-6 md:p-10 rounded-[40px] md:rounded-[56px] border border-slate-100 shadow-xl shadow-slate-200/20 text-left relative group hover:border-indigo-200 transition-all active:scale-[0.99] active:shadow-sm"
              >
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 group-hover:text-indigo-500 transition-colors pointer-events-none">
                  Data do Cronograma
                </label>
                <div className="flex items-center gap-6 pointer-events-none">
                  <div className="w-16 h-16 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 shadow-lg shadow-indigo-100">
                    <Calendar size={28} />
                  </div>
                  <div>
                    <div className="text-3xl font-black text-slate-900 font-outfit capitalize tracking-tight mb-1">
                      {new Date(createDate + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long' })}
                    </div>
                    <div className="text-sm font-bold text-slate-400 group-hover:text-indigo-500 transition-colors">
                      {new Date(createDate + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </div>
                  </div>
                </div>
                <div className="absolute right-10 top-1/2 -translate-y-1/2 text-slate-300 group-hover:text-indigo-600 transition-colors group-hover:translate-y-1 duration-300">
                  <ChevronDown size={28} />
                </div>
              </button>

              {/* Dropdown List */}
              {showDateSelector && (
                <div className="absolute top-full left-0 right-0 mt-4 bg-white rounded-[40px] border border-slate-100 shadow-2xl overflow-hidden p-4 animate-in slide-in-from-top-2 fade-in duration-200 z-50">
                  {Array.from({ length: 7 }, (_, i) => {
                    const d = new Date();
                    d.setDate(d.getDate() + i);
                    const iso = d.toISOString().split('T')[0];
                    const isSelected = iso === createDate;

                    return (
                      <button
                        key={iso}
                        onClick={() => { setCreateDate(iso); setShowDateSelector(false); }}
                        className={`w-full flex items-center gap-4 p-4 rounded-[24px] mb-2 last:mb-0 transition-all ${isSelected
                          ? 'bg-indigo-50 text-indigo-900'
                          : 'hover:bg-slate-50 text-slate-500 hover:text-slate-900'
                          }`}
                      >
                        <div className={`w-2 h-2 rounded-full ${isSelected ? 'bg-indigo-600' : 'bg-slate-200'}`} />
                        <span className="font-bold uppercase text-xs tracking-widest w-24 text-left">
                          {d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}
                        </span>
                        <span className="font-outfit font-black text-lg">
                          {d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                        </span>
                        {isSelected && <CheckCircle2 size={16} className="ml-auto text-indigo-600" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="bg-white p-6 md:p-10 rounded-[40px] md:rounded-[56px] border border-slate-100 shadow-xl shadow-slate-200/20">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8">O que vou fazer</h3>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative">
                    <input
                      type="time"
                      value={newStartTime}
                      onChange={e => setNewStartTime(e.target.value)}
                      className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2x p-5 font-bold text-slate-900 outline-none transition-all"
                    />
                    <span className="absolute -top-2 left-6 px-2 bg-white text-[9px] font-black text-indigo-500 uppercase tracking-widest">Início</span>
                  </div>
                  <div className="relative">
                    <input
                      type="time"
                      value={newEndTime}
                      onChange={e => setNewEndTime(e.target.value)}
                      className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2x p-5 font-bold text-slate-900 outline-none transition-all"
                    />
                    <span className="absolute -top-2 left-6 px-2 bg-white text-[9px] font-black text-indigo-500 uppercase tracking-widest">Fim</span>
                  </div>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={newActivity}
                    onChange={e => setNewActivity(e.target.value)}
                    placeholder="Ex: Treino de alta intensidade"
                    className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2x p-5 font-bold text-slate-900 outline-none transition-all"
                  />
                  <span className="absolute -top-2 left-6 px-2 bg-white text-[9px] font-black text-indigo-500 uppercase tracking-widest">Atividade</span>
                </div>

                <button
                  onClick={addActivity}
                  disabled={!newStartTime || !newActivity}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-6 rounded-[28px] uppercase tracking-widest text-xs transition-all active:scale-95 disabled:opacity-50 shadow-xl shadow-indigo-200"
                >
                  Adicionar à Rotina
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Preview */}
          <div className="lg:col-span-7">
            <div className="bg-slate-900 rounded-[40px] md:rounded-[56px] p-6 md:p-10 min-h-[400px] md:min-h-[600px] flex flex-col shadow-2xl">
              <div className="flex items-center justify-between mb-10">
                <h3 className="text-indigo-400 font-black text-[10px] uppercase tracking-[0.3em]">Pré-visualização</h3>
                <span className="text-white/40 text-[9px] font-black uppercase tracking-widest">{createItems.length} ITENS</span>
              </div>

              <div className="flex-1 space-y-4">
                {createItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-white/20">
                    <TrendingUp size={48} className="mb-4" />
                    <p className="font-bold text-sm">Sua rotina surgirá aqui...</p>
                  </div>
                ) : (
                  createItems.map((item, idx) => (
                    <div key={item.id} className="flex items-center gap-6 bg-white/5 border border-white/10 p-5 rounded-[28px] group animate-in slide-in-from-right duration-500" style={{ animationDelay: `${idx * 50}ms` }}>
                      <div className="bg-white/10 px-4 py-2 rounded-xl text-indigo-400 text-xs font-black min-w-[120px] text-center">
                        {item.time}
                      </div>
                      <div className="flex-1 text-white font-bold tracking-tight">
                        {item.task}
                      </div>
                      <button onClick={() => removeCreateItem(item.id)} className="text-white/20 hover:text-red-400 transition-colors p-2">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              <button
                onClick={saveRoutine}
                disabled={createItems.length === 0}
                className="mt-10 w-full bg-white hover:bg-indigo-50 text-slate-900 font-black py-6 rounded-[28px] uppercase tracking-widest text-sm transition-all active:scale-95 disabled:opacity-30 shadow-2xl"
              >
                Finalizar Dia
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- DETAIL MODE ---
  if (viewMode === 'detail' && activePlan) {
    return (
      <div className="view-enter max-w-3xl mx-auto pb-32">
        <div className="flex items-center justify-between mb-16">
          <button onClick={() => setViewMode('list')} className="w-14 h-14 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors shadow-sm">
            <X size={24} />
          </button>
          <div className="text-center">
            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] block mb-2">
              {new Date(activePlan.date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long' })}
            </span>
            <h2 className="text-4xl font-black text-slate-900 font-outfit uppercase tracking-tighter">
              {new Date(activePlan.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
            </h2>
          </div>
          <div className="w-14 h-14" /> {/* Spacer */}
        </div>

        {/* Progress Bar for Execution Mode */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Progresso do Dia</span>
            <span className="text-xs font-black text-indigo-600 uppercase tracking-widest">
              {activePlan.items.filter(i => i.completed).length}/{activePlan.items.length} COMPLETED
            </span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 transition-all duration-500"
              style={{ width: `${(activePlan.items.filter(i => i.completed).length / activePlan.items.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="space-y-6 relative">
          <div className="absolute left-[39px] top-8 bottom-8 w-px bg-slate-100 hidden md:block" />

          {activePlan.items.map((item, idx) => (
            <div
              key={item.id}
              className={`relative flex items-center gap-10 group transition-all duration-500 ${item.completed ? 'opacity-50' : 'opacity-100'}`}
            >
              <div
                onClick={() => toggleItemCompletion(item.id)}
                className={`hidden md:flex shrink-0 w-20 h-20 rounded-[28px] border items-center justify-center font-black text-sm shadow-sm z-10 cursor-pointer transition-all hover:scale-105 active:scale-95 ${item.completed
                  ? 'bg-emerald-500 border-emerald-500 text-white'
                  : 'bg-white border-slate-50 text-indigo-600 hover:border-indigo-200'
                  }`}
              >
                {item.completed ? <CheckCircle2 size={24} /> : item.time.split(' - ')[0]}
              </div>

              <div
                onClick={() => toggleItemCompletion(item.id)}
                className={`flex-1 p-5 md:p-8 rounded-[32px] md:rounded-[40px] border shadow-sm flex items-center gap-4 md:gap-6 cursor-pointer transition-all hover:shadow-md active:scale-[0.99] ${item.completed
                  ? 'bg-emerald-50/50 border-emerald-100'
                  : 'bg-white border-slate-50 hover:border-indigo-50'
                  }`}
              >
                <div className={`w-1.5 h-12 rounded-full shrink-0 transition-colors ${item.completed ? 'bg-emerald-400' : 'bg-indigo-600'}`} />
                <div className="flex-1">
                  <div className="md:hidden flex items-center justify-between mb-1">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${item.completed ? 'text-emerald-600' : 'text-indigo-500'}`}>{item.time}</span>
                    {item.completed && <CheckCircle2 size={14} className="text-emerald-500" />}
                  </div>
                  <h4 className={`text-lg md:text-xl font-black tracking-tight leading-tight transition-all ${item.completed ? 'text-slate-400 line-through decoration-slate-300' : 'text-slate-900'}`}>{item.task}</h4>
                  <div className="hidden md:block text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Horário: {item.time}</div>
                </div>

                {/* Mobile Checkbox Visual */}
                <div className={`md:hidden shrink-0 w-11 h-11 rounded-full border-2 flex items-center justify-center transition-all ${item.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200 text-transparent'
                  }`}>
                  <CheckCircle2 size={20} />
                </div>

                {/* Actions */}
                <div className="hidden md:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-4 group-hover:translate-x-0">
                  <button onClick={(e) => { e.stopPropagation(); handleEditItem(item); }} className="p-3 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all" title="Editar">
                    <Pencil size={18} strokeWidth={2.5} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteItem(item.id); }} className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all" title="Excluir">
                    <Trash2 size={18} strokeWidth={2.5} />
                  </button>
                </div>
              </div>

              {/* Mobile Actions (Outside card for better touch targets) */}
              <div className="md:hidden flex flex-col gap-2 absolute right-0 top-1/2 -translate-y-1/2 translate-x-full pr-4 opacity-0 group-hover:opacity-100 transition-opacity">
                {/* Mobile specific logic if needed, but keeping simple for now */}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex justify-center">
          <button
            onClick={handleAddItem}
            className="group flex items-center gap-3 bg-white hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 px-6 py-4 rounded-[24px] font-black uppercase tracking-widest text-[10px] border border-slate-100 hover:border-indigo-200 transition-all shadow-sm hover:shadow-lg active:scale-95"
          >
            <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-indigo-600 text-slate-400 group-hover:text-white flex items-center justify-center transition-all">
              <Plus size={16} strokeWidth={3} />
            </div>
            Adicionar Atividade
          </button>
        </div>

        {/* Modal/Form for Adding/Editing */}
        {showItemForm && (
          <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div onClick={() => setShowItemForm(false)} className="absolute inset-0" />
            <div onClick={() => setShowItemForm(false)} className="absolute inset-0" />
            <div className="bg-white rounded-[32px] md:rounded-[48px] p-6 md:p-8 w-full max-w-lg shadow-2xl animate-in slide-in-from-bottom-10 relative z-10">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight font-outfit">{editingItemId ? 'Editar Atividade' : 'Nova Atividade'}</h3>
                <button onClick={() => setShowItemForm(false)} className="p-3 bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-2xl transition-all"><X size={20} /></button>
              </div>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative">
                    <input
                      type="time"
                      value={newStartTime}
                      onChange={e => setNewStartTime(e.target.value)}
                      className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl p-4 font-bold text-slate-900 outline-none transition-all"
                    />
                    <span className="absolute -top-2 left-4 px-2 bg-white text-[9px] font-black text-indigo-500 uppercase tracking-widest">Início</span>
                  </div>
                  <div className="relative">
                    <input
                      type="time"
                      value={newEndTime}
                      onChange={e => setNewEndTime(e.target.value)}
                      className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl p-4 font-bold text-slate-900 outline-none transition-all"
                    />
                    <span className="absolute -top-2 left-4 px-2 bg-white text-[9px] font-black text-indigo-500 uppercase tracking-widest">Fim</span>
                  </div>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={newActivity}
                    onChange={e => setNewActivity(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSaveActiveItem()}
                    placeholder="Ex: Leitura da Bíblia"
                    className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl p-4 font-bold text-slate-900 outline-none transition-all"
                    autoFocus
                  />
                  <span className="absolute -top-2 left-4 px-2 bg-white text-[9px] font-black text-indigo-500 uppercase tracking-widest">Atividade</span>
                </div>

                <button
                  onClick={handleSaveActiveItem}
                  disabled={!newStartTime || !newActivity}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-5 rounded-[24px] uppercase tracking-widest text-xs transition-all shadow-xl shadow-indigo-200 active:scale-95 disabled:opacity-50"
                >
                  Salvar Alterações
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-20 text-center">
          <button
            onClick={() => setViewMode('list')}
            className="text-slate-400 font-black text-[10px] uppercase tracking-[0.4em] hover:text-indigo-600 transition-colors"
          >
            Voltar ao Mapa Estratégico
          </button>
        </div>
      </div>
    );
  }

  return null;
};

// --- View: Routine ---
const RoutineView = () => {
  const [routine, setRoutine] = useState<RoutineEntry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRoutine();
  }, []);

  const fetchRoutine = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const today = getTodayStr();
    const { data, error } = await supabase
      .from('marido_routine')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error(error);
    } else if (data) {
      setRoutine(data);
    } else {
      const newRoutine = {
        user_id: user.id,
        date: today,
        activities: INITIAL_ROUTINE_ACTIVITIES
      };
      const { data: created, error: createError } = await supabase
        .from('marido_routine')
        .insert([newRoutine])
        .select()
        .single();

      if (!createError) setRoutine(created);
    }
    setLoading(false);
  };

  const toggle = async (key: keyof RoutineEntry['activities']) => {
    if (!routine) return;

    const updatedActivities = {
      ...routine.activities,
      [key]: !routine.activities[key]
    };

    const { error } = await supabase
      .from('marido_routine')
      .update({ activities: updatedActivities })
      .eq('id', routine.id);

    if (!error) {
      setRoutine({ ...routine, activities: updatedActivities });
    }
  };

  if (loading || !routine) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-600" size={40} /></div>;

  const items = [
    { key: 'prayer', label: 'Momento de Oração', sub: 'Conexão e gratidão', icon: Cross },
    { key: 'reading', label: 'Estudo e Leitura', sub: 'Expandindo a mente', icon: ClipboardList },
    { key: 'workout', label: 'Cuidar do Templo', sub: 'Saúde e energia', icon: Dumbbell },
    { key: 'spouseTime', label: 'Tempo de Qualidade', sub: 'Presença com a esposa', icon: Heart },
    { key: 'planning', label: 'Pausar e Planejar', sub: 'Direção para o dia', icon: Calendar },
  ];

  const completedCount = Object.values(routine.activities).filter(v => v).length;
  const progress = (completedCount / items.length) * 100;
  const isAllDone = completedCount === items.length;

  return (
    <div className="view-enter">
      <div className="mb-10">
        <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Minha Base</h2>
        <p className="text-slate-500 font-medium">O que você já cuidou hoje? Pequenas vitórias diárias.</p>
      </div>

      <div className="bg-white rounded-[40px] p-8 border border-slate-100 shadow-xl shadow-indigo-500/5 mb-10 overflow-hidden relative">
        <div className="relative z-10">
          <div className="flex justify-between items-end mb-6">
            <div>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Ritmo Diário</p>
              <h3 className="text-4xl font-black text-slate-900 leading-none">
                {completedCount} <span className="text-slate-200 text-2xl mx-1">/</span> {items.length}
              </h3>
            </div>
            <div className={`px-4 py-1.5 rounded-full text-xs font-black tracking-widest uppercase transition-all ${isAllDone ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-indigo-50 text-indigo-600'}`}>
              {isAllDone ? 'Extraordinário' : `${Math.round(progress)}%`}
            </div>
          </div>
          <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden p-1">
            <div
              className={`h-full rounded-full transition-all duration-1000 cubic-bezier(0.34, 1.56, 0.64, 1) ${isAllDone ? 'bg-emerald-500 shadow-lg shadow-emerald-500/20' : 'bg-indigo-600'}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Subtle background decoration */}
        <div className="absolute top-0 right-0 -transtale-y-1/2 translate-x-1/2 w-40 h-40 bg-indigo-50 rounded-full blur-3xl opacity-50" />
      </div>

      <div className="grid gap-4">
        {items.map((item) => {
          const isDone = routine.activities[item.key as keyof RoutineEntry['activities']];
          return (
            <button
              key={item.key}
              onClick={() => toggle(item.key as any)}
              className={`w-full flex items-center gap-4 md:gap-5 p-4 md:p-5 pr-6 rounded-[24px] md:rounded-[32px] border transition-all duration-300 group relative overflow-hidden ${isDone
                ? 'bg-white border-indigo-100 shadow-md translate-x-1'
                : 'bg-white border-slate-100 hover:border-indigo-100 hover:shadow-sm'
                }`}
            >
              <div className={`p-3 md:p-3.5 rounded-2xl transition-all duration-500 ${isDone ? 'bg-indigo-600 text-white scale-110 shadow-lg shadow-indigo-600/20' : 'bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600'}`}>
                <item.icon size={24} strokeWidth={2.5} />
              </div>
              <div className="flex-1 text-left min-w-0">
                <span className={`block font-bold text-base md:text-lg leading-tight transition-colors ${isDone ? 'text-indigo-950' : 'text-slate-700'}`}>
                  {item.label}
                </span>
                <span className={`block text-xs font-medium mt-0.5 transition-colors ${isDone ? 'text-indigo-400' : 'text-slate-400'}`}>
                  {item.sub}
                </span>
              </div>
              <div className={`h-11 w-11 rounded-xl border-2 flex items-center justify-center transition-all duration-500 shrink-0 ${isDone
                ? 'bg-emerald-500 border-emerald-500 text-white rotate-0'
                : 'border-slate-100 rotate-[-15deg] group-hover:rotate-0'
                }`}>
                {isDone && <CheckCircle2 size={18} strokeWidth={3} className="animate-check" />}
              </div>

              {/* Discrete indicator for done items */}
              {isDone && (
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-indigo-600" />
              )}
            </button>
          );
        })}
      </div>

      <p className="mt-10 text-center text-slate-400 text-[11px] font-medium px-10 leading-relaxed">
        Estes itens representam sua estabilidade como homem. Não são tarefas mutáveis, mas os pilares do seu dia. Reseta automaticamente a cada manhã.
      </p>
    </div>
  );
};

// --- View: History (Completed Tasks) ---
const HistoryView = ({ tasks, onDelete }: { tasks: Task[], onDelete: (id: string) => void }) => {
  const completedTasks = tasks.filter(t => t.completed);

  return (
    <div className="view-enter max-w-2xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div className="flex items-center gap-6">
          <div className="bg-emerald-500 w-16 h-16 rounded-[24px] flex items-center justify-center text-white shadow-xl shadow-emerald-500/20 shrink-0">
            <CheckCircle size={28} />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight font-outfit uppercase">Vitórias</h2>
            <p className="text-slate-500 font-medium mt-1">Celebrando seu progresso.</p>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 rounded-[40px] p-8 text-white mb-10 overflow-hidden relative shadow-2xl shadow-slate-900/20">
        <div className="relative z-10 flex items-center gap-6">
          <div className="bg-emerald-500 p-5 rounded-3xl shadow-lg shadow-emerald-500/20">
            <TrendingUp size={32} className="text-white" />
          </div>
          <div>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Impacto Acumulado</p>
            <h3 className="text-3xl font-black">{completedTasks.length} objetivos atingidos</h3>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
      </div>

      <div className="space-y-4">
        {completedTasks.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-[48px] border border-dashed border-slate-200">
            <p className="text-slate-400 font-medium px-10 leading-relaxed uppercase tracking-widest text-[11px] font-black">
              Suas conquistas aparecerão aqui. <br />Dê o primeiro passo agora.
            </p>
          </div>
        ) : (
          completedTasks.map(task => (
            <div key={task.id} className="bg-white p-5 md:p-6 rounded-[24px] md:rounded-[32px] border border-slate-100 flex items-center gap-4 md:gap-5 group hover:shadow-md transition-all">
              <div className="text-emerald-500 bg-emerald-50 w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center shrink-0">
                <CheckCircle2 size={24} strokeWidth={3} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-400 line-through decoration-slate-300 decoration-2 truncate mb-1">{task.title}</p>
                <div className="flex gap-3">
                  <span className="text-[10px] text-indigo-400 font-black uppercase tracking-wider bg-indigo-50 px-2 py-0.5 rounded-lg">{task.area}</span>
                  {task.deadline && (
                    <span className="text-[10px] text-slate-300 font-bold uppercase tracking-widest flex items-center gap-1">
                      <Calendar size={10} />
                      Concluído em {new Date(task.deadline + 'T12:00:00').toLocaleDateString('pt-BR')}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => onDelete(task.id)}
                className="opacity-0 group-hover:opacity-100 p-3 text-slate-200 hover:text-red-400 hover:bg-red-50 rounded-2xl transition-all"
                title="Excluir do histórico"
              >
                <Trash2 size={20} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// --- Main App Component ---

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('tasks');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchTasks(session.user.id);
      setLoading(false);
    });

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchTasks(session.user.id);
      } else {
        setTasks([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchTasks = async (userId: string) => {
    const { data, error } = await supabase
      .from('marido_tasks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setTasks(data);
    }
  };

  const deleteTask = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta tarefa permanentemente?")) {
      const { error } = await supabase
        .from('marido_tasks')
        .delete()
        .eq('id', id);

      if (!error) {
        setTasks(prev => prev.filter(t => t.id !== id));
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="animate-spin text-indigo-500" size={48} />
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-80 h-screen sticky top-0 border-r border-slate-200">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} setIsMenuOpen={setIsMenuOpen} />
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden">
        <header className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-xl border-b border-slate-100 flex items-center justify-between px-6 z-40">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 w-8 h-8 rounded-lg flex items-center justify-center">
              <TrendingUp size={16} className="text-white" />
            </div>
            <span className="font-extrabold text-slate-900 text-sm tracking-tight uppercase">Marido Produtivo</span>
          </div>
          <button onClick={() => setIsMenuOpen(true)} className="p-2 text-slate-600 bg-slate-50 border border-slate-100 rounded-xl">
            <Menu size={20} />
          </button>
        </header>

        {/* Mobile Sidebar Overlay */}
        {isMenuOpen && (
          <div className="fixed inset-0 z-50 flex">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity" onClick={() => setIsMenuOpen(false)} />
            <aside className="relative w-80 max-w-[85vw] h-full bg-slate-900 shadow-2xl animate-in slide-in-from-left duration-300">
              <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} setIsMenuOpen={setIsMenuOpen} />
              <button
                onClick={() => setIsMenuOpen(false)}
                className="absolute top-6 -right-12 w-10 h-10 flex items-center justify-center text-white bg-white/10 rounded-full backdrop-blur-lg"
              >
                <X size={24} />
              </button>
            </aside>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-10 lg:p-16 pt-24 md:pt-16 max-w-5xl mx-auto w-full pb-32 md:pb-16 transition-all">
        <div className="view-enter">
          {activeTab === 'tasks' && <TasksView tasks={tasks} setTasks={setTasks} onDelete={deleteTask} />}
          {activeTab === 'planning' && <PlanningView setTasks={setTasks} />}
          {activeTab === 'routine' && <RoutineView />}
          {activeTab === 'history' && <HistoryView tasks={tasks} onDelete={deleteTask} />}
        </div>

        {/* Persistent Mobile Bottom Nav - REFINED */}
        <nav className="md:hidden fixed bottom-4 left-4 right-4 h-[72px] bg-slate-900/95 backdrop-blur-2xl border border-white/10 rounded-[32px] shadow-2xl flex items-center justify-around px-2 z-50 overflow-hidden supports-[backdrop-filter]:bg-slate-900/80">
          {[
            { id: 'tasks', label: 'Tarefas', icon: ClipboardList },
            { id: 'planning', label: 'Plan', icon: Calendar },
            { id: 'routine', label: 'Base', icon: CheckCircle2 },
            { id: 'history', label: 'Vitórias', icon: HistoryIcon }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex flex-col items-center justify-center gap-1 w-16 h-full transition-all duration-300 ${activeTab === tab.id ? 'text-indigo-400' : 'text-slate-500'}`}
            >
              <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-2xl transition-all duration-300 ${activeTab === tab.id ? 'bg-indigo-600/20' : 'bg-transparent'}`} />
              <div className="relative z-10 transition-transform duration-300 active:scale-90">
                <tab.icon size={24} strokeWidth={activeTab === tab.id ? 2.5 : 2} className={activeTab === tab.id ? '-translate-y-1' : ''} />
              </div>
              <span className={`relative z-10 text-[9px] font-bold uppercase tracking-wider transition-all duration-300 ${activeTab === tab.id ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 hidden'
                }`}>
                {tab.label}
              </span>
            </button>
          ))}
        </nav>
      </main>
    </div>
  );
};

export default App;
