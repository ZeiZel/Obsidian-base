---
tags:
  - frontend
  - ui-frameworks
  - shadcn
  - react
---
# Shadcn UI

Shadcn UI - это не библиотека в традиционном смысле. Это набор переиспользуемых компонентов, которые копируются непосредственно в проект. Построен на Radix UI для доступности и Tailwind CSS для стилизации. Философия - полный контроль над кодом компонентов без зависимости от npm-пакета.

## Установка

### Инициализация проекта

```bash
npx shadcn@latest init
```

CLI задаст несколько вопросов:

- Style: Default или New York
- Base color: Slate, Gray, Zinc, Neutral, Stone
- CSS variables: да/нет

Результат - конфигурационный файл `components.json` и базовые утилиты.

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "app/globals.css",
    "baseColor": "zinc",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
```

### Добавление компонентов

```bash
# Добавить один компонент
npx shadcn@latest add button

# Добавить несколько
npx shadcn@latest add dialog form table

# Добавить все
npx shadcn@latest add --all
```

Компоненты появляются в `components/ui/`. Это обычные TypeScript-файлы, которые можно модифицировать.

## Философия - own your components

В отличие от библиотек вроде MUI или Ant Design, shadcn/ui не устанавливается как зависимость. Компоненты становятся частью кодовой базы проекта. Это означает:

- Полный контроль над стилями и поведением
- Нет vendor lock-in
- Нет проблем с обновлениями, ломающими интерфейс
- Легко адаптировать под дизайн-систему

Утилитарная функция `cn` для объединения classNames:

```tsx
// lib/utils.ts
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

## Основные компоненты

### Button

```tsx
import { Button } from '@/components/ui/button';

function ButtonExamples() {
  return (
    <div className="flex gap-4">
      <Button>Default</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="destructive">Delete</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link</Button>
      <Button size="sm">Small</Button>
      <Button size="lg">Large</Button>
      <Button disabled>Disabled</Button>
    </div>
  );
}
```

### Dialog

```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function EditProfileDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Редактировать профиль</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Профиль</DialogTitle>
          <DialogDescription>
            Измените данные профиля и нажмите сохранить.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">Имя</Label>
            <Input id="name" defaultValue="Иван Петров" className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">Email</Label>
            <Input id="email" defaultValue="ivan@example.com" className="col-span-3" />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit">Сохранить</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

### Table

```tsx
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface Invoice {
  id: string;
  status: 'paid' | 'pending' | 'overdue';
  method: string;
  amount: number;
}

