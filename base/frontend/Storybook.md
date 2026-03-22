---
tags:
  - frontend
  - storybook
  - testing
---
## Storybook

Storybook - инструмент для изолированной разработки, тестирования и документирования UI-компонентов. Каждый компонент описывается набором "историй" (stories), где каждая история отображает компонент в определённом состоянии.

Основные сценарии использования:
- разработка дизайн-систем и переиспользуемых компонентных библиотек
- визуальное тестирование компонентов в изоляции от бизнес-логики
- автоматическая генерация документации по компонентам
- совместная работа между дизайнерами и разработчиками
- тестирование edge-кейсов и состояний, которые сложно воспроизвести в приложении

> [!info] Storybook поддерживает React, Vue, Angular, Svelte, Web Components и другие фреймворки. Примеры в этой статье используют React.

## Установка и настройка

Инициализация в существующем проекте:

```bash
npx storybook@latest init
```

Команда автоматически определяет фреймворк и сборщик проекта, устанавливает зависимости и создаёт конфигурацию. Начиная с версии 8, Vite используется как сборщик по умолчанию для React-проектов.

После установки появляются конфигурационные файлы в директории `.storybook/`.

`.storybook/main.ts` - определяет, где искать истории и какие аддоны подключены:

```ts
import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-a11y',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
};

export default config;
```

`.storybook/preview.ts` - глобальные настройки отображения историй:

```ts
import type { Preview } from '@storybook/react';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
```

Запуск dev-сервера:

```bash
npm run storybook
```

Storybook откроется на `http://localhost:6006`.

## CSF 3 - Component Story Format

Storybook 8 использует CSF 3, где истории описываются как обычные объекты. Устаревший паттерн `Template.bind({})` больше не нужен.

Ключевые элементы CSF 3:
- meta-объект с `satisfies Meta<typeof Component>` для типобезопасности
- каждая история - это экспортируемый объект типа `StoryObj`
- состояние компонента задаётся через `args`

```tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta = {
  title: 'UI/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: ['primary', 'secondary'] },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Click me',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Cancel',
  },
};
```

Если компонент требует нестандартной отрисовки, можно использовать `render`:

```tsx
export const WithIcon: Story = {
  args: {
    variant: 'primary',
    children: 'Save',
  },
  render: (args) => (
    <div style={{ display: 'flex', gap: '8px' }}>
      <Button {...args} />
      <Button {...args} variant="secondary" />
    </div>
  ),
};
```

## Args и Controls

Storybook автоматически генерирует панель Controls на основе TypeScript-пропсов компонента. Для каждого пропса создаётся соответствующий элемент управления.

Автоматическое сопоставление типов:
- `string` - текстовое поле
- `boolean` - переключатель
- `number` - числовое поле
- `union type` (`'a' | 'b'`) - select или radio
- `enum` - select

Ручная настройка типов контролов через `argTypes`:

```tsx
const meta = {
  component: Card,
  argTypes: {
    variant: {
      control: 'radio',
      options: ['elevated', 'outlined', 'filled'],
      description: 'Visual style of the card',
    },
    padding: {
      control: { type: 'range', min: 0, max: 48, step: 4 },
    },
    backgroundColor: {
      control: 'color',
    },
    createdAt: {
      control: 'date',
    },
    onClose: {
      action: 'closed',
    },
  },
} satisfies Meta<typeof Card>;
```

> [!summary] Доступные типы контролов: `text`, `boolean`, `number`, `range`, `select`, `radio`, `inline-radio`, `check`, `inline-check`, `color`, `date`, `object`, `file`.

## Decorators и Parameters

Декораторы оборачивают истории в дополнительную разметку или провайдеры. Это полезно для тем, роутинга, стора и других контекстных зависимостей.

Декоратор на уровне конкретной истории:

```tsx
export const Themed: Story = {
  decorators: [
    (Story) => (
      <ThemeProvider theme="dark">
        <Story />
      </ThemeProvider>
    ),
  ],
};
```

Глобальные декораторы в `.storybook/preview.ts`:

```ts
const preview: Preview = {
  decorators: [
    (Story) => (
      <div style={{ margin: '2rem' }}>
        <Story />
      </div>
    ),
  ],
};
```

Parameters управляют поведением аддонов и отображением:

```tsx
const meta = {
  component: Modal,
  parameters: {
    layout: 'centered',
    viewport: {
      defaultViewport: 'mobile1',
    },
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'light', value: '#ffffff' },
        { name: 'dark', value: '#1a1a1a' },
      ],
    },
  },
} satisfies Meta<typeof Modal>;
```

## Interactions и Play Functions

Play-функции позволяют автоматизировать взаимодействие с компонентом прямо внутри истории. Это работает как интерактивный тест, результат которого виден в панели Interactions.

Используемые утилиты из `@storybook/test`:
- `userEvent` - эмуляция действий пользователя
- `within` - поиск элементов внутри канваса
- `expect` - проверка утверждений
- `fn` - создание mock-функций для отслеживания вызовов

