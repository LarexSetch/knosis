import type { ReactNode } from 'react';

type SectionPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  icon: ReactNode;
  children: ReactNode;
};

export function SectionPage({
  eyebrow,
  title,
  description,
  icon,
  children,
}: SectionPageProps) {
  return (
    <section className="section-page">
      <header className="page-header">
        <div className="breadcrumb">
          <span>Knosis</span>
          <span className="breadcrumb-separator">/</span>
          <span>{eyebrow}</span>
        </div>
        <div className="page-heading">
          <span className="page-icon">{icon}</span>
          <div>
            <h1>{title}</h1>
            <p>{description}</p>
          </div>
        </div>
      </header>
      <div className="page-body">{children}</div>
    </section>
  );
}
