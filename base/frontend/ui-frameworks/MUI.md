---
tags:
  - frontend
  - ui-frameworks
  - mui
  - react
---
# MUI

MUI (ранее Material-UI) - React UI-фреймворк, реализующий Material Design от Google. Один из старейших и наиболее зрелых UI-фреймворков в экосистеме React с обширной экосистемой дополнительных пакетов.

## Установка

```bash
npm install @mui/material @emotion/react @emotion/styled
npm install @mui/icons-material  # иконки
```

> [!info] Emotion
> MUI v6 использует Emotion как движок CSS-in-JS по умолчанию. Поддерживается также styled-components через `@mui/material-styled-engine-sc`, но Emotion рекомендуется для новых проектов.

## ThemeProvider и createTheme

```tsx
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
      contrastText: '#fff',
    },
    secondary: {
      main: '#9c27b0',
    },
    background: {
      default: '#fafafa',
      paper: '#fff',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
    },
    button: {
      textTransform: 'none', // отключить uppercase для кнопок
    },
  },
  shape: {
    borderRadius: 8,
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <MyApp />
    </ThemeProvider>
  );
}
```

## Стилизация

### Sx prop

`sx` - основной способ добавления одноразовых стилей. Поддерживает тему, отзывчивые значения и shorthand-свойства.

```tsx
import { Box, Typography } from '@mui/material';

function Card() {
  return (
    <Box
      sx={{
        p: 3,           // padding: theme.spacing(3) = 24px
        mb: 2,           // marginBottom: theme.spacing(2)
        borderRadius: 2, // theme.shape.borderRadius * 2
        bgcolor: 'background.paper',
        boxShadow: 1,
        '&:hover': {
          boxShadow: 4,
        },
        // Responsive значения
        width: {
          xs: '100%',
          sm: '50%',
          md: '33%',
        },
      }}
    >
      <Typography variant="h6" color="text.primary">
        Заголовок карточки
      </Typography>
    </Box>
  );
}
```

### styled()

Для переиспользуемых стилизованных компонентов:

```tsx
import { styled } from '@mui/material/styles';
import { Button, ButtonProps } from '@mui/material';

const GradientButton = styled(Button)<ButtonProps>(({ theme }) => ({
  background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
  color: '#fff',
  padding: theme.spacing(1, 4),
  '&:hover': {
    background: `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`,
  },
}));

// Использование
<GradientButton variant="contained">Gradient</GradientButton>
```

## Основные компоненты

### Layout: Box, Stack, Grid2

```tsx
import { Box, Stack, Grid2 as Grid, Paper } from '@mui/material';

// Stack - вертикальный/горизонтальный layout
function StackExample() {
  return (
    <Stack direction="row" spacing={2} alignItems="center">
      <Button variant="contained">Save</Button>
      <Button variant="outlined">Cancel</Button>
    </Stack>
  );
}

// Grid2 - CSS Grid-based layout (замена старого Grid)
function GridExample() {
  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, md: 8 }}>
        <Paper sx={{ p: 2 }}>Основной контент</Paper>
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <Paper sx={{ p: 2 }}>Сайдбар</Paper>
      </Grid>
    </Grid>
  );
}
```

### Typography

```tsx
import { Typography } from '@mui/material';

function TypographyDemo() {
  return (
    <>
      <Typography variant="h1">Heading 1</Typography>
      <Typography variant="h4" component="h2" gutterBottom>
        Heading с другим тегом
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Основной текст с приглушённым цветом
      </Typography>
      <Typography variant="caption" display="block">
        Мелкий текст
      </Typography>
    </>
  );
}
```

### TextField и формы

```tsx
import { TextField, Button, Stack, MenuItem, FormControlLabel, Checkbox } from '@mui/material';
import { useState, FormEvent } from 'react';

interface FormData {
  name: string;
  email: string;
  role: string;
  agree: boolean;
}

function ContactForm() {
  const [form, setForm] = useState<FormData>({
    name: '',
    email: '',
    role: '',
    agree: false,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    if (!form.name) newErrors.name = 'Обязательное поле';
    if (!form.email) newErrors.email = 'Обязательное поле';
    else if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = 'Невалидный email';
    if (!form.role) newErrors.role = 'Выберите роль';
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
    <form onSubmit={handleSubmit}>
      <Stack spacing={3} sx={{ maxWidth: 400 }}>
        <TextField
          label="Имя"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          error={!!errors.name}
          helperText={errors.name}
          required
        />
        <TextField
          label="Email"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          error={!!errors.email}
          helperText={errors.email}
          required
        />
        <TextField
          select
          label="Роль"
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value })}
          error={!!errors.role}
          helperText={errors.role}
        >
          <MenuItem value="developer">Разработчик</MenuItem>
          <MenuItem value="designer">Дизайнер</MenuItem>
          <MenuItem value="manager">Менеджер</MenuItem>
        </TextField>
        <FormControlLabel
          control={
            <Checkbox
              checked={form.agree}
              onChange={(e) => setForm({ ...form, agree: e.target.checked })}
            />
          }
          label="Согласен с условиями"
        />
        <Button type="submit" variant="contained" size="large">
          Отправить
        </Button>
      </Stack>
    </form>
  );
}
```

