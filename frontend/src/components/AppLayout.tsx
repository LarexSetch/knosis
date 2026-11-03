import { BookOpenText, GitFork, Network, Sparkles, UserRound } from 'lucide-react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

const sections = [
  {
    to: '/ontology-builder',
    label: 'Редактор онтологии',
    description: 'OntologyBuilder',
    icon: GitFork,
  },
  {
    to: '/documentation-importer',
    label: 'Импорт документации',
    description: 'DocumentationImporter',
    icon: BookOpenText,
  },
  {
    to: '/knowledge-graph',
    label: 'Граф знаний',
    description: 'KnowledgeGraph',
    icon: Network,
  },
];

export function AppLayout() {
  const { pathname } = useLocation();
  const currentSection = sections.find(({ to }) => pathname.startsWith(to)) ?? sections[0];

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 flex min-h-16 items-center gap-6 border-b bg-background/95 px-5 backdrop-blur supports-[backdrop-filter]:bg-background/80 max-md:flex-wrap max-md:gap-x-3 max-md:gap-y-2 max-md:px-3 max-md:py-2">
        <div className="flex min-w-0 items-center gap-3">
          <Link className="flex shrink-0 items-center gap-2.5" to="/" aria-label="Knosis — главная">
            <span className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles size={18} />
            </span>
            <span className="flex min-w-0 flex-col">
              <strong className="text-sm font-bold tracking-tight">Knosis</strong>
            </span>
          </Link>
          <span className="h-7 w-px shrink-0 bg-border" />
          <span className="flex max-w-40 items-center gap-2 truncate text-sm font-medium max-sm:max-w-24 max-sm:text-xs">
            <currentSection.icon size={16} className="shrink-0" aria-hidden="true" />
            {currentSection.label}
          </span>
        </div>

        <nav
          className="flex items-center gap-1 overflow-x-auto max-md:order-3 max-md:w-full"
          aria-label="Основная навигация"
        >
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-2 max-md:ml-auto max-md:order-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Открыть меню разделов" title="Разделы">
                <span className="grid grid-cols-3 gap-[3px]" aria-hidden="true">
                  {Array.from({ length: 9 }, (_, index) => (
                    <span key={index} className="size-1 rounded-[1px] bg-current" />
                  ))}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>Рабочее пространство</DropdownMenuLabel>
              <div className="px-1 pb-1">
                {sections.map(({ to, label, description, icon: Icon }) => (
                  <DropdownMenuItem key={to} asChild>
                    <NavLink to={to} className="cursor-pointer">
                      <span className="grid size-8 shrink-0 place-items-center rounded-md border bg-background text-foreground">
                        <Icon size={16} />
                      </span>
                      <span className="flex flex-col gap-0.5">
                        <span className="font-medium">{label}</span>
                        <span className="text-xs text-muted-foreground">{description}</span>
                      </span>
                    </NavLink>
                  </DropdownMenuItem>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            aria-label="Профиль пользователя"
            title="Профиль пользователя"
          >
            <UserRound size={18} />
          </Button>
        </div>
      </header>

      <main className="min-h-[calc(100vh-4rem)]">
        <Outlet />
      </main>
    </div>
  );
}
