---
tags:
  - frontend
  - ui-frameworks
  - chakra-ui
  - react
---
# Chakra UI

Chakra UI - React UI-фреймворк с фокусом на доступности и простоте API. Версия 3 переписана поверх Ark UI, получив улучшенную производительность и расширенный набор компонентов.

## Установка

```bash
npm install @chakra-ui/react @emotion/react
```

### ChakraProvider

```tsx
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';

function App() {
  return (
    <ChakraProvider value={defaultSystem}>
      <MyApp />
    </ChakraProvider>
  );
}
```

В v3 `defaultSystem` содержит полную конфигурацию дизайн-системы: токены, рецепты компонентов, условия для responsive и dark mode.

## Основные компоненты

### Box и Flex

Box - базовый строительный блок, аналог `div` со стилевыми пропсами.

```tsx
import { Box, Flex, Text } from '@chakra-ui/react';

function CardExample() {
  return (
    <Box
      p={6}
      borderWidth="1px"
      borderRadius="lg"
      bg="bg.panel"
      shadow="sm"
      _hover={{ shadow: 'md' }}
    >
      <Text fontSize="xl" fontWeight="bold">Заголовок</Text>
      <Text color="fg.muted" mt={2}>
        Описание карточки с дополнительной информацией.
      </Text>
    </Box>
  );
}

function FlexLayout() {
  return (
    <Flex gap={4} align="center" justify="space-between" wrap="wrap">
      <Box flex="1" minW="200px">Левая колонка</Box>
      <Box flex="2" minW="300px">Правая колонка</Box>
    </Flex>
  );
}
```

### Stack

```tsx
import { Stack, HStack, VStack, Button } from '@chakra-ui/react';

function StackExamples() {
  return (
    <>
      {/* Вертикальный стек */}
      <VStack gap={4} align="stretch">
        <Box bg="blue.100" p={4}>Item 1</Box>
        <Box bg="blue.200" p={4}>Item 2</Box>
      </VStack>

      {/* Горизонтальный стек */}
      <HStack gap={3} mt={4}>
        <Button colorPalette="blue">Save</Button>
        <Button variant="outline">Cancel</Button>
      </HStack>

      {/* Адаптивный стек */}
      <Stack direction={{ base: 'column', md: 'row' }} gap={4}>
        <Box>Блок 1</Box>
        <Box>Блок 2</Box>
        <Box>Блок 3</Box>
      </Stack>
    </>
  );
}
```

### Button

```tsx
import { Button, IconButton } from '@chakra-ui/react';

function ButtonExamples() {
  return (
    <HStack gap={3}>
      <Button colorPalette="blue">Primary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="subtle" colorPalette="red">Subtle</Button>
      <Button loading loadingText="Сохранение...">Save</Button>
      <IconButton aria-label="Удалить" colorPalette="red" variant="ghost">
        <DeleteIcon />
      </IconButton>
    </HStack>
  );
}
```

### Input и форма

```tsx
import {
  Box,
  Button,
  Field,
  Input,
  Textarea,
  NativeSelect,
  Stack,
} from '@chakra-ui/react';
import { useState, FormEvent } from 'react';

interface ContactForm {
  name: string;
  email: string;
  subject: string;
  message: string;
}

function ContactFormExample() {
  const [form, setForm] = useState<ContactForm>({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ContactForm, string>>>({});

  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    if (!form.name) newErrors.name = 'Обязательное поле';
    if (!form.email) newErrors.email = 'Обязательное поле';
    else if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = 'Невалидный email';
    if (!form.message) newErrors.message = 'Введите сообщение';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (validate()) {
      console.log('Submit:', form);
    }
  };

  return (
    <Box as="form" onSubmit={handleSubmit} maxW="md">
      <Stack gap={4}>
        <Field.Root invalid={!!errors.name}>
          <Field.Label>Имя</Field.Label>
          <Input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Иван Петров"
          />
          {errors.name && <Field.ErrorText>{errors.name}</Field.ErrorText>}
        </Field.Root>

        <Field.Root invalid={!!errors.email}>
          <Field.Label>Email</Field.Label>
          <Input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="ivan@example.com"
          />
          {errors.email && <Field.ErrorText>{errors.email}</Field.ErrorText>}
        </Field.Root>

        <Field.Root>
          <Field.Label>Тема</Field.Label>
          <NativeSelect.Root>
            <NativeSelect.Field
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
            >
              <option value="">Выберите тему</option>
              <option value="support">Поддержка</option>
              <option value="feedback">Обратная связь</option>
              <option value="partnership">Сотрудничество</option>
            </NativeSelect.Field>
          </NativeSelect.Root>
        </Field.Root>

        <Field.Root invalid={!!errors.message}>
          <Field.Label>Сообщение</Field.Label>
          <Textarea
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            placeholder="Ваше сообщение..."
            rows={4}
          />
          {errors.message && <Field.ErrorText>{errors.message}</Field.ErrorText>}
        </Field.Root>

        <Button type="submit" colorPalette="blue" alignSelf="flex-start">
          Отправить
        </Button>
      </Stack>
    </Box>
  );
}
```

