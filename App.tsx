
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  LayoutDashboard, Users, CalendarCheck, BrainCircuit, Settings, LogOut, 
  Plus, Search, Bell, ChevronRight, UserCircle, MessageSquare, Network, 
  ShieldCheck, Share2, Heart, Clock, Home, Sparkles, Send, Bot, 
  ArrowRight, BookOpen, Quote, Trash2, Download, Volume2, Monitor,
  CheckCircle2, AlertCircle, Calendar, MapPin, Menu, X, Filter, LucideIcon
} from 'lucide-react';
import { 
  AreaChart, Area, ResponsiveContainer, Tooltip as RechartsTooltip, 
  XAxis, YAxis, CartesianGrid
} from 'recharts';
import { Child, AttendanceRecord, View, User, DepartmentType, Post, Meeting, ChatMessage } from './types';
import { getAttendanceInsights, nexusChat } from './services/geminiService';

// --- Constantes e Configurações ---
const DEPARTMENTS: DepartmentType[] = [
  'Igreja Infantil', 'Grupo de Louvor', 'Mídia', 'Técnica', 'Protocolos', 'Acolhimento', 
  'Assistencia Social', 'Organização e Eventos', 'Finanças', 'Diaconia', 
  'Classe de Fundação', 'Limpeza', 'Juventude', 'Evangelização'
];

const BG_HERO_URL = "https://tse2.mm.bing.net/th/id/OIF.RPenD3lB6vnIBZQix1BGCA?pid=Api&P=0&h=220";

// --- Sub-componentes Tipados ---

interface SidebarItemProps {
  icon: LucideIcon;
  label: string;
  active: boolean;
  onClick: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon: Icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    aria-label={`Navegar para ${label}`}
    className={`w-full flex items-center space-x-4 px-6 py-4 transition-all duration-500 group relative ${
      active 
        ? 'text-[#D4AF37] bg-[#D4AF37]/5' 
        : 'text-gray-500 hover:text-white hover:bg-white/5'
    }`}
  >
    {active && <div className="absolute inset-y-0 left-0 w-1 bg-[#D4AF37] shadow-[0_0_15px_#D4AF37] animate-pulse" />}
    <Icon className={`w-5 h-5 transition-transform duration-500 group-hover:scale-110 ${active ? 'filter drop-shadow(0 0 5px #D4AF37)' : ''}`} />
    <span className={`font-futuristic text-[10px] tracking-[0.2em] transition-all duration-300 ${active ? 'font-bold pl-2' : 'font-medium'}`}>
      {label.toUpperCase()}
    </span>
  </button>
);

interface CardProps {
  children?: React.ReactNode;
  title?: string;
  className?: string;
  glow?: boolean;
  style?: React.CSSProperties;
}

const Card: React.FC<CardProps> = ({ children, title, className = "", glow = false, style }) => (
  <div 
    style={style}
    className={`glass rounded-[2rem] p-5 md:p-8 relative overflow-hidden group border border-white/5 transition-all duration-500 hover:border-[#D4AF37]/30 ${glow ? 'gold-glow' : ''} ${className}`}
  >
    <div className={`absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37]/20 to-transparent transition-opacity duration-500 opacity-50 group-hover:opacity-100`} />
    {title && (
      <h3 className="text-gray-500 text-[9px] font-futuristic tracking-[0.4em] mb-6 uppercase border-b border-white/5 pb-3 flex items-center justify-between">
        {title}
        <Sparkles className="w-3 h-3 text-[#D4AF37]/30 group-hover:text-[#D4AF37] transition-colors" />
      </h3>
    )}
    {children}
  </div>
);

// --- Componente Principal ---

