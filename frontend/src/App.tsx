import { Avatar, DropdownMenu } from 'radix-ui';
import { ChevronDown, Command, FileText, Layers3, LayoutDashboard, Network, Settings } from 'lucide-react';
import { Link, Outlet, Route, Routes } from 'react-router-dom';
import GraphPage from './pages/GraphPage';
import HomePage from './pages/HomePage';
import OntologyPage from './pages/OntologyPage';

const applications = [
  { label: 'Обзор', icon: LayoutDashboard, to: '/' },
  { label: 'Граф знаний', icon: Network, to: '/graph' },
  { label: 'Документы', icon: FileText, to: '/documents' },
  { label: 'Онтология', icon: Layers3, to: '/ontology' },
];

function AppHeader() {
  return (
    <header className="h-10 border-b border-neutral-800">
      <div className="mx-auto flex h-full max-w-5xl items-center justify-between px-4">
        <Link aria-label="Knosis — на главную" className="flex items-center gap-2 font-semibold" to="/">
          <Network aria-hidden="true" size={18} />
          <span>knosis</span>
        </Link>

        <div className="flex items-center gap-2">
          <DropdownMenu.Root>
            <DropdownMenu.Trigger aria-label="Открыть список приложений" className="flex h-8 items-center gap-2 rounded px-2 hover:bg-neutral-800">
              <Command aria-hidden="true" size={16} />
              <ChevronDown aria-hidden="true" size={12} />
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content align="end" className="min-w-44 rounded border border-neutral-700 bg-neutral-900 p-1 text-sm" sideOffset={4}>
                <DropdownMenu.Label className="block px-2 py-2">Приложения</DropdownMenu.Label>
                <DropdownMenu.Separator className="mx-1 my-1 h-px bg-neutral-700" />
                {applications.map(({ label, icon: Icon, to }) => (
                  <DropdownMenu.Item asChild key={to}>
                    <Link className="flex items-center gap-2 rounded px-2 py-2 outline-none hover:bg-neutral-800 focus:bg-neutral-800" to={to}>
                      <Icon aria-hidden="true" size={16} />
                      {label}
                    </Link>
                  </DropdownMenu.Item>
                ))}
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>

          <DropdownMenu.Root>
            <DropdownMenu.Trigger aria-label="Меню профиля: Алексей Морозов" className="flex h-8 items-center gap-2 rounded px-2 hover:bg-neutral-800">
              <Avatar.Root className="inline-grid size-6 place-items-center rounded-full bg-neutral-700 text-[10px]">
                <Avatar.Fallback delayMs={0}>АМ</Avatar.Fallback>
              </Avatar.Root>
              <ChevronDown aria-hidden="true" size={12} />
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content align="end" className="min-w-44 rounded border border-neutral-700 bg-neutral-900 p-1 text-sm" sideOffset={4}>
                <DropdownMenu.Label className="block px-2 py-2">Алексей Морозов</DropdownMenu.Label>
                <DropdownMenu.Separator className="mx-1 my-1 h-px bg-neutral-700" />
                <DropdownMenu.Item className="flex cursor-pointer items-center gap-2 rounded px-2 py-2 outline-none hover:bg-neutral-800 focus:bg-neutral-800">
                  <Settings aria-hidden="true" size={16} />
                  Настройки
                </DropdownMenu.Item>
                <DropdownMenu.Item className="flex cursor-pointer items-center gap-2 rounded px-2 py-2 outline-none hover:bg-neutral-800 focus:bg-neutral-800">Выйти из аккаунта</DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </div>
    </header>
  );
}

function AppLayout() {
  return (
    <div className="min-h-screen">
      <AppHeader />
      <main><Outlet /></main>
    </div>
  );
}

function DocumentsPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-semibold">Документы</h1>
      <p className="text-neutral-400">Источники знаний.</p>
    </div>
  );
}

function NotFoundPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-semibold">Страница не найдена</h1>
      <Link className="underline" to="/">Вернуться к обзору</Link>
    </div>
  );
}

export function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route path="graph" element={<GraphPage />} />
        <Route path="documents" element={<DocumentsPage />} />
        <Route path="ontology" element={<OntologyPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default App;
