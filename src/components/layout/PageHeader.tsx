import type { ReactNode } from 'react';

interface PageHeaderProps {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function PageHeader({ icon, title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="bg-base-100 rounded-xl shadow-sm border border-base-300">
      <div className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-4 min-w-0">
            <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center shrink-0">
              {icon}
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-base-content">{title}</h1>
              {subtitle ? (
                <p className="text-base-content/70 text-sm mt-1">{subtitle}</p>
              ) : null}
            </div>
          </div>
          {actions ? <div className="shrink-0">{actions}</div> : null}
        </div>
      </div>
    </div>
  );
}

export function PageCard({
  children,
  className = '',
  padding = true,
}: {
  children: ReactNode;
  className?: string;
  padding?: boolean;
}) {
  return (
    <div
      className={`bg-base-100 rounded-xl shadow-sm border border-base-300 ${padding ? 'p-6' : ''} ${className}`}
    >
      {children}
    </div>
  );
}