const App: React.FC = () => {
  const [view, setView] = useState<View>('home');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Estados de Dados
  const [users, setUsers] = useState<User[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  
  // Estados de UI
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [visualEffects, setVisualEffects] = useState(true);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Carregamento de Inicialização
  useEffect(() => {
    const load = (key: string) => JSON.parse(localStorage.getItem(key) || '[]');
    setUsers(load('mir_nexus_users'));
    setPosts(load('mir_nexus_posts'));
    setChildren(load('mir_nexus_children'));
    setMeetings(load('mir_nexus_meetings'));
    
    const user = localStorage.getItem('mir_nexus_current_user');
    if (user) setCurrentUser(JSON.parse(user));
  }, []);

  // Sync Global - Persistência Centralizada
  useEffect(() => {
    const save = (key: string, val: any) => localStorage.setItem(key, JSON.stringify(val));
    save('mir_nexus_users', users);
    save('mir_nexus_posts', posts);
    save('mir_nexus_children', children);
    save('mir_nexus_meetings', meetings);
    if (currentUser) save('mir_nexus_current_user', currentUser);
  }, [users, posts, children, meetings, currentUser]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  // Handlers
  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const username = fd.get('username') as string;
    const existingUser = users.find(u => u.username === username);

    if (isRegistering) {
      if (existingUser) {
        alert("ID já cadastrado no MIR.");
        setIsRegistering(false);
        return;
      }
      const newUser: User = {
        id: Date.now().toString(),
        name: fd.get('name') as string,
        username,
        department: fd.get('department') as DepartmentType,
        role: 'Servo',
        joinedAt: new Date().toISOString()
      };
      setUsers(prev => [...prev, newUser]);
      setCurrentUser(newUser);
    } else {
      if (existingUser) {
        setCurrentUser(existingUser);
      } else {
        alert("Acesso não encontrado no Mainframe.");
        setIsRegistering(true);
      }
    }
  };

  const handlePost = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const content = (e.target as any).postContent.value;
    if (!content.trim()) return;

    const newPost: Post = {
      id: Date.now().toString(),
      authorId: currentUser!.id,
      authorName: currentUser!.name,
      authorDept: currentUser!.department,
      content,
      timestamp: new Date().toISOString(),
      likes: 0
    };
    setPosts(prev => [newPost, ...prev]);
    (e.target as any).reset();
  };

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;

    const userMsg: ChatMessage = { 
      id: Date.now().toString(), 
      role: 'user', 
      text: chatInput, 
      timestamp: new Date().toISOString() 
    };
    
    setChatHistory(prev => [...prev, userMsg]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      // Limita o histórico para os últimos 10 itens para performance da API
      const historyForAi = chatHistory.slice(-10).map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));
      
      const response = await nexusChat(historyForAi, userMsg.text);
      setChatHistory(prev => [...prev, { 
        id: Date.now().toString(), 
        role: 'model', 
        text: response || 'O MIR está recalibrando os sensores. Tente novamente.', 
        timestamp: new Date().toISOString() 
      }]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleExportData = () => {
    const data = { users, posts, children, meetings };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `nexus_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  // Memoized Stats para Dashboard
  const dashboardStats = useMemo(() => {
    const chartData = Array.from({ length: 7 }, (_, i) => ({
      name: `T-${6 - i}d`,
      val: posts.filter(p => {
        const d = new Date(p.timestamp);
        const today = new Date();
        return d.getDate() === (today.getDate() - (6 - i));
      }).reduce((acc, p) => acc + p.likes + 1, 0) // Simulação de peso por interação
    }));

    return {
      servos: users.length,
      kids: children.length,
      pautas: meetings.length,
      feed: posts.length,
      chartData
    };
  }, [users, children, meetings, posts]);

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#04060A]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#D4AF3715_0%,_transparent_70%)] opacity-30 animate-pulse" />
        <Card className="max-w-md w-full p-8 md:p-10 animate-in fade-in zoom-in duration-700 bg-black/40 border-[#D4AF37]/10" glow>
          <div className="text-center mb-10">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-gold-gradient rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 shadow-2xl animate-float">
               <Sparkles className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-futuristic font-black tracking-tighter text-white">MIR <span className="gold-text">2026</span></h1>
            <p className="text-[#D4AF37]/60 text-[9px] md:text-[10px] font-futuristic tracking-[0.4em] uppercase mt-2">Ano da Manifestação 2026</p>
          </div>

          <form className="space-y-4" onSubmit={handleLogin}>
            {isRegistering && (
              <div className="space-y-4 animate-in slide-in-from-top-4">
                <input name="name" type="text" placeholder="NOME COMPLETO" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-xs font-futuristic text-white focus:border-[#D4AF37] outline-none" required />
                <select name="department" className="w-full bg-[#111] border border-white/10 rounded-2xl px-6 py-4 text-xs font-futuristic text-[#D4AF37] outline-none appearance-none" required>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d.toUpperCase()}</option>)}
                </select>
              </div>
            )}
            <input name="username" type="text" placeholder="ID @USERNAME" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-xs font-futuristic text-white focus:border-[#D4AF37] outline-none" required />
            <button className="w-full bg-gold-gradient text-black font-black py-4 md:py-5 rounded-2xl font-futuristic text-[10px] md:text-[11px] tracking-[0.4em] hover:scale-105 transition-all uppercase shadow-2xl">
              {isRegistering ? 'Sincronizar no MIR' : 'Acessar Mainframe'}
            </button>
          </form>
          <button onClick={() => setIsRegistering(!isRegistering)} className="w-full mt-8 text-[9px] font-futuristic text-gray-600 hover:text-[#D4AF37] uppercase tracking-widest transition-colors">
            {isRegistering ? 'Já possui acesso? Entrar' : 'Novo servo? Criar Perfil'}
          </button>
        </Card>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-[#04060A] text-gray-200 overflow-x-hidden ${visualEffects ? 'aura-enabled' : ''}`}>
      
      {/* Mobile Top Header */}
      <header className="lg:hidden fixed top-0 left-0 w-full h-20 glass z-[100] px-6 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center space-x-3">
          <Sparkles className="w-6 h-6 text-[#D4AF37] animate-pulse" />
          <span className="font-futuristic font-black text-lg gold-text tracking-tighter">MIR 2026</span>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
          aria-label="Abrir Menu"
          className="p-3 bg-[#D4AF37]/10 text-[#D4AF37] rounded-2xl border border-[#D4AF37]/20"
        >
          {isSidebarOpen ? <X /> : <Menu />}
        </button>
      </header>

      {/* Sidebar - Desktop & Mobile Drawer */}
      <aside 
        className={`fixed inset-y-0 left-0 z-[110] w-72 glass border-r border-white/5 flex flex-col transition-transform duration-700 lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0 shadow-[0_0_100px_rgba(0,0,0,0.9)]' : '-translate-x-full'
        }`}
      >
        <div className="p-10 hidden lg:flex flex-col items-center border-b border-white/5 mb-6">
          <div className="w-16 h-16 bg-gold-gradient rounded-3xl flex items-center justify-center mb-4 shadow-2xl">
            <Sparkles className="text-white w-8 h-8" />
          </div>
          <span className="font-futuristic font-black text-xl tracking-tighter">MIR <span className="gold-text">2026</span></span>
          <span className="text-[8px] font-futuristic text-gray-500 tracking-[0.5em] mt-2 uppercase">2026 Edition</span>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto scrollbar-hide pt-24 lg:pt-0">
          <SidebarItem icon={Home} label="Lar" active={view === 'home'} onClick={() => { setView('home'); setIsSidebarOpen(false); }} />
          <SidebarItem icon={LayoutDashboard} label="Painel de Controle" active={view === 'dashboard'} onClick={() => { setView('dashboard'); setIsSidebarOpen(false); }} />
          <SidebarItem icon={MessageSquare} label="Departamento" active={view === 'feed'} onClick={() => { setView('feed'); setIsSidebarOpen(false); }} />
          <SidebarItem icon={Bot} label="Suporte Técnico" active={view === 'chatbot'} onClick={() => { setView('chatbot'); setIsSidebarOpen(false); }} />
          <SidebarItem icon={ShieldCheck} label="Área de Servos" active={view === 'department'} onClick={() => { setView('department'); setIsSidebarOpen(false); }} />
          {currentUser.department === 'Igreja Infantil' && (
            <SidebarItem icon={Users} label="Kids Portal" active={view === 'children'} onClick={() => { setView('children'); setIsSidebarOpen(false); }} />
          )}
          <SidebarItem icon={Settings} label="Configurações" active={view === 'settings'} onClick={() => { setView('settings'); setIsSidebarOpen(false); }} />
        </nav>

        <div className="p-8 border-t border-white/5">
          <div className="glass p-4 rounded-[1.5rem] flex items-center space-x-4 border-white/5 mb-4 group cursor-default">
            <div className="w-10 h-10 rounded-2xl bg-gold-gradient flex items-center justify-center font-black text-black group-hover:rotate-12 transition-transform">
              {currentUser.name.charAt(0)}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-[10px] font-black text-white truncate uppercase font-futuristic">{currentUser.name}</p>
              <p className="text-[8px] text-[#D4AF37] font-futuristic tracking-widest uppercase truncate">{currentUser.department}</p>
            </div>
          </div>
          <button onClick={() => setCurrentUser(null)} className="w-full py-4 text-[9px] font-futuristic text-gray-600 hover:text-red-500 uppercase tracking-[0.3em] transition-all">
            DESCONECTAR
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 transition-all duration-700 lg:ml-72 p-5 md:p-10 pt-28 lg:pt-10 min-h-screen">
        
        {/* HOME VIEW */}
        {view === 'home' && (
          <div className="animate-in fade-in duration-1000 space-y-16">
            <section className="relative h-[400px] md:h-[600px] rounded-[3rem] overflow-hidden flex flex-col items-center justify-center text-center p-8 md:p-12 group">
              <div className={`absolute inset-0 bg-[url('${BG_HERO_URL}')] bg-cover bg-center opacity-20 group-hover:scale-110 transition-transform duration-[20s]`} />
              <div className="absolute inset-0 bg-gradient-to-t from-[#04060A] via-transparent to-transparent" />
              <div className="relative z-10 space-y-6 md:space-y-8 max-w-4xl">
                <span className="text-[#D4AF37] font-futuristic text-[9px] md:text-[10px] tracking-[1.2em] animate-pulse uppercase">Ministério Internacional Renascer</span>
                <h1 className="text-6xl md:text-[120px] font-futuristic font-black leading-none gold-text tracking-tighter">2026</h1>
                <h2 className="text-3xl md:text-6xl font-serif-elegant italic text-white/90">Ano da <span className="gold-text">Manifestação</span></h2>
                <div className="pt-8 flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-8 justify-center items-center w-full">
                  <button onClick={() => setView('chatbot')} className="bg-gold-gradient px-10 py-5 rounded-[2rem] text-black font-black font-futuristic text-[10px] tracking-[0.3em] uppercase hover:scale-105 transition-all shadow-2xl gold-glow w-full md:w-auto">
                    Suporte Técnico
                  </button>
                  <button onClick={() => setView('dashboard')} className="bg-white/5 border border-white/10 px-10 py-5 rounded-[2rem] text-white font-black font-futuristic text-[10px] tracking-[0.3em] uppercase hover:bg-white/10 transition-all w-full md:w-auto">
                   Painel de Controle
                  </button>
                </div>
              </div>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card>
                 <div className="flex items-center space-x-4 mb-6">
                    <UserCircle className="w-12 h-12 text-[#D4AF37]" />
                    <div>
                       <p className="text-xs font-black text-white font-futuristic uppercase">Pr.Maiomonas Afonso</p>
                       <p className="text-[8px] text-gray-500 uppercase tracking-widest">Líder do MIR</p>
                    </div>
                 </div>
                 <p className="text-[10px] text-gray-400 leading-relaxed italic border-l border-[#D4AF37]/30 pl-4">"Manifestando a glória de Deus em cada esfera da nossa nação."</p>
              </Card>

              <Card title="Próximo Marco">
                 <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                    <p className="text-2xl font-futuristic font-black text-white">SUPER DOMINGO</p>
                    <p className="text-[9px] text-[#D4AF37] font-futuristic mt-1 tracking-widest">MARÇO 2026 • SEDE CENTRAL</p>
                 </div>
                 <button className="mt-6 w-full py-3 bg-gold-gradient text-black font-black font-futuristic text-[9px] rounded-xl hover:scale-105 transition-all">DETALHES DO EVENTO</button>
              </Card>

              <Card title="Comunidade" className="bg-gold-gradient !text-black border-none">
                 <p className="text-sm font-futuristic font-black uppercase">Vós sois a luz do mundo.</p>
                 <p className="mt-4 text-[11px] leading-relaxed opacity-80">Junte-se ao fluxo de oração e ensino ativa do MIR.</p>
                 <button onClick={() => setView('feed')} className="mt-8 p-4 bg-black rounded-2xl text-white hover:scale-110 transition-all"><ArrowRight className="w-6 h-6" /></button>
              </Card>
            </div>
          </div>
        )}

        {/* FEED VIEW */}
        {view === 'feed' && (
          <div className="animate-in fade-in slide-in-from-right-12 duration-700 space-y-10 max-w-4xl mx-auto pb-20">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-white/5 pb-10">
              <div>
                <span className="text-[#D4AF37] font-futuristic text-[10px] tracking-[0.5em] uppercase"></span>
                <h2 className="text-4xl md:text-5xl font-futuristic font-black gold-text">Conversas</h2>
              </div>
              <button onClick={() => (document.getElementById('post-area') as any).focus()} className="bg-gold-gradient p-4 rounded-[1.5rem] text-black shadow-xl hover:scale-105 transition-all">
                <Plus className="w-6 h-6" />
              </button>
            </header>

            <Card className="!p-0 overflow-hidden border-[#D4AF37]/10 bg-black/40">
              <form onSubmit={handlePost} className="p-8">
                <textarea 
                  id="post-area"
                  name="postContent" 
                  placeholder={`Compartilhe a sua opinião, ${currentUser.name.split(' ')[0]}...`} 
                  className="w-full bg-transparent border-none text-white text-base md:text-lg focus:outline-none min-h-[120px] resize-none font-medium placeholder:text-gray-700" 
                />
                <div className="mt-6 flex justify-between items-center border-t border-white/5 pt-6">
                  <span className="text-[9px] text-gray-600 font-futuristic uppercase tracking-widest">Respeite a Identidade </span>
                  <button type="submit" className="bg-gold-gradient text-black px-10 py-4 rounded-[1.5rem] text-[10px] font-black font-futuristic tracking-[0.3em] uppercase shadow-2xl hover:gold-glow transition-all">Enviar</button>
                </div>
              </form>
            </Card>

            <div className="space-y-8">
              {posts.length === 0 ? (
                <div className="py-20 text-center opacity-20">
                  <MessageSquare className="w-12 h-12 mx-auto mb-6" />
                  <p className="font-futuristic text-[10px] tracking-widest uppercase">Nenhuma opinião registrada no grupo ainda.</p>
                </div>
              ) : posts.map((post, idx) => (
                <Card key={post.id} className="animate-in slide-in-from-bottom-8" style={{ animationDelay: `${idx * 100}ms` }}>
                  <div className="flex items-start space-x-5">
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-[1.2rem] bg-gold-gradient flex items-center justify-center font-black text-black text-xl border-4 border-black/20 shadow-xl">
                      {post.authorName.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-xs font-black text-white font-futuristic tracking-tight uppercase">{post.authorName}</h4>
                          <span className="text-[8px] text-[#D4AF37] font-futuristic uppercase tracking-widest bg-[#D4AF37]/10 px-2 py-0.5 rounded-full mt-2 inline-block">{post.authorDept}</span>
                        </div>
                        <span className="text-[8px] text-gray-600 font-futuristic flex items-center"><Clock className="w-3 h-3 mr-1" /> {new Date(post.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-gray-300 mt-6 text-sm leading-relaxed border-l-2 border-white/5 pl-6">{post.content}</p>
                      <div className="mt-8 flex space-x-10">
                        <button 
                          onClick={() => {
                            const newPosts = [...posts];
                            newPosts[idx].likes += 1;
                            setPosts(newPosts);
                          }}
                          className="flex items-center space-x-2 text-gray-500 hover:text-red-500 transition-all group"
                        >
                          <Heart className={`w-5 h-5 group-active:scale-150 transition-transform ${post.likes > 0 ? 'fill-red-500 text-red-500' : ''}`} />
                          <span className="text-[10px] font-futuristic font-bold">{post.likes}</span>
                        </button>
                        <button className="flex items-center space-x-2 text-gray-500 hover:text-[#D4AF37] transition-all">
                          <MessageSquare className="w-5 h-5" />
                          <span className="text-[9px] font-futuristic uppercase tracking-widest">Comentar</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* DASHBOARD VIEW */}
        {view === 'dashboard' && (
          <div className="animate-in fade-in slide-in-from-bottom-12 duration-1000 space-y-10 pb-20">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-white/5 pb-10">
              <div>
                <span className="text-[#D4AF37] font-futuristic text-[10px] tracking-[0.5em] uppercase"></span>
                <h2 className="text-4xl md:text-5xl font-futuristic font-black gold-text uppercase tracking-tighter">MIR Mainframe</h2>
              </div>
            </header>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Rede Servos', val: dashboardStats.servos, icon: Users, color: '#D4AF37' },
                { label: 'Fluxo Feed', val: dashboardStats.feed, icon: MessageSquare, color: '#8B5CF6' },
                { label: 'Kids Node', val: dashboardStats.kids, icon: Sparkles, color: '#10B981' },
                { label: 'Pautas MIR', val: dashboardStats.pautas, icon: Calendar, color: '#F59E0B' }
              ].map((stat, i) => (
                <Card key={i} className="hover:scale-105 transition-all">
                  <stat.icon className="w-6 h-6 mb-6" style={{ color: stat.color }} />
                  <p className="text-[9px] font-futuristic text-gray-500 uppercase tracking-widest">{stat.label}</p>
                  <p className="text-2xl md:text-3xl font-black text-white font-futuristic mt-1">{stat.val}</p>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <Card title="Engajamento Ministerial (7d)" className="lg:col-span-2 h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dashboardStats.chartData}>
                    <defs>
                      <linearGradient id="colorEngagement" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                    <XAxis dataKey="name" stroke="#444" fontSize={9} axisLine={false} tickLine={false} />
                    <YAxis stroke="#444" fontSize={9} axisLine={false} tickLine={false} />
                    <RechartsTooltip contentStyle={{ backgroundColor: '#0B0F1A', border: '1px solid #ffffff10', borderRadius: '1.2rem', fontSize: '10px' }} />
                    <Area type="monotone" dataKey="val" stroke="#D4AF37" strokeWidth={3} fillOpacity={1} fill="url(#colorEngagement)" />
                  </AreaChart>
                </ResponsiveContainer>
              </Card>

              <Card title="Notas Informativas" className="bg-[#D4AF37]/5 border-[#D4AF37]/20">
                 <div className="space-y-6 mt-4">
                    <div className="p-5 bg-white/5 rounded-[1.5rem] border border-white/5 animate-pulse-gold">
                       <div className="flex items-center space-x-3 mb-3">
                          <BrainCircuit className="w-5 h-5 text-[#D4AF37]" />
                          <span className="text-[9px] font-futuristic text-white uppercase tracking-widest">Predição MIR</span>
                       </div>
                       <p className="text-[10px] text-gray-400 leading-relaxed italic">
                         "A atividade no feed cresceu {posts.length > 5 ? '15%' : '5%'} nesta semana. O Nó de {currentUser.department} está operando em alta frequência participativa."
                       </p>
                    </div>
                    <div className="space-y-4">
                       <p className="text-[8px] font-futuristic text-gray-500 uppercase tracking-widest">Sincronização de Setores</p>
                       <div className="flex flex-col space-y-3">
                          {DEPARTMENTS.slice(0, 4).map((d, idx) => (
                             <div key={idx} className="flex justify-between items-center text-[10px] font-futuristic">
                                <span className="text-gray-400">{d.toUpperCase()}</span>
                                <span className="text-[#D4AF37] font-black">{Math.floor(Math.random() * 100)}%</span>
                             </div>
                          ))}
                       </div>
                    </div>
                 </div>
              </Card>
            </div>
          </div>
        )}

        {/* ÁREA SERVO (DEPARTMENT) */}
        {view === 'department' && (
          <div className="animate-in fade-in slide-in-from-right-12 duration-700 space-y-12 pb-20">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-white/5 pb-10">
              <div>
                <span className="text-[#D4AF37] font-futuristic text-[10px] tracking-[0.5em] uppercase">Gestão Operacional Interna</span>
                <h2 className="text-4xl md:text-5xl font-futuristic font-black gold-text uppercase">{currentUser.department}</h2>
              </div>
              <button 
                onClick={() => {
                  const title = prompt("Digite o título da Pauta MIR:");
                  if (title) {
                    const newMeeting: Meeting = {
                      id: Date.now().toString(),
                      dept: currentUser.department,
                      title,
                      date: new Date().toLocaleDateString(),
                      location: 'Sede Central - MIR'
                    };
                    setMeetings(prev => [newMeeting, ...prev]);
                  }
                }}
                className="bg-gold-gradient p-4 rounded-[1.5rem] text-black shadow-xl hover:scale-110 transition-all"
              >
                <Plus className="w-6 h-6" />
              </button>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <Card title="Próximas Escalas" glow>
                <div className="space-y-5 mt-4">
                  {[
                    { day: 'DOM', label: 'Culto de Acção de Graças', time: '07h00' },
                    { day: 'DOM', label: 'Culto de Celebração', time: '09h00' },
                    { day: 'QUA', label: 'Culto de Ensino', time: '18h30' }
                  ].map((e, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-[#D4AF37]/5 transition-all group">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gold-gradient rounded-xl flex items-center justify-center font-black text-black text-xs">{e.day}</div>
                        <div>
                          <p className="text-xs font-black text-white font-futuristic uppercase">{e.label}</p>
                          <p className="text-[9px] text-gray-500 font-futuristic tracking-widest">{e.time} • Presença Sincronizada</p>
                        </div>
                      </div>
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  ))}
                </div>
              </Card>

              <Card title="Pautas & Atas do Departamento">
                 <div className="space-y-4 mt-4">
                    {meetings.filter(m => m.dept === currentUser.department).length === 0 ? (
                      <div className="py-16 text-center opacity-20 italic">
                         <BookOpen className="w-10 h-10 mx-auto mb-4" />
                         <p className="text-[9px] font-futuristic uppercase tracking-widest">Sem atas registradas no mainframe.</p>
                      </div>
                    ) : meetings.filter(m => m.dept === currentUser.department).map(m => (
                      <div key={m.id} className="glass p-5 rounded-[1.5rem] border border-white/5 flex justify-between items-center group hover:border-[#D4AF37]/30 transition-all animate-in slide-in-from-left-6">
                         <div>
                            <div className="flex items-center space-x-3">
                               <div className="w-2 h-2 rounded-full bg-[#D4AF37] shadow-[0_0_8px_#D4AF37]" />
                               <h5 className="text-xs font-black text-white font-futuristic uppercase tracking-tight">{m.title}</h5>
                            </div>
                            <p className="text-[9px] text-gray-600 font-futuristic mt-2 flex items-center uppercase tracking-widest">
                               <Clock className="w-3 h-3 mr-2" /> {m.date} • {m.location}
                            </p>
                         </div>
                         <button 
                            onClick={() => setMeetings(prev => prev.filter(x => x.id !== m.id))}
                            className="p-2 text-gray-700 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                         >
                            <Trash2 className="w-5 h-5" />
                         </button>
                      </div>
                    ))}
                 </div>
              </Card>
            </div>
          </div>
        )}

        {/* KIDS PORTAL */}
        {view === 'children' && (
           <div className="animate-in fade-in slide-in-from-bottom-12 duration-700 space-y-12 pb-20">
              <header className="flex flex-col md:flex-row justify-between items-center gap-6 border-b border-white/5 pb-10">
                <h2 className="text-4xl md:text-5xl font-futuristic font-black gold-text uppercase">Kids Portal</h2>
                <div className="bg-[#D4AF37]/10 px-8 py-3 rounded-full border border-[#D4AF37]/30 shadow-2xl">
                   <span className="text-[10px] font-futuristic text-[#D4AF37] tracking-[0.4em] uppercase font-black">Registros MIR: {children.length}</span>
                </div>
              </header>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                 <div className="lg:col-span-1">
                    <Card title="Cadastrar Crianças">
                       <form onSubmit={(e) => {
                          e.preventDefault();
                          const fd = new FormData(e.currentTarget);
                          const newChild: Child = {
                             id: Date.now().toString(),
                             name: fd.get('name') as string,
                             age: parseInt(fd.get('age') as string),
                             classLevel: fd.get('classLevel') as any,
                             joinedAt: new Date().toLocaleDateString(),
                             status: 'active'
                          };
                          setChildren(prev => [newChild, ...prev]);
                          (e.target as any).reset();
                       }} className="space-y-6 mt-4">
                          <input name="name" type="text" placeholder="Nome Completo " className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-xs font-futuristic text-white outline-none focus:border-[#D4AF37]" required />
                          <div className="grid grid-cols-2 gap-4">
                             <input name="age" type="number" placeholder="Idade (0-12)" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-xs font-futuristic text-white outline-none focus:border-[#D4AF37]" required />
                             <select name="classLevel" className="w-full bg-[#111] border border-white/10 rounded-2xl px-6 py-4 text-[10px] font-futuristic text-[#D4AF37] outline-none" required>
                                <option value="Jardim">Jardim</option>
                                <option value="Junior">Júnior</option>
                                <option value="Sênior">Sênior</option>
                             </select>
                          </div>
                          <button className="w-full bg-gold-gradient text-black font-black py-4 rounded-2xl font-futuristic text-[10px] tracking-[0.4em] uppercase shadow-2xl hover:scale-105 transition-all">Cadastrar</button>
                       </form>
                    </Card>
                 </div>

                 <div className="lg:col-span-2">
                    <Card title="Banco de Dados">
                       <div className="overflow-x-auto mt-6">
                          <table className="w-full text-left">
                             <thead>
                                <tr className="border-b border-white/5 text-[10px] text-gray-600 font-futuristic uppercase tracking-[0.3em]">
                                   <th className="pb-8 pl-4">Identidade</th>
                                   <th className="pb-8">Fluxo</th>
                                   <th className="pb-8">Status</th>
                                   <th className="pb-8 text-right pr-4">Ação</th>
                                </tr>
                             </thead>
                             <tbody className="divide-y divide-white/5">
                                {children.length === 0 ? (
                                   <tr><td colSpan={4} className="py-20 text-center opacity-20 font-futuristic text-[10px] uppercase tracking-widest">Sem registros de herança no mainframe.</td></tr>
                                ) : children.map((child, i) => (
                                   <tr key={child.id} className="group hover:bg-white/[0.02] transition-colors">
                                      <td className="py-6 pl-4 font-futuristic text-sm text-white font-black tracking-tight uppercase">{child.name}</td>
                                      <td className="py-6"><span className="bg-[#D4AF37]/10 text-[#D4AF37] px-4 py-1.5 rounded-full text-[9px] font-futuristic border border-[#D4AF37]/30 uppercase font-black">{child.classLevel}</span></td>
                                      <td className="py-6"><div className="flex items-center space-x-2 text-emerald-500 font-black font-futuristic text-[9px]"><div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /><span>ATIVO</span></div></td>
                                      <td className="py-6 text-right pr-4"><button onClick={() => setChildren(prev => prev.filter(x => x.id !== child.id))} className="p-3 text-gray-700 hover:text-red-500 transition-all"><Trash2 className="w-5 h-5" /></button></td>
                                   </tr>
                                ))}
                             </tbody>
                          </table>
                       </div>
                    </Card>
                 </div>
              </div>
           </div>
        )}

        {/* SETTINGS VIEW */}
        {view === 'settings' && (
           <div className="animate-in fade-in slide-in-from-left-12 duration-700 space-y-12 pb-20 max-w-4xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-futuristic font-black gold-text border-b border-white/5 pb-10 uppercase tracking-tighter">Terminal de Configuração</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                 <Card title="Interface & Motor Visual">
                    <div className="space-y-8 mt-4">
                       <div className="flex items-center justify-between group">
                          <div className="flex items-center space-x-5">
                             <Monitor className="w-8 h-8 text-[#D4AF37] group-hover:animate-pulse transition-all" />
                             <div>
                                <p className="text-xs font-black text-white font-futuristic uppercase">Ajuste da Tela</p>
                                <p className="text-[9px] text-gray-500 font-futuristic uppercase mt-1 tracking-widest">Gradientes dinâmicos e Bloom</p>
                             </div>
                          </div>
                          <button onClick={() => setVisualEffects(!visualEffects)} aria-label="Toggle Efeitos Visuais" className={`w-14 h-7 rounded-full transition-all relative ${visualEffects ? 'bg-gold-gradient shadow-[0_0_15px_#D4AF37]' : 'bg-white/10'}`}>
                             <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all shadow-xl ${visualEffects ? 'right-1' : 'left-1'}`} />
                          </button>
                       </div>
                       
                       <div className="flex items-center justify-between group opacity-50">
                          <div className="flex items-center space-x-5">
                             <Volume2 className="w-8 h-8 text-gray-600" />
                             <div>
                                <p className="text-xs font-black text-white font-futuristic uppercase">Feedback Sonoro</p>
                                <p className="text-[9px] text-gray-500 font-futuristic uppercase mt-1 tracking-widest">Sons de interface do Mainframe</p>
                             </div>
                          </div>
                          <button disabled className="w-14 h-7 bg-white/5 rounded-full relative cursor-not-allowed">
                             <div className="absolute top-1 w-5 h-5 bg-gray-700 rounded-full left-1" />
                          </button>
                       </div>
                    </div>
                 </Card>

                 <Card title="Dados & Segurança ">
                    <div className="space-y-6 mt-4">
                       <button onClick={handleExportData} className="w-full flex items-center justify-between p-6 bg-white/5 rounded-[2rem] border border-white/5 hover:border-[#D4AF37]/40 hover:bg-[#D4AF37]/5 transition-all group">
                          <div className="flex items-center space-x-5">
                             <Download className="w-6 h-6 text-[#D4AF37] group-hover:scale-125 transition-all" />
                             <div className="text-left">
                                <p className="text-xs font-black font-futuristic text-white uppercase">Exportar Mainframe</p>
                                <p className="text-[9px] text-gray-500 font-futuristic uppercase mt-1">Snapshot total (.json)</p>
                             </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-800" />
                       </button>

                       <button onClick={() => { if(confirm("Deseja apagar todos os registros permanentes?")) { localStorage.clear(); window.location.reload(); } }} className="w-full flex items-center justify-between p-6 bg-red-500/5 rounded-[2rem] border border-red-500/10 hover:border-red-500/50 hover:bg-red-500/10 transition-all group">
                          <div className="flex items-center space-x-5">
                             <Trash2 className="w-6 h-6 text-red-500 opacity-50 group-hover:opacity-100 transition-all" />
                             <div className="text-left">
                                <p className="text-xs font-black font-futuristic text-red-500 uppercase">Wipe Ministerial</p>
                                <p className="text-[9px] text-red-900/50 font-futuristic uppercase font-black mt-1">Reset de Fábrica 2026</p>
                             </div>
                          </div>
                          <AlertCircle className="w-5 h-5 text-red-900/20 group-hover:animate-ping" />
                       </button>
                    </div>
                 </Card>

                 <Card title="Status de Configuração" className="md:col-span-2 bg-[#D4AF37]/5 border-[#D4AF37]/20">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-4">
                       {[
                          { l: 'Criptografia', v: 'AES-MIR' },
                          { l: 'Gateway', v: 'MIR-LUANDA-01' },
                          { l: 'Protocolo', v: 'v4.8.MIR' },
                          { l: 'Inicialização', v: 'ATIVO' }
                       ].map((s, i) => (
                          <div key={i} className="text-center md:text-left">
                             <p className="text-[8px] text-gray-500 font-futuristic uppercase tracking-[0.4em] mb-2">{s.l}</p>
                             <p className="text-xs font-black text-[#D4AF37] font-futuristic uppercase tracking-tighter">{s.v}</p>
                          </div>
                       ))}
                    </div>
                 </Card>
              </div>
           </div>
        )}

        {/* CHATBOT VIEW */}
        {view === 'chatbot' && (
           <div className="h-[calc(100vh-200px)] lg:h-[calc(100vh-160px)] flex flex-col animate-in fade-in duration-700 max-w-5xl mx-auto">
              <div className="flex-1 overflow-y-auto space-y-8 pr-4 mb-8 scrollbar-hide">
                 {chatHistory.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8">
                       <div className="w-24 h-24 bg-gold-gradient rounded-[3rem] flex items-center justify-center shadow-2xl mb-10 animate-float">
                          <Bot className="w-12 h-12 text-black" />
                       </div>
                       <h2 className="text-3xl md:text-4xl font-futuristic font-black gold-text mb-4">Nosso Suporte Técnico</h2>
                       <p className="text-gray-500 max-w-md mx-auto text-[10px] md:text-xs font-futuristic tracking-[0.4em] uppercase leading-loose">
                          O Suporte Técnico inteligente do MIR para orientação ministerial direta.
                       </p>
                    </div>
                 )}
                 {chatHistory.map(msg => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-6 duration-500`}>
                       <div className={`max-w-[85%] md:max-w-2xl p-6 rounded-[2.5rem] ${msg.role === 'user' ? 'bg-[#D4AF37] text-black font-bold shadow-2xl' : 'glass border-[#D4AF37]/20 text-gray-200 shadow-xl'}`}>
                          <p className="text-sm md:text-base leading-relaxed">{msg.text}</p>
                          <div className={`mt-4 text-[7px] font-futuristic uppercase tracking-[0.4em] opacity-60 ${msg.role === 'user' ? 'text-black/70' : 'text-[#D4AF37]'}`}>
                             {msg.role === 'user' ? 'Servo do MIR' : 'MIR AI'} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                       </div>
                    </div>
                 ))}
                 {isChatLoading && (
                    <div className="flex justify-start">
                       <div className="glass p-6 rounded-[2.5rem] border-[#D4AF37]/20 flex space-x-3 items-center">
                          <div className="w-2 h-2 bg-[#D4AF37] rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-[#D4AF37] rounded-full animate-bounce delay-100" />
                          <div className="w-2 h-2 bg-[#D4AF37] rounded-full animate-bounce delay-200" />
                       </div>
                    </div>
                 )}
                 <div ref={chatEndRef} />
              </div>

              <form onSubmit={handleChat} className="relative group p-2 bg-white/5 rounded-[3rem] border border-white/5 focus-within:border-[#D4AF37]/40 transition-all shadow-2xl">
                 <input 
                    type="text" 
                    placeholder="DIGITE SUA CONSULTA AO MAINFRAME..." 
                    className="w-full bg-transparent pl-8 md:pl-10 pr-24 py-6 md:py-8 text-sm font-futuristic text-white outline-none"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                 />
                 <button type="submit" aria-label="Enviar Mensagem" className="absolute right-3 top-1/2 -translate-y-1/2 w-14 h-14 md:w-16 md:h-16 bg-gold-gradient rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-all text-black hover:gold-glow">
                    <Send className="w-6 h-6 md:w-7 md:h-7" />
                 </button>
              </form>
           </div>
        )}

      </main>

      <style>{`
         .aura-enabled main { background-image: radial-gradient(circle at 50% 50%, rgba(212, 175, 55, 0.03) 0%, transparent 60%); }
         .gold-glow { box-shadow: 0 0 50px rgba(212, 175, 55, 0.1); }
         .scrollbar-hide::-webkit-scrollbar { display: none; }
         @keyframes pulse-gold { 0% { box-shadow: 0 0 5px #D4AF3733; } 50% { box-shadow: 0 0 25px #D4AF3766; } 100% { box-shadow: 0 0 5px #D4AF3733; } }
         .animate-pulse-gold { animation: pulse-gold 3s infinite; }
         @media (max-width: 1024px) { main { padding-top: 6rem; } }
      `}</style>
    </div>
  );
};

export default App;
