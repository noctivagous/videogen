import type { ReactNode } from 'react';

export interface ProPaneProps {
  title: string;
  icon?: ReactNode;
  titleTrailing?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}

export function ProPane({
  title,
  icon,
  titleTrailing,
  children,
  className = '',
  bodyClassName = '',
}: ProPaneProps) {
  return (
    <section className={`pro-pane ${className}`.trim()}>
      <div className="pro-pane-titlebar">
        {icon ? <span className="pro-pane-titlebar__icon shrink-0">{icon}</span> : null}
        <h3 className="pro-pane-titlebar__title flex-1 min-w-0 truncate">{title}</h3>
        {titleTrailing ? <span className="pro-pane-titlebar__trailing shrink-0">{titleTrailing}</span> : null}
      </div>
      <div className={`pro-pane-body ${bodyClassName}`.trim()}>{children}</div>
    </section>
  );
}