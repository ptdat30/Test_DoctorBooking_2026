import { Link } from 'react-router-dom';
import { ChevronRight, ArrowLeft, X } from 'lucide-react';

export const AppPage = ({ children, className = '' }) => (
  <div className={`app-page space-y-6 ${className}`.trim()}>{children}</div>
);

export const PageHeader = ({ title, subtitle, badge, actions }) => (
  <header className="flex flex-wrap items-start justify-between gap-4 mb-2">
    <div>
      {badge && (
        <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-medium text-neutral-600 mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          {badge}
        </div>
      )}
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900">{title}</h1>
      {subtitle && <p className="mt-2 text-neutral-500 text-sm sm:text-base">{subtitle}</p>}
    </div>
    {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
  </header>
);

export const BackLink = ({ to, label = 'Quay lại' }) => (
  <Link
    to={to}
    className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-600 hover:text-neutral-900 transition-colors mb-4"
  >
    <ArrowLeft className="w-4 h-4" />
    {label}
  </Link>
);

export const AlertError = ({ message }) => (
  <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
    {message}
  </div>
);

export const AlertSuccess = ({ message }) => (
  <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
    {message}
  </div>
);

const STATUS_STYLES = {
  CONFIRMED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  COMPLETED: 'bg-sky-50 text-sky-700 border-sky-200',
  CANCELLED: 'bg-rose-50 text-rose-700 border-rose-200',
};

const STATUS_LABELS = {
  CONFIRMED: 'Đã xác nhận',
  PENDING: 'Đang chờ',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
};

export const StatusBadge = ({ status }) => (
  <span
    className={`app-badge border ${STATUS_STYLES[status] || 'bg-neutral-100 text-neutral-600 border-neutral-200'}`}
  >
    {STATUS_LABELS[status] || status}
  </span>
);

export const EmptyState = ({ icon: Icon, title, description }) => (
  <div className="flex flex-col items-center justify-center py-12 text-center text-neutral-400">
    {Icon && <Icon className="w-10 h-10 mb-3 opacity-40" strokeWidth={1.25} />}
    <p className="font-medium text-neutral-600">{title}</p>
    {description && <p className="text-sm mt-1">{description}</p>}
  </div>
);

export const QuickActionLink = ({ to, icon: Icon, title, description, accent = 'neutral' }) => {
  const accents = {
    blue: 'bg-sky-100 text-sky-700',
    green: 'bg-emerald-100 text-emerald-700',
    amber: 'bg-amber-100 text-amber-700',
    violet: 'bg-violet-100 text-violet-700',
    neutral: 'bg-neutral-100 text-neutral-700',
  };

  return (
    <Link
      to={to}
      className="app-card flex items-center gap-4 p-4 hover:shadow-md transition-shadow group"
    >
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${accents[accent]}`}>
        <Icon className="w-5 h-5" strokeWidth={1.75} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-neutral-900">{title}</p>
        <p className="text-xs text-neutral-500 mt-0.5">{description}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-neutral-300 group-hover:text-neutral-500 transition-colors shrink-0" />
    </Link>
  );
};

export const BtnPrimary = ({ children, className = '', ...props }) => (
  <button
    type="button"
    className={`inline-flex items-center justify-center gap-2 rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${className}`}
    {...props}
  >
    {children}
  </button>
);

export const BtnSecondary = ({ children, className = '', ...props }) => (
  <button
    type="button"
    className={`inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 transition-colors ${className}`}
    {...props}
  >
    {children}
  </button>
);

export const BtnDanger = ({ children, className = '', ...props }) => (
  <button
    type="button"
    className={`inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50 transition-colors ${className}`}
    {...props}
  >
    {children}
  </button>
);

export const FormField = ({ label, required, children, className = '' }) => (
  <div className={className}>
    {label && (
      <label className="block text-sm font-medium text-neutral-700 mb-1.5">
        {label}
        {required && <span className="text-rose-500 ml-0.5">*</span>}
      </label>
    )}
    {children}
  </div>
);

const inputClass =
  'w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400';

export const Input = ({ className = '', ...props }) => (
  <input className={`${inputClass} ${className}`} {...props} />
);

export const Select = ({ className = '', children, ...props }) => (
  <select className={`${inputClass} ${className}`} {...props}>
    {children}
  </select>
);

export const Textarea = ({ className = '', ...props }) => (
  <textarea className={`${inputClass} resize-y min-h-[120px] ${className}`} {...props} />
);

export const StarRating = ({ value, onChange, size = 'lg' }) => {
  const sizes = { sm: 'text-xl', lg: 'text-3xl' };
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className={`${sizes[size]} leading-none transition-colors ${
            star <= value ? 'text-amber-400' : 'text-neutral-200 hover:text-amber-200'
          }`}
          aria-label={`${star} sao`}
        >
          ★
        </button>
      ))}
      <span className="text-sm text-neutral-500 ml-2">({value}/5)</span>
    </div>
  );
};

export const Modal = ({ open, onClose, title, children, footer, wide = false }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/40">
      <div className={`app-card w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} max-h-[90vh] overflow-hidden flex flex-col shadow-xl`}>
        <div className="app-card-header flex items-center justify-between">
          <h2 className="font-semibold text-neutral-900">{title}</h2>
          <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-neutral-100 text-neutral-500">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="app-card-body overflow-y-auto flex-1">{children}</div>
        {footer && <div className="px-5 py-4 sm:px-6 border-t border-neutral-100 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
};
