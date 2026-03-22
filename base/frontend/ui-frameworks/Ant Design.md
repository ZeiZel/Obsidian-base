---
tags:
  - frontend
  - ui-frameworks
  - antd
  - react
---
# Ant Design

Ant Design - enterprise-grade UI-фреймворк, разработанный Alibaba. Специализируется на бизнес-приложениях с акцентом на сложные формы, таблицы и дашборды. Версия 5 полностью переработала систему стилей, перейдя на CSS-in-JS с design tokens.

## Установка

```bash
npm install antd
# или
pnpm add antd
```

Начиная с antd v5, не нужно отдельно импортировать CSS-файлы. Стили генерируются через CSS-in-JS на базе `@ant-design/cssinjs`.

```tsx
import { Button, DatePicker } from 'antd';

function App() {
  return (
    <div>
      <Button type="primary">Primary Button</Button>
      <DatePicker />
    </div>
  );
}
```

## ConfigProvider и тематизация

ConfigProvider управляет глобальной конфигурацией: тема, локализация, размеры компонентов.

```tsx
import { ConfigProvider, theme } from 'antd';
import ruRU from 'antd/locale/ru_RU';

function App() {
  return (
    <ConfigProvider
      locale={ruRU}
      theme={{
        token: {
          colorPrimary: '#1677ff',
          borderRadius: 6,
          fontSize: 14,
        },
        algorithm: theme.defaultAlgorithm,
      }}
    >
      <MyApp />
    </ConfigProvider>
  );
}
```

### Design Tokens

В v5 тематизация построена на системе токенов, организованных в три уровня:

- Seed Tokens - базовые значения, из которых алгоритм генерирует остальные
- Map Tokens - производные токены, вычисляемые из seed
- Alias Tokens - токены конкретных компонентов

```tsx
const customTheme = {
  token: {
    // Seed tokens
    colorPrimary: '#722ed1',
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#ff4d4f',
    fontSize: 14,
    borderRadius: 8,
    wireframe: false,
  },
  components: {
    Button: {
      colorPrimary: '#1890ff',
      algorithm: true, // наследовать алгоритм от глобальной темы
    },
    Input: {
      controlHeight: 40,
    },
  },
};
```

### Темная тема

```tsx
import { ConfigProvider, theme } from 'antd';

<ConfigProvider
  theme={{
    algorithm: theme.darkAlgorithm,
  }}
>
  <App />
</ConfigProvider>
```

Можно комбинировать алгоритмы:

```tsx
theme={{
  algorithm: [theme.darkAlgorithm, theme.compactAlgorithm],
}}
```

## Основные компоненты

### Layout

```tsx
import { Layout, Menu } from 'antd';

const { Header, Sider, Content, Footer } = Layout;

function AppLayout() {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible>
        <Menu
          theme="dark"
          mode="inline"
          items={[
            { key: '1', icon: <DashboardOutlined />, label: 'Dashboard' },
            { key: '2', icon: <UserOutlined />, label: 'Users' },
            {
              key: 'sub1',
              icon: <SettingOutlined />,
              label: 'Settings',
              children: [
                { key: '3', label: 'General' },
                { key: '4', label: 'Security' },
              ],
            },
          ]}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: 0, background: '#fff' }} />
        <Content style={{ margin: '24px 16px', padding: 24 }}>
          {/* Page content */}
        </Content>
        <Footer style={{ textAlign: 'center' }}>
          My App 2026
        </Footer>
      </Layout>
    </Layout>
  );
}
```

### Form с валидацией

Form в Ant Design использует собственный механизм управления состоянием. Валидация описывается декларативно через правила.

```tsx
import { Form, Input, Select, Button, message } from 'antd';

interface UserFormValues {
  username: string;
  email: string;
  role: 'admin' | 'user' | 'moderator';
  bio?: string;
}

function UserForm() {
  const [form] = Form.useForm<UserFormValues>();

  const onFinish = async (values: UserFormValues) => {
    try {
      await api.createUser(values);
      message.success('Пользователь создан');
      form.resetFields();
    } catch (error) {
      message.error('Ошибка при создании');
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
      initialValues={{ role: 'user' }}
      autoComplete="off"
    >
      <Form.Item
        label="Имя пользователя"
        name="username"
        rules={[
          { required: true, message: 'Введите имя пользователя' },
          { min: 3, message: 'Минимум 3 символа' },
          { max: 20, message: 'Максимум 20 символов' },
          {
            pattern: /^[a-zA-Z0-9_]+$/,
            message: 'Только латиница, цифры и подчёркивание',
          },
        ]}
      >
        <Input placeholder="john_doe" />
      </Form.Item>

      <Form.Item
        label="Email"
        name="email"
        rules={[
          { required: true, message: 'Введите email' },
          { type: 'email', message: 'Невалидный email' },
        ]}
      >
        <Input placeholder="john@example.com" />
      </Form.Item>

      <Form.Item
        label="Роль"
        name="role"
        rules={[{ required: true }]}
      >
        <Select
          options={[
            { value: 'admin', label: 'Администратор' },
            { value: 'user', label: 'Пользователь' },
            { value: 'moderator', label: 'Модератор' },
          ]}
        />
      </Form.Item>

      <Form.Item label="О себе" name="bio">
        <Input.TextArea rows={4} maxLength={500} showCount />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit">
          Создать
        </Button>
      </Form.Item>
    </Form>
  );
}
```

### Асинхронная валидация

```tsx
<Form.Item
  label="Username"
  name="username"
  rules={[
    { required: true },
    {
      validator: async (_, value) => {
        if (!value) return;
        const exists = await api.checkUsername(value);
        if (exists) {
          throw new Error('Имя уже занято');
        }
      },
    },
  ]}
  hasFeedback
>
  <Input />
</Form.Item>
```

### Table с сортировкой, фильтрацией и пагинацией

Table - один из самых мощных компонентов Ant Design. Поддерживает серверную и клиентскую сортировку, фильтрацию, пагинацию, выделение строк и вложенные таблицы.

```tsx
import { Table, Tag, Space, Button, Input } from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import type { FilterValue, SorterResult } from 'antd/es/table/interface';
import { useState } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'moderator';
  status: 'active' | 'inactive';
  createdAt: string;
}

interface TableParams {
  pagination: TablePaginationConfig;
  sortField?: string;
  sortOrder?: string;
  filters?: Record<string, FilterValue | null>;
}

function UsersTable() {
  const [data, setData] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [tableParams, setTableParams] = useState<TableParams>({
    pagination: {
      current: 1,
      pageSize: 10,
      showSizeChanger: true,
      showTotal: (total) => `Всего ${total} записей`,
    },
  });

  const columns: ColumnsType<User> = [
    {
      title: 'Имя',
      dataIndex: 'name',
      sorter: true,
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="Поиск по имени"
            value={selectedKeys[0]}
            onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
            onPressEnter={() => confirm()}
          />
        </div>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      sorter: true,
    },
    {
      title: 'Роль',
      dataIndex: 'role',
      filters: [
        { text: 'Админ', value: 'admin' },
        { text: 'Пользователь', value: 'user' },
        { text: 'Модератор', value: 'moderator' },
      ],
      render: (role: string) => {
        const colors: Record<string, string> = {
          admin: 'red',
          user: 'blue',
          moderator: 'green',
        };
        return <Tag color={colors[role]}>{role}</Tag>;
      },
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      filters: [
        { text: 'Активен', value: 'active' },
        { text: 'Неактивен', value: 'inactive' },
      ],
      render: (status: string) => (
        <Tag color={status === 'active' ? 'success' : 'default'}>
          {status === 'active' ? 'Активен' : 'Неактивен'}
        </Tag>
      ),
    },
    {
      title: 'Действия',
      render: (_, record) => (
        <Space>
          <Button type="link" onClick={() => handleEdit(record)}>
            Редактировать
          </Button>
          <Button type="link" danger onClick={() => handleDelete(record.id)}>
            Удалить
          </Button>
        </Space>
      ),
    },
  ];

  const handleTableChange = (
    pagination: TablePaginationConfig,
    filters: Record<string, FilterValue | null>,
    sorter: SorterResult<User> | SorterResult<User>[]
  ) => {
    setTableParams({
      pagination,
      filters,
      sortField: Array.isArray(sorter) ? undefined : (sorter.field as string),
      sortOrder: Array.isArray(sorter) ? undefined : (sorter.order as string),
    });
    // fetchData с новыми параметрами
  };

  return (
    <Table
      columns={columns}
      dataSource={data}
      rowKey="id"
      loading={loading}
      pagination={tableParams.pagination}
      onChange={handleTableChange}
      rowSelection={{
        type: 'checkbox',
        onChange: (selectedRowKeys) => {
          console.log('Selected:', selectedRowKeys);
        },
      }}
    />
  );
}
```