### Button

```tsx
import { Button, IconButton, ButtonGroup, LoadingButton } from '@mui/material';
import { Delete, Send } from '@mui/icons-material';

function ButtonExamples() {
  return (
    <Stack spacing={2}>
      <Button variant="contained">Contained</Button>
      <Button variant="outlined" color="secondary">Outlined</Button>
      <Button variant="text">Text</Button>
      <Button variant="contained" startIcon={<Send />}>Отправить</Button>
      <IconButton color="error" aria-label="удалить">
        <Delete />
      </IconButton>
      <ButtonGroup variant="outlined">
        <Button>One</Button>
        <Button>Two</Button>
        <Button>Three</Button>
      </ButtonGroup>
    </Stack>
  );
}
```

## MUI X

MUI X - коммерческая линейка продвинутых компонентов.

### DataGrid

```tsx
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { Chip } from '@mui/material';

interface Order {
  id: number;
  customer: string;
  amount: number;
  status: 'pending' | 'completed' | 'cancelled';
  date: string;
}

const columns: GridColDef<Order>[] = [
  { field: 'id', headerName: 'ID', width: 70 },
  { field: 'customer', headerName: 'Клиент', flex: 1, minWidth: 150 },
  {
    field: 'amount',
    headerName: 'Сумма',
    width: 130,
    type: 'number',
    valueFormatter: (value: number) => `${value.toLocaleString('ru-RU')} RUB`,
  },
  {
    field: 'status',
    headerName: 'Статус',
    width: 130,
    renderCell: (params: GridRenderCellParams<Order>) => {
      const colors: Record<string, 'warning' | 'success' | 'error'> = {
        pending: 'warning',
        completed: 'success',
        cancelled: 'error',
      };
      return <Chip label={params.value} color={colors[params.value]} size="small" />;
    },
  },
  {
    field: 'date',
    headerName: 'Дата',
    width: 130,
    type: 'date',
    valueGetter: (value: string) => new Date(value),
  },
];

function OrdersGrid() {
  return (
    <DataGrid
      rows={orders}
      columns={columns}
      initialState={{
        pagination: { paginationModel: { pageSize: 25 } },
        sorting: { sortModel: [{ field: 'date', sort: 'desc' }] },
      }}
      pageSizeOptions={[10, 25, 50]}
      checkboxSelection
      disableRowSelectionOnClick
      sx={{ height: 600 }}
    />
  );
}
```

### DatePicker

```tsx
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/ru';

function DatePickerExample() {
  const [value, setValue] = useState<Dayjs | null>(dayjs());

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ru">
      <DatePicker
        label="Дата рождения"
        value={value}
        onChange={setValue}
        format="DD.MM.YYYY"
        slotProps={{
          textField: { fullWidth: true },
        }}
      />
    </LocalizationProvider>
  );
}
```

## Joy UI

Joy UI - альтернативная дизайн-система от MUI, не привязанная к Material Design. Легче и гибче, подходит для проектов с уникальным визуалом.

```tsx
import { CssVarsProvider } from '@mui/joy/styles';
import { Button, Input, Sheet } from '@mui/joy';

function JoyExample() {
  return (
    <CssVarsProvider>
      <Sheet variant="outlined" sx={{ p: 3, borderRadius: 'md' }}>
        <Input placeholder="Поиск..." size="lg" />
        <Button variant="solid" color="primary" sx={{ mt: 2 }}>
          Найти
        </Button>
      </Sheet>
    </CssVarsProvider>
  );
}
```

## Оптимизация производительности

### Минимизация бандла

```tsx
// Правильный именованный импорт (tree-shaking работает)
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';

// Допустимо, но может увеличить бандл без правильной конфигурации бандлера
import { Button, TextField } from '@mui/material';
```

### Кастомные иконки вместо полного пакета

```tsx
// Вместо всего пакета @mui/icons-material
// можно использовать SvgIcon с кастомными SVG
import { SvgIcon, SvgIconProps } from '@mui/material';

function CustomIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
    </SvgIcon>
  );
}
```

> [!important] Grid2 вместо Grid
> В MUI v6 компонент Grid2 заменяет устаревший Grid. Grid2 основан на CSS Grid, работает быстрее и имеет более предсказуемое поведение. Для новых проектов используйте `Grid2`.
