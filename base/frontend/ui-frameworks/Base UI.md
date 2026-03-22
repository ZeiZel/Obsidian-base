---
tags:
  - frontend
  - ui-frameworks
  - base-ui
  - react
---
# Base UI

Base UI - библиотека headless-компонентов от команды MUI. Предоставляет логику, состояние и доступность без какой-либо стилизации. Компоненты можно стилизовать любым CSS-решением: Tailwind CSS, CSS Modules, styled-components, Emotion или обычным CSS.

## Установка

```bash
npm install @base-ui-components/react
```

> [!info] Headless-подход
> Headless-компоненты содержат логику взаимодействия, управление фокусом, ARIA-атрибуты и keyboard navigation, но не включают визуальных стилей. Разработчик получает полный контроль над внешним видом, сохраняя корректное поведение и доступность.

## Основные компоненты

### Button

```tsx
import { Button } from '@base-ui-components/react/button';

function ButtonExample() {
  return (
    <Button
      className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-blue-600 disabled:opacity-50"
      onClick={() => console.log('clicked')}
    >
      Нажми
    </Button>
  );
}
```

### Menu

```tsx
import { Menu } from '@base-ui-components/react/menu';

function MenuExample() {
  return (
    <Menu.Root>
      <Menu.Trigger className="rounded-md border px-3 py-2 hover:bg-gray-50">
        Действия
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner>
          <Menu.Popup className="rounded-lg border bg-white p-1 shadow-lg">
            <Menu.Item
              className="cursor-pointer rounded-md px-3 py-2 hover:bg-gray-100"
              onSelect={() => console.log('edit')}
            >
              Редактировать
            </Menu.Item>
            <Menu.Item
              className="cursor-pointer rounded-md px-3 py-2 hover:bg-gray-100"
              onSelect={() => console.log('duplicate')}
            >
              Дублировать
            </Menu.Item>
            <Menu.Separator className="my-1 h-px bg-gray-200" />
            <Menu.Item
              className="cursor-pointer rounded-md px-3 py-2 text-red-600 hover:bg-red-50"
              onSelect={() => console.log('delete')}
            >
              Удалить
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
```

### Dialog

```tsx
import { Dialog } from '@base-ui-components/react/dialog';

function DialogExample() {
  return (
    <Dialog.Root>
      <Dialog.Trigger className="rounded-md bg-blue-600 px-4 py-2 text-white">
        Открыть
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 shadow-xl">
          <Dialog.Title className="text-lg font-semibold">
            Подтверждение
          </Dialog.Title>
          <Dialog.Description className="mt-2 text-gray-600">
            Вы уверены, что хотите продолжить? Это действие нельзя отменить.
          </Dialog.Description>
          <div className="mt-6 flex justify-end gap-3">
            <Dialog.Close className="rounded-md border px-4 py-2 hover:bg-gray-50">
              Отмена
            </Dialog.Close>
            <button className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700">
              Удалить
            </button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
```

### Tooltip

```tsx
import { Tooltip } from '@base-ui-components/react/tooltip';

function TooltipExample() {
  return (
    <Tooltip.Provider>
      <Tooltip.Root>
        <Tooltip.Trigger className="rounded-md border px-3 py-2">
          Наведи
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Positioner>
            <Tooltip.Popup className="rounded-md bg-gray-900 px-3 py-1.5 text-sm text-white shadow-md">
              Подсказка с полезной информацией
              <Tooltip.Arrow className="fill-gray-900" />
            </Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
```

### Switch

```tsx
import { Switch } from '@base-ui-components/react/switch';

function SwitchExample() {
  const [checked, setChecked] = useState(false);

  return (
    <label className="flex items-center gap-3">
      <Switch.Root
        checked={checked}
        onCheckedChange={setChecked}
        className="relative h-6 w-11 rounded-full bg-gray-300 transition-colors data-[checked]:bg-blue-600"
      >
        <Switch.Thumb className="block h-5 w-5 translate-x-0.5 rounded-full bg-white shadow transition-transform data-[checked]:translate-x-[22px]" />
      </Switch.Root>
      <span>Уведомления</span>
    </label>
  );
}
```

