---
tags:
  - frontend
  - ui-frameworks
  - mantine
  - react
---

Mantine - современный React UI-фреймворк с обширным набором компонентов, хуков и утилит. Версия 7 отказалась от CSS-in-JS в пользу PostCSS-модулей и CSS-переменных, что устранило runtime-overhead стилизации.

## Установка

```bash
npm install @mantine/core @mantine/hooks
npm install postcss postcss-preset-mantine postcss-simple-vars
```

Конфигурация PostCSS:

```js
// postcss.config.mjs
export default {
  plugins: {
    'postcss-preset-mantine': {},
    'postcss-simple-vars': {
      variables: {
        'mantine-breakpoint-xs': '36em',
        'mantine-breakpoint-sm': '48em',
        'mantine-breakpoint-md': '62em',
        'mantine-breakpoint-lg': '75em',
        'mantine-breakpoint-xl': '88em',
      },
    },
  },
};
```

### MantineProvider

```tsx
import { MantineProvider, createTheme } from '@mantine/core';
import '@mantine/core/styles.css';

const theme = createTheme({
  primaryColor: 'blue',
  fontFamily: 'Inter, sans-serif',
  defaultRadius: 'md',
});

function App() {
  return (
    <MantineProvider theme={theme} defaultColorScheme="light">
      <MyApp />
    </MantineProvider>
  );
}
```

## Стилизация через CSS-переменные

Mantine v7 генерирует CSS-переменные для всех токенов темы. Это позволяет использовать стандартный CSS для стилизации.

```css
/* Component.module.css */
.card {
  background-color: var(--mantine-color-body);
  border: 1px solid var(--mantine-color-default-border);
  border-radius: var(--mantine-radius-md);
  padding: var(--mantine-spacing-md);
}

.card:hover {
  box-shadow: var(--mantine-shadow-sm);
}

/* Responsive через миксины */
@media (max-width: $mantine-breakpoint-sm) {
  .card {
    padding: var(--mantine-spacing-xs);
  }
}
```

```tsx
import classes from './Component.module.css';
import { Paper } from '@mantine/core';

function MyCard() {
  return <Paper className={classes.card}>Content</Paper>;
}
```

## Основные компоненты

### Button

```tsx
import { Button, Group } from '@mantine/core';

function ButtonExamples() {
  return (
    <Group>
      <Button>Default</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="light">Light</Button>
      <Button variant="subtle">Subtle</Button>
      <Button variant="filled" color="red">Danger</Button>
      <Button loading>Loading</Button>
      <Button leftSection={<IconPlus size={16} />}>Добавить</Button>
    </Group>
  );
}
```

### TextInput и Select

```tsx
import { TextInput, Select, PasswordInput, Textarea, NumberInput } from '@mantine/core';

function FormInputs() {
  return (
    <>
      <TextInput
        label="Email"
        placeholder="user@example.com"
        description="Используется для входа"
        error="Невалидный email"
        required
      />
      <PasswordInput
        label="Пароль"
        placeholder="Минимум 8 символов"
        required
        mt="md"
      />
      <Select
        label="Город"
        placeholder="Выберите город"
        data={['Москва', 'Санкт-Петербург', 'Новосибирск', 'Екатеринбург']}
        searchable
        clearable
        mt="md"
      />
      <NumberInput
        label="Возраст"
        placeholder="25"
        min={0}
        max={150}
        mt="md"
      />
    </>
  );
}
```

### Modal и Drawer

```tsx
import { Modal, Drawer, Button } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';

function ModalExample() {
  const [opened, { open, close }] = useDisclosure(false);

  return (
    <>
      <Button onClick={open}>Открыть модал</Button>
      <Modal opened={opened} onClose={close} title="Заголовок" centered>
        <p>Содержимое модального окна</p>
        <Button onClick={close} mt="md">Закрыть</Button>
      </Modal>
    </>
  );
}

function DrawerExample() {
  const [opened, { open, close }] = useDisclosure(false);

  return (
    <>
      <Button onClick={open}>Открыть drawer</Button>
      <Drawer opened={opened} onClose={close} title="Настройки" position="right">
        <p>Содержимое drawer</p>
      </Drawer>
    </>
  );
}
```

### Tabs