### Modal и Drawer

```tsx
import { Modal, Drawer, Button } from 'antd';
import { useState } from 'react';

function ModalExample() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Открыть</Button>
      <Modal
        title="Подтверждение"
        open={open}
        onOk={() => setOpen(false)}
        onCancel={() => setOpen(false)}
        okText="Подтвердить"
        cancelText="Отмена"
        destroyOnClose
      >
        <p>Вы уверены, что хотите продолжить?</p>
      </Modal>
    </>
  );
}

// Программное подтверждение
function showConfirm() {
  Modal.confirm({
    title: 'Удалить запись?',
    content: 'Это действие нельзя отменить.',
    okText: 'Удалить',
    okType: 'danger',
    cancelText: 'Отмена',
    onOk: async () => {
      await api.deleteRecord(id);
    },
  });
}
```

## Ant Design Pro и ProComponents

**Ant Design Pro** - готовый enterprise-шаблон с авторизацией, layout, настройками. Подходит для быстрого старта admin-панелей.

**ProComponents** - набор высокоуровневых компонентов для типичных enterprise-задач:

```tsx
import { ProTable } from '@ant-design/pro-components';
import type { ProColumns } from '@ant-design/pro-components';

const columns: ProColumns<User>[] = [
  {
    title: 'Имя',
    dataIndex: 'name',
    valueType: 'text',
  },
  {
    title: 'Дата создания',
    dataIndex: 'createdAt',
    valueType: 'dateRange',
    hideInTable: true,
    search: {
      transform: (value) => ({
        startTime: value[0],
        endTime: value[1],
      }),
    },
  },
  {
    title: 'Статус',
    dataIndex: 'status',
    valueEnum: {
      active: { text: 'Активен', status: 'Success' },
      inactive: { text: 'Неактивен', status: 'Default' },
    },
  },
];

function UsersPage() {
  return (
    <ProTable<User>
      columns={columns}
      request={async (params, sort, filter) => {
        const response = await api.getUsers({ ...params, sort, filter });
        return {
          data: response.data,
          total: response.total,
          success: true,
        };
      }}
      rowKey="id"
      search={{ labelWidth: 'auto' }}
      pagination={{ pageSize: 20 }}
      dateFormatter="string"
      headerTitle="Пользователи"
    />
  );
}
```

> [!info] ProTable
> ProTable оборачивает стандартный Table и добавляет встроенные фильтры поиска, автоматическое управление состоянием загрузки и удобный API для серверной пагинации. Значительно сокращает boilerplate-код для CRUD-таблиц.

## Tree-shaking и оптимизация бандла

Antd v5 поддерживает tree-shaking из коробки при использовании именованных импортов:

```tsx
// Правильно - только Button попадёт в бандл
import { Button } from 'antd';

// Иконки импортируются отдельным пакетом
import { UserOutlined } from '@ant-design/icons';
```

Для анализа размера бандла:

```bash
npx source-map-explorer 'build/static/js/*.js'
```

> [!important] Оптимизация иконок
> Пакет `@ant-design/icons` содержит все иконки. Каждая иконка - отдельный модуль, tree-shaking работает при именованных импортах. Избегайте `import * as Icons from '@ant-design/icons'`.

### Ленивая загрузка тяжёлых компонентов

```tsx
import { lazy, Suspense } from 'react';
import { Spin } from 'antd';

const HeavyChart = lazy(() => import('./components/HeavyChart'));

function Dashboard() {
  return (
    <Suspense fallback={<Spin size="large" />}>
      <HeavyChart />
    </Suspense>
  );
}
```