### Select

```tsx
import { Select } from '@base-ui-components/react/select';

interface Option {
  value: string;
  label: string;
}

const options: Option[] = [
  { value: 'react', label: 'React' },
  { value: 'vue', label: 'Vue' },
  { value: 'angular', label: 'Angular' },
  { value: 'svelte', label: 'Svelte' },
];

function SelectExample() {
  return (
    <Select.Root>
      <Select.Trigger className="flex items-center justify-between rounded-md border px-3 py-2 w-48">
        <Select.Value placeholder="Выберите фреймворк" />
        <Select.Icon>
          <ChevronDownIcon className="h-4 w-4" />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Positioner>
          <Select.Popup className="rounded-lg border bg-white p-1 shadow-lg">
            {options.map((option) => (
              <Select.Item
                key={option.value}
                value={option.value}
                className="cursor-pointer rounded-md px-3 py-2 hover:bg-gray-100 data-[highlighted]:bg-gray-100"
              >
                <Select.ItemText>{option.label}</Select.ItemText>
                <Select.ItemIndicator>
                  <CheckIcon className="h-4 w-4" />
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  );
}
```

## Стилизация с различными CSS-решениями

### CSS Modules

```css
/* Dialog.module.css */
.backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
}

.popup {
  position: fixed;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}
```

```tsx
import styles from './Dialog.module.css';

<Dialog.Backdrop className={styles.backdrop} />
<Dialog.Popup className={styles.popup}>...</Dialog.Popup>
```

### Styled Components

```tsx
import styled from 'styled-components';
import { Dialog } from '@base-ui-components/react/dialog';

const StyledBackdrop = styled(Dialog.Backdrop)`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
`;

const StyledPopup = styled(Dialog.Popup)`
  position: fixed;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  background: white;
  border-radius: 12px;
  padding: 24px;
`;
```

## Сравнение с Headless UI и Radix

| Аспект | Base UI | Headless UI | Radix UI |
|---|---|---|---|
| Команда | MUI | Tailwind Labs | WorkOS |
| Компоненты | 25+ | 10+ | 30+ |
| Стилизация | Любая | Tailwind-first | Любая |
| Анимации | CSS/JS | Встроенные transitions | CSS/JS |
| Размер бандла | Минимальный | Минимальный | Минимальный |
| Типизация | TypeScript | TypeScript | TypeScript |

Radix UI более зрелый проект с большим числом компонентов. Именно Radix лежит в основе shadcn/ui. Base UI сильнее интегрирован с экосистемой MUI и может быть предпочтительнее для команд, использующих MUI в других проектах.

Headless UI ориентирован на Tailwind CSS и предоставляет меньше компонентов, зато с более простым API и встроенными transition-анимациями.

## Когда использовать Base UI вместо MUI

Base UI подходит в следующих случаях:

- Проект имеет уникальный дизайн, не основанный на Material Design
- Нужен минимальный размер бандла
- Команда хочет полный контроль над стилями
- Используется Tailwind CSS или другой CSS-фреймворк
- Нужна accessible-основа для собственной дизайн-системы

MUI лучше подходит, когда:

- Нужны готовые стилизованные компоненты с Material Design
- Важна скорость разработки без кастомной стилизации
- Нужны продвинутые компоненты вроде DataGrid
- Команда знакома с Material Design

> [!summary] Base UI
> Base UI занимает нишу между полноценными UI-фреймворками и написанием компонентов с нуля. Библиотека решает самые сложные проблемы - доступность, управление фокусом, keyboard navigation - оставляя визуальное оформление разработчику. Хороший выбор для команд, строящих собственную дизайн-систему.