```tsx
import { Tabs } from '@mantine/core';

function TabsExample() {
  return (
    <Tabs defaultValue="general">
      <Tabs.List>
        <Tabs.Tab value="general">Общие</Tabs.Tab>
        <Tabs.Tab value="security">Безопасность</Tabs.Tab>
        <Tabs.Tab value="notifications">Уведомления</Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel value="general" pt="md">
        Общие настройки
      </Tabs.Panel>
      <Tabs.Panel value="security" pt="md">
        Настройки безопасности
      </Tabs.Panel>
      <Tabs.Panel value="notifications" pt="md">
        Настройки уведомлений
      </Tabs.Panel>
    </Tabs>
  );
}
```

## Form handling с @mantine/form

```bash
npm install @mantine/form
```

`@mantine/form` предоставляет хук `useForm` для управления состоянием формы и валидацией.

```tsx
import { useForm } from '@mantine/form';
import { TextInput, PasswordInput, Checkbox, Button, Group, Stack } from '@mantine/core';

interface SignUpForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  terms: boolean;
}

function SignUpPage() {
  const form = useForm<SignUpForm>({
    mode: 'uncontrolled',
    initialValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      terms: false,
    },
    validate: {
      name: (value) => (value.length < 2 ? 'Минимум 2 символа' : null),
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Невалидный email'),
      password: (value) =>
        value.length < 8 ? 'Минимум 8 символов' : null,
      confirmPassword: (value, values) =>
        value !== values.password ? 'Пароли не совпадают' : null,
      terms: (value) => (!value ? 'Необходимо принять условия' : null),
    },
  });

  const handleSubmit = (values: SignUpForm) => {
    console.log('Submit:', values);
  };

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack gap="md">
        <TextInput
          label="Имя"
          placeholder="Иван Петров"
          key={form.key('name')}
          {...form.getInputProps('name')}
        />
        <TextInput
          label="Email"
          placeholder="ivan@example.com"
          key={form.key('email')}
          {...form.getInputProps('email')}
        />
        <PasswordInput
          label="Пароль"
          placeholder="Минимум 8 символов"
          key={form.key('password')}
          {...form.getInputProps('password')}
        />
        <PasswordInput
          label="Подтверждение пароля"
          placeholder="Повторите пароль"
          key={form.key('confirmPassword')}
          {...form.getInputProps('confirmPassword')}
        />
        <Checkbox
          label="Я принимаю условия использования"
          key={form.key('terms')}
          {...form.getInputProps('terms', { type: 'checkbox' })}
        />
        <Group justify="flex-end">
          <Button type="submit">Зарегистрироваться</Button>
        </Group>
      </Stack>
    </form>
  );
}
```

### Вложенные поля и списки

```tsx
const form = useForm({
  initialValues: {
    employees: [{ name: '', email: '' }],
  },
});

// Добавить элемент
form.insertListItem('employees', { name: '', email: '' });

// Удалить элемент
form.removeListItem('employees', 0);

// Рендер списка
{form.getValues().employees.map((_, index) => (
  <Group key={form.key(`employees.${index}`)}>
    <TextInput
      {...form.getInputProps(`employees.${index}.name`)}
      placeholder="Имя"
    />
    <TextInput
      {...form.getInputProps(`employees.${index}.email`)}
      placeholder="Email"
    />
    <Button color="red" onClick={() => form.removeListItem('employees', index)}>
      Удалить
    </Button>
  </Group>
))}
```

## Hooks - @mantine/hooks

Mantine предоставляет 50+ переиспользуемых хуков.

```tsx
import {
  useDisclosure,
  useDebouncedValue,
  useMediaQuery,
  useLocalStorage,
  useClipboard,
  useIntersection,
} from '@mantine/hooks';

// useDisclosure - управление boolean-состоянием
const [opened, { open, close, toggle }] = useDisclosure(false);

// useDebouncedValue - дебаунс значения
const [search, setSearch] = useState('');
const [debounced] = useDebouncedValue(search, 300);

// useMediaQuery - отзывчивые условия
const isMobile = useMediaQuery('(max-width: 48em)');

// useLocalStorage - состояние в localStorage с типизацией
const [colorScheme, setColorScheme] = useLocalStorage<'light' | 'dark'>({
  key: 'color-scheme',
  defaultValue: 'light',
});

// useClipboard - копирование в буфер
const clipboard = useClipboard({ timeout: 2000 });
// clipboard.copy('текст');
// clipboard.copied - true в течение timeout

// useIntersection - Intersection Observer
const { ref, entry } = useIntersection({ threshold: 0.5 });
const isVisible = entry?.isIntersecting;
```

## Notifications - @mantine/notifications

```bash
npm install @mantine/notifications
```

