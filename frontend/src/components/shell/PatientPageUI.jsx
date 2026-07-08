import { Check } from 'lucide-react';

export const StepProgress = ({ steps, current }) => (
  <div className="flex flex-wrap gap-2 sm:gap-0 sm:justify-between mb-8">
    {steps.map((label, i) => {
      const n = i + 1;
      const done = current > n;
      const active = current === n;
      return (
        <div key={label} className="flex items-center gap-2 sm:flex-col sm:flex-1 sm:text-center">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
              done ? 'bg-emerald-600 text-white' : active ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-400'
            }`}
          >
            {done ? <Check className="w-4 h-4" /> : n}
          </div>
          <span className={`text-xs font-medium hidden sm:block ${active ? 'text-neutral-900' : 'text-neutral-400'}`}>
            {label}
          </span>
        </div>
      );
    })}
  </div>
);

export const ChoiceCard = ({ selected, disabled, children, className = '' }) => (
  <label
    className={`relative block rounded-xl border-2 p-4 cursor-pointer transition-all ${
      disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-neutral-300'
    } ${selected ? 'border-neutral-900 bg-neutral-50' : 'border-neutral-200 bg-white'} ${className}`}
  >
    {children}
  </label>
);

export const StatTile = ({ icon: Icon, label, value }) => (
  <div className="app-card p-5 flex items-center gap-4">
    <div className="w-11 h-11 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-700 shrink-0">
      <Icon className="w-5 h-5" strokeWidth={1.75} />
    </div>
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">{label}</p>
      <p className="text-2xl font-bold text-neutral-900 mt-0.5">{value}</p>
    </div>
  </div>
);

export const TabBar = ({ tabs, active, onChange }) => (
  <div className="flex flex-wrap gap-2 border-b border-neutral-100 pb-px">
    {tabs.map(({ id, label }) => (
      <button
        key={id}
        type="button"
        onClick={() => onChange(id)}
        className={`px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-colors -mb-px border-b-2 ${
          active === id
            ? 'border-neutral-900 text-neutral-900'
            : 'border-transparent text-neutral-500 hover:text-neutral-700'
        }`}
      >
        {label}
      </button>
    ))}
  </div>
);