```tsx
import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, within } from '@storybook/test';
import { LoginForm } from './LoginForm';

const meta = {
  component: LoginForm,
  args: {
    onSubmit: fn(),
  },
} satisfies Meta<typeof LoginForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FilledForm: Story = {
  play: async ({ canvasElement, args, step }) => {
    const canvas = within(canvasElement);

    await step('Fill in credentials', async () => {
      await userEvent.type(canvas.getByLabelText('Email'), 'user@example.com');
      await userEvent.type(canvas.getByLabelText('Password'), 'password123');
    });

    await step('Submit the form', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Log in' }));
    });

    await expect(args.onSubmit).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'password123',
    });
  },
};
```

> [!important] Play-функции выполняются автоматически при открытии истории. Результат каждого шага отображается в панели Interactions с возможностью перемотки и отладки.

## Autodocs

Storybook умеет автоматически генерировать страницу документации по компоненту. Для включения достаточно добавить тег `autodocs` в meta-объект.

```tsx
const meta = {
  title: 'UI/Button',
  component: Button,
  tags: ['autodocs'],
} satisfies Meta<typeof Button>;
```

Autodocs собирает информацию из нескольких источников:
- TypeScript-типы пропсов превращаются в таблицу с описанием аргументов
- JSDoc-комментарии над компонентом и его пропсами попадают в описание
- все экспортированные истории отображаются как примеры использования

```tsx
/** Primary action button used across the application. */
interface ButtonProps {
  /** Visual style variant */
  variant: 'primary' | 'secondary';
  /** Button content */
  children: React.ReactNode;
  /** Disables the button and applies muted styling */
  disabled?: boolean;
}
```

Для более гибкого управления документацией можно создать MDX-файл рядом с историями:

```mdx
{/* Button.mdx */}
import { Meta, Story, Canvas, Controls } from '@storybook/blocks';
import * as ButtonStories from './Button.stories';

<Meta of={ButtonStories} />

# Button

Основная кнопка приложения.

<Canvas of={ButtonStories.Primary} />

## Props

<Controls />
```

## Addons

Storybook имеет развитую экосистему аддонов. При инициализации устанавливается пакет `@storybook/addon-essentials`, который включает набор базовых аддонов.

Essentials (входят по умолчанию):
- Controls - интерактивная панель для изменения пропсов
- Actions - логирование событий компонента
- Viewport - переключение размеров экрана
- Backgrounds - смена фона канваса
- Measure и Outline - визуализация размеров и границ элементов

Дополнительные аддоны, которые стоит рассмотреть:

```ts
// .storybook/main.ts
const config: StorybookConfig = {
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-interactions', // тестирование взаимодействий
    '@storybook/addon-a11y',         // проверка доступности
    '@storybook/addon-designs',      // интеграция с Figma
    '@storybook/addon-coverage',     // покрытие кода
  ],
};
```

Addon a11y запускает проверки axe-core на каждой истории и показывает нарушения accessibility прямо в интерфейсе Storybook. Addon designs позволяет прикрепить ссылку на макет в Figma к конкретной истории для визуального сравнения.

> [!info] Chromatic - облачный сервис от команды Storybook для визуального регрессионного тестирования. Он автоматически делает скриншоты каждой истории и сравнивает их между коммитами.

## Тестирование компонентов

Storybook позволяет переиспользовать истории как тесты в Vitest или Jest. Для этого используется функция `composeStories` из пакета `@storybook/react`.

```tsx
// Button.test.tsx
import { composeStories } from '@storybook/react';
import { render, screen } from '@testing-library/react';
import * as stories from './Button.stories';

const { Primary, Secondary } = composeStories(stories);

test('renders primary button', () => {
  render(<Primary />);
  expect(screen.getByRole('button')).toHaveTextContent('Click me');
});

test('applies secondary variant styles', () => {
  render(<Secondary />);
  expect(screen.getByRole('button')).toHaveClass('secondary');
});
```

`composeStories` применяет все декораторы, args и параметры из истории. Компонент рендерится точно так же, как в Storybook.

Для визуального регрессионного тестирования есть несколько подходов:
- Chromatic - облачный сервис, интегрируется с CI
- `@storybook/test-runner` - запускает play-функции в headless-браузере
- Playwright или Cypress для скриншотного тестирования конкретных историй

## Storybook + Frameworks

React + Vite - конфигурация по умолчанию:

```ts
// .storybook/main.ts
const config: StorybookConfig = {
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
};
```

Next.js имеет отдельный фреймворк-адаптер, который поддерживает `next/image`, `next/link`, роутинг и другие специфичные API:

```ts
const config: StorybookConfig = {
  framework: {
    name: '@storybook/nextjs',
    options: {},
  },
};
```

Angular:

```ts
const config: StorybookConfig = {
  framework: {
    name: '@storybook/angular',
    options: {},
  },
};
```

Vue 3:

```ts
const config: StorybookConfig = {
  framework: {
    name: '@storybook/vue3-vite',
    options: {},
  },
};
```

> [!summary] Storybook 8 использует Vite по умолчанию для React и Vue. Для Next.js и Angular используются специализированные адаптеры, которые учитывают особенности этих фреймворков. Webpack остаётся доступным через `@storybook/react-webpack5`, но рекомендуется миграция на Vite.