```tsx
// В корне приложения
import { Notifications } from '@mantine/notifications';
import '@mantine/notifications/styles.css';

function App() {
  return (
    <MantineProvider>
      <Notifications position="top-right" />
      <MyApp />
    </MantineProvider>
  );
}

// В любом компоненте
import { notifications } from '@mantine/notifications';

function showSuccess() {
  notifications.show({
    title: 'Сохранено',
    message: 'Данные успешно обновлены',
    color: 'green',
    autoClose: 3000,
  });
}

function showError() {
  notifications.show({
    title: 'Ошибка',
    message: 'Не удалось сохранить данные. Попробуйте позже.',
    color: 'red',
    autoClose: false,
  });
}

// Обновляемое уведомление (для прогресса)
function showProgress() {
  const id = notifications.show({
    loading: true,
    title: 'Загрузка файла',
    message: 'Пожалуйста, подождите...',
    autoClose: false,
    withCloseButton: false,
  });

  // Позже обновить
  notifications.update({
    id,
    loading: false,
    title: 'Файл загружен',
    message: 'Файл успешно загружен на сервер',
    color: 'green',
    autoClose: 3000,
  });
}
```

## Rich text editor - @mantine/tiptap

```bash
npm install @mantine/tiptap @tiptap/react @tiptap/starter-kit @tiptap/extension-link
```

```tsx
import { RichTextEditor, Link } from '@mantine/tiptap';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import '@mantine/tiptap/styles.css';

function TextEditor() {
  const editor = useEditor({
    extensions: [StarterKit, Link],
    content: '<p>Начните вводить текст...</p>',
  });

  return (
    <RichTextEditor editor={editor}>
      <RichTextEditor.Toolbar sticky stickyOffset={60}>
        <RichTextEditor.ControlsGroup>
          <RichTextEditor.Bold />
          <RichTextEditor.Italic />
          <RichTextEditor.Strikethrough />
          <RichTextEditor.Code />
        </RichTextEditor.ControlsGroup>
        <RichTextEditor.ControlsGroup>
          <RichTextEditor.H1 />
          <RichTextEditor.H2 />
          <RichTextEditor.H3 />
        </RichTextEditor.ControlsGroup>
        <RichTextEditor.ControlsGroup>
          <RichTextEditor.BulletList />
          <RichTextEditor.OrderedList />
        </RichTextEditor.ControlsGroup>
        <RichTextEditor.ControlsGroup>
          <RichTextEditor.Link />
          <RichTextEditor.Unlink />
        </RichTextEditor.ControlsGroup>
      </RichTextEditor.Toolbar>
      <RichTextEditor.Content />
    </RichTextEditor>
  );
}
```

## Dates - @mantine/dates

```bash
npm install @mantine/dates dayjs
```

```tsx
import { DateInput, DatePicker, DateTimePicker } from '@mantine/dates';
import '@mantine/dates/styles.css';
import 'dayjs/locale/ru';

function DateExamples() {
  const [date, setDate] = useState<Date | null>(null);

  return (
    <>
      <DateInput
        label="Дата рождения"
        placeholder="Выберите дату"
        value={date}
        onChange={setDate}
        locale="ru"
        valueFormat="DD.MM.YYYY"
      />
      <DateTimePicker
        label="Дата и время"
        placeholder="Выберите"
        locale="ru"
        mt="md"
      />
      <DatePicker
        type="range"
        label="Период"
        locale="ru"
        mt="md"
      />
    </>
  );
}
```

## Кастомная тема

```tsx
import { createTheme, MantineColorsTuple } from '@mantine/core';

const brand: MantineColorsTuple = [
  '#f0f4ff',
  '#dce4f5',
  '#b4c6e7',
  '#8aa6da',
  '#668bcf',
  '#4f7ac9',
  '#4472c7',
  '#3561af',
  '#2b569d',
  '#1c4a8b',
];

const theme = createTheme({
  colors: {
    brand,
  },
  primaryColor: 'brand',
  primaryShade: { light: 6, dark: 7 },
  fontFamily: '"Inter", sans-serif',
  headings: {
    fontFamily: '"Inter", sans-serif',
    fontWeight: '700',
  },
  defaultRadius: 'md',
  components: {
    Button: {
      defaultProps: {
        radius: 'md',
      },
    },
    TextInput: {
      defaultProps: {
        radius: 'md',
      },
    },
  },
});
```

> [!summary] Почему Mantine
> Mantine выделяется среди конкурентов тремя вещами: отсутствие CSS-in-JS runtime в v7, богатейший набор хуков из коробки и модульная архитектура, позволяющая подключать только нужные пакеты. Для проектов, где нужна максимальная функциональность с минимальным boilerplate - это сильный выбор.
