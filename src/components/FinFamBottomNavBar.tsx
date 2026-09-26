import React from 'react';
import {
  Home,
  TrendingUp,
  Calculator,
  CreditCard,
  Target,
  Bot,
  UserCheck,
  Scale,
  Network,
  Zap,
  Sparkles,
  Calendar,
  ShieldCheck
} from 'lucide-react';

interface FinFamBottomNavBarProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
}

export const FinFamBottomNavBar: React.FC<FinFamBottomNavBarProps> = ({ currentRoute, onNavigate }) => {
  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'goals', label: 'Goals', icon: Calendar },
    { id: 'goal_portfolio', label: 'Multi-Goal', icon: Target },
    { id: 'goal_interference', label: 'Conflict Map', icon: Network },
    { id: 'ripple_simulator', label: 'What-If', icon: Zap },
    { id: 'resolution_lab', label: 'Resolution', icon: Sparkles },
    { id: 'advisor', label: 'AI Advisor', icon: Bot },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'family', label: 'Family', icon: UserCheck },
    { id: 'emi', label: 'EMI', icon: Calculator },
    { id: 'payment', label: 'RuPay & Pay', icon: CreditCard },
    { id: 'profile', label: 'Profile', icon: ShieldCheck }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#070C1E]/95 backdrop-blur-lg border-t border-white/10 px-2 py-1.5 sm:py-2">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-1 overflow-x-auto no-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentRoute === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center justify-center min-w-[58px] sm:min-w-[68px] py-1 px-1 rounded-xl transition-all ${
                isActive
                  ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
              }`}
            >
              <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
              <span className="text-[10px] font-medium tracking-tight mt-1 truncate max-w-full">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
