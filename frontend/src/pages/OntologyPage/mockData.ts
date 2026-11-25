import type { OntologyDocument } from './types';

export function createMockDocument(): OntologyDocument {
  return {
    elements: [
      {
        id: 'person',
        name: 'Человек',
        summary: 'Сотрудник или участник команды.',
        meta: { color: '#525252', position: { x: 40, y: 120 } },
        associations: [
          {
            id: 'person-scope',
            name: 'Участие в проектах',
            summary: 'Проекты, в которых участвует человек.',
            elementIds: ['team', 'project'],
            elementsAll: false,
          },
        ],
      },
      {
        id: 'team',
        name: 'Команда',
        summary: 'Группа людей, работающих вместе.',
        meta: { color: '#525252', position: { x: 300, y: 40 } },
        associations: [],
      },
      {
        id: 'project',
        name: 'Проект',
        summary: 'Рабочая инициатива с определённой целью.',
        meta: { color: '#525252', position: { x: 300, y: 200 } },
        associations: [],
      },
      {
        id: 'role',
        name: 'Роль',
        summary: 'Функция человека в команде или проекте.',
        meta: { color: '#525252', position: { x: 560, y: 120 } },
        associations: [],
      },
    ],
    relations: [
      {
        id: 'person-team',
        name: 'участник',
        summary: 'Человек входит в команду.',
        sourceElementId: 'person',
        targetElementId: 'team',
      },
      {
        id: 'person-project',
        name: 'создатель',
        summary: 'Человек создал проект.',
        sourceElementId: 'person',
        targetElementId: 'project',
      },
      {
        id: 'team-role',
        name: 'назначает',
        summary: 'Команда назначает роль.',
        sourceElementId: 'team',
        targetElementId: 'role',
      },
      {
        id: 'project-role',
        name: 'использует',
        summary: 'Проект использует роль.',
        sourceElementId: 'project',
        targetElementId: 'role',
      },
    ],
    contexts: [],
  };
}

export function createEmptyDocument(): OntologyDocument {
  return { elements: [], relations: [], contexts: [] };
}