### Modal (Dialog)

```tsx
import { Button, Dialog, Portal, CloseButton } from '@chakra-ui/react';
import { useState } from 'react';

function ModalExample() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog.Root open={open} onOpenChange={(e) => setOpen(e.open)}>
      <Dialog.Trigger asChild>
        <Button>Открыть</Button>
      </Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Подтверждение</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <p>Вы уверены, что хотите удалить этот элемент?</p>
              <p>Это действие нельзя отменить.</p>
            </Dialog.Body>
            <Dialog.Footer gap={3}>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Отмена
              </Button>
              <Button colorPalette="red" onClick={() => setOpen(false)}>
                Удалить
              </Button>
            </Dialog.Footer>
            <Dialog.CloseTrigger asChild position="absolute" top={2} right={2}>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
```

## Responsive стили

Chakra UI использует объектный синтаксис для responsive-значений. Ключи соответствуют брейкпоинтам темы.

```tsx
import { Box, Text } from '@chakra-ui/react';

function ResponsiveExample() {
  return (
    <Box
      p={{ base: 4, md: 6, lg: 8 }}
      fontSize={{ base: 'sm', md: 'md', lg: 'lg' }}
      display={{ base: 'block', md: 'flex' }}
      gap={{ md: 6 }}
    >
      <Box flex={{ md: 1 }}>
        <Text>Колонка 1</Text>
      </Box>
      <Box flex={{ md: 2 }}>
        <Text>Колонка 2</Text>
      </Box>
    </Box>
  );
}
```

> [!info] Брейкпоинты по умолчанию
> `base` - 0px, `sm` - 480px, `md` - 768px, `lg` - 1024px, `xl` - 1280px, `2xl` - 1536px. Можно переопределить в конфигурации системы.

## Dark mode

В v3 dark mode управляется через `next-themes` или встроенный механизм.

```tsx
'use client';

import { useColorMode } from '@chakra-ui/react';
import { Button } from '@chakra-ui/react';

function ColorModeToggle() {
  const { colorMode, toggleColorMode } = useColorMode();

  return (
    <Button onClick={toggleColorMode} variant="ghost">
      {colorMode === 'light' ? 'Dark' : 'Light'} mode
    </Button>
  );
}
```

Использование semantic tokens автоматически адаптирует цвета:

```tsx
<Box bg="bg" color="fg" borderColor="border">
  Автоматическая адаптация к теме
</Box>
```

## Кастомная тема

В v3 тема создаётся через `createSystem`:

```tsx
import { createSystem, defaultConfig, defineConfig } from '@chakra-ui/react';

const config = defineConfig({
  theme: {
    tokens: {
      colors: {
        brand: {
          50: { value: '#f0f4ff' },
          100: { value: '#dce4f5' },
          500: { value: '#4472c7' },
          600: { value: '#3561af' },
          700: { value: '#2b569d' },
          900: { value: '#1c4a8b' },
        },
      },
      fonts: {
        heading: { value: '"Inter", sans-serif' },
        body: { value: '"Inter", sans-serif' },
      },
    },
    semanticTokens: {
      colors: {
        brand: {
          solid: { value: '{colors.brand.500}' },
          contrast: { value: 'white' },
          fg: { value: '{colors.brand.700}' },
          muted: { value: '{colors.brand.100}' },
        },
      },
    },
  },
});

const system = createSystem(defaultConfig, config);

function App() {
  return (
    <ChakraProvider value={system}>
      <MyApp />
    </ChakraProvider>
  );
}
```

> [!summary] Сильные стороны Chakra UI
> Chakra UI выделяется простотой API, встроенной доступностью и удобной работой с responsive-стилями через объектный синтаксис. Версия 3 на базе Ark UI значительно улучшила производительность и расширила набор компонентов. Хороший выбор для проектов, где важна скорость разработки и доступность из коробки.
