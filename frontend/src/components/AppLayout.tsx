import {
  BookOpenText,
  ChevronDown,
  GitFork,
  Network,
  Sparkles,
  UserRound,
  type LucideIcon,
} from 'lucide-react';
import { useCallback, useState, type ReactNode } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import './AppLayout.css';

const sections = [
  {
    to: '/ontology-builder',
    label: 'Редактор онтологии',
    description: 'Конструктор сущностей и связей',
    icon: GitFork,
  },
  {
    to: '/documentation-importer',
    label: 'Импорт документации',
    description: 'Загрузка и обработка источников',
    icon: BookOpenText,
  },
  {
    to: '/knowledge-graph',
    label: 'Граф знаний',
    description: 'Визуализация и исследование',
    icon: Network,
  },
];

export interface SidebarAction {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
}

export interface AppLayoutContext {
  setSidebarActions: (actions: SidebarAction[]) => void;
  setSidebarContent: (content: ReactNode | null) => void;
}

export function AppLayout() {
  const { pathname } = useLocation();
  const currentSection = sections.find(({ to }) => pathname.startsWith(to)) ?? sections[0];
  const [sidebarActions, setSidebarActions] = useState<SidebarAction[]>([]);
  const [sidebarContent, setSidebarContent] = useState<ReactNode>(null);
  const isOntologyBuilder = pathname.startsWith('/ontology-builder');
  const updateSidebarContent = useCallback((content: ReactNode | null) => {
    setSidebarContent(content);
  }, []);

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="app-sidebar__workspace"
              aria-label="Открыть приложения"
            >
              <span className="app-sidebar__brand-icon">
                <Sparkles size={19} />
              </span>
              <span className="app-sidebar__workspace-copy">
                <strong>Knosis</strong>
                <span>Приложения</span>
              </span>
              <ChevronDown className="app-sidebar__workspace-chevron" size={17} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="right" className="app-sidebar__app-menu">
            <DropdownMenuLabel>Приложения</DropdownMenuLabel>
            <div className="px-1 pb-1">
              {sections.map(({ to, label, description, icon: Icon }) => (
                <DropdownMenuItem key={to} asChild>
                  <NavLink to={to} className="app-sidebar__app-menu-link">
                    <span className="app-sidebar__app-menu-icon">
                      <Icon size={16} />
                    </span>
                    <span className="app-sidebar__app-menu-copy">
                      <span className="font-medium">{label}</span>
                      <span className="text-xs text-muted-foreground">{description}</span>
                    </span>
                  </NavLink>
                </DropdownMenuItem>
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="app-sidebar__content">
          {isOntologyBuilder && (
            <section className="app-sidebar__tools" aria-label="Элементы управления онтологией">
              <div className="app-sidebar__section-label">Редактор онтологии</div>
              {sidebarActions.map(({ label, icon: Icon, onClick }) => (
                <Button
                  key={label}
                  variant="ghost"
                  className="app-sidebar__action"
                  type="button"
                  onClick={onClick}
                >
                  <Icon size={17} aria-hidden="true" />
                  <span>{label}</span>
                </Button>
              ))}
            </section>
          )}
          {sidebarContent}
        </div>

        <div className="app-sidebar__profile">
          <span className="app-sidebar__avatar" aria-hidden="true">K</span>
          <span className="app-sidebar__profile-copy">
            <strong>Пользователь</strong>
            <span>Локальное пространство</span>
          </span>
          <UserRound size={17} className="app-sidebar__profile-icon" aria-hidden="true" />
        </div>
      </aside>

      <main className="app-main" aria-label={currentSection.label}>
        <Outlet context={{ setSidebarActions, setSidebarContent: updateSidebarContent } satisfies AppLayoutContext} />
      </main>
    </div>
  );
}
