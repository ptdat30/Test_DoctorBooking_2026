import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import ShellIcon from '../shell/ShellIcon';

const QuickActionCard = ({ to, icon, title, description, color }) => (
  <Link
    to={to}
    className="app-card flex items-center gap-4 p-4 hover:shadow-md transition-shadow group"
  >
    <div
      className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-white"
      style={{ backgroundColor: color }}
    >
      <ShellIcon name={icon} className="w-5 h-5" />
    </div>
    <div className="min-w-0 flex-1">
      <h3 className="font-semibold text-neutral-900">{title}</h3>
      <p className="text-xs text-neutral-500 mt-0.5">{description}</p>
    </div>
    <ChevronRight className="w-4 h-4 text-neutral-300 group-hover:text-neutral-500 shrink-0" />
  </Link>
);

export default QuickActionCard;