function InvoicesTable({ invoices }: { invoices: Invoice[] }) {
  return (
    <Table>
      <TableCaption>Список последних счетов</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">ID</TableHead>
          <TableHead>Статус</TableHead>
          <TableHead>Метод оплаты</TableHead>
          <TableHead className="text-right">Сумма</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.map((invoice) => (
          <TableRow key={invoice.id}>
            <TableCell className="font-medium">{invoice.id}</TableCell>
            <TableCell>
              <Badge variant={invoice.status === 'paid' ? 'default' : 'destructive'}>
                {invoice.status}
              </Badge>
            </TableCell>
            <TableCell>{invoice.method}</TableCell>
            <TableCell className="text-right">
              {invoice.amount.toLocaleString('ru-RU')} RUB
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

### Command (cmdk)

Command - компонент для поиска и навигации, аналог Command Palette.

```tsx
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { useState, useEffect } from 'react';

function CommandMenu() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Введите команду или поиск..." />
      <CommandList>
        <CommandEmpty>Ничего не найдено</CommandEmpty>
        <CommandGroup heading="Навигация">
          <CommandItem onSelect={() => navigate('/dashboard')}>
            Dashboard
          </CommandItem>
          <CommandItem onSelect={() => navigate('/settings')}>
            Настройки
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Действия">
          <CommandItem>Создать проект</CommandItem>
          <CommandItem>Пригласить пользователя</CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
```

### Sheet (боковая панель)

```tsx
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

function MobileMenu() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon">
          <MenuIcon className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left">
        <SheetHeader>
          <SheetTitle>Меню</SheetTitle>
          <SheetDescription>Навигация по приложению</SheetDescription>
        </SheetHeader>
        <nav className="flex flex-col gap-2 mt-4">
          <a href="/dashboard" className="p-2 hover:bg-accent rounded-md">Dashboard</a>
          <a href="/projects" className="p-2 hover:bg-accent rounded-md">Проекты</a>
          <a href="/settings" className="p-2 hover:bg-accent rounded-md">Настройки</a>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
```

## Тематизация через CSS-переменные

Shadcn/ui использует CSS-переменные для тематизации. Переменные определяются в `globals.css`:

```css
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 240 10% 3.9%;
    --card: 0 0% 100%;
    --card-foreground: 240 10% 3.9%;
    --primary: 240 5.9% 10%;
    --primary-foreground: 0 0% 98%;
    --secondary: 240 4.8% 95.9%;
    --secondary-foreground: 240 5.9% 10%;
    --muted: 240 4.8% 95.9%;
    --muted-foreground: 240 3.8% 46.1%;
    --accent: 240 4.8% 95.9%;
    --accent-foreground: 240 5.9% 10%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 98%;
    --border: 240 5.9% 90%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 240 10% 3.9%;
    --foreground: 0 0% 98%;
    --primary: 0 0% 98%;
    --primary-foreground: 240 5.9% 10%;
    /* ... остальные переменные */
  }
}
```

## Интеграция с React Hook Form и Zod

Shadcn/ui предоставляет компонент Form, который оборачивает React Hook Form с поддержкой Zod-валидации.

```bash
npx shadcn@latest add form
npm install zod
```

```tsx
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const formSchema = z.object({
  username: z
    .string()
    .min(3, 'Минимум 3 символа')
    .max(20, 'Максимум 20 символов'),
  email: z.string().email('Невалидный email'),
  role: z.enum(['admin', 'user', 'moderator'], {
    required_error: 'Выберите роль',
  }),
});

type FormValues = z.infer<typeof formSchema>;

function CreateUserForm() {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
      email: '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    console.log(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Имя пользователя</FormLabel>
              <FormControl>
                <Input placeholder="john_doe" {...field} />
              </FormControl>
              <FormDescription>
                Отображаемое имя в системе
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="john@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Роль</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите роль" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="admin">Администратор</SelectItem>
                  <SelectItem value="user">Пользователь</SelectItem>
                  <SelectItem value="moderator">Модератор</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Создать</Button>
      </form>
    </Form>
  );
}
```

## Темы: New York и Default

Shadcn/ui предлагает два стиля компонентов:

- Default - более округлые, мягкие формы. Подходит для consumer-приложений
- New York - более компактные, строгие. Подходит для enterprise и dashboard

Стиль выбирается при инициализации и влияет на код генерируемых компонентов.

## Интеграция с Next.js

Shadcn/ui изначально разрабатывался с учётом Next.js App Router. Все компоненты совместимы с Server Components. Интерактивные компоненты автоматически включают `"use client"` директиву.

```tsx
// app/page.tsx (Server Component)
import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <main className="container mx-auto py-10">
      <h1 className="text-4xl font-bold mb-6">Главная</h1>
      <Button asChild>
        <a href="/dashboard">Перейти в dashboard</a>
      </Button>
    </main>
  );
}
```

> [!summary] Когда выбирать shadcn/ui
> Shadcn/ui идеально подходит, когда команде нужна доступная основа для компонентов без привязки к конкретной библиотеке. Компоненты становятся частью проекта, их легко модифицировать и расширять. Сочетание Radix UI для доступности и Tailwind CSS для стилизации даёт отличный баланс между скоростью разработки и гибкостью.
