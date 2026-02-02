# Lemonshop — архитектура проекта

## 1. Цель и контекст

**Тип:** сайт-каталог / сайт-накладная  
**Ниша:** ТНП (посуда, бытовая техника, химия и т.д.)  
**Цель:** замена бумажных накладных, приём заказов через каталог → PDF → WhatsApp.

**Целевая аудитория:**
- Оптовые клиенты (заказ коробками, оптовая цена)
- Розничные клиенты (покупка поштучно, розничная цена)

---

## 2. Архитектура проекта

### 2.1 Текущий стек (MVP)

| Слой | Технология | Комментарий |
|------|------------|-------------|
| Frontend | React 19 + Vite | SPA, HashRouter для статического хостинга |
| Состояние | React Context + localStorage | Один ключ `lemonshop` для всего стора |
| PDF | html2pdf.js (клиент) | Генерация на клиенте, кириллица через HTML |
| Отправка заказа | wa.me + текст | Без бэкенда |

### 2.2 Целевой стек (масштабирование)

| Слой | Технология | Комментарий |
|------|------------|-------------|
| Frontend | React + Vite или Next.js | SSR/SSG для SEO при переходе на Next |
| Backend | Node.js (Express/Fastify) или Laravel | REST API, генерация PDF на сервере |
| БД | PostgreSQL | Нормализованная схема, миграции |
| Очереди | Опционально Bull/Redis | Для отправки в WhatsApp/Email |
| Хостинг | Front: Vercel/Netlify, Back: Railway/Render/VPS | |

### 2.3 Структура каталогов (целевая)

```
lemonshop/
├── docs/                 # Документация (архитектура, API)
├── src/
│   ├── components/      # UI-компоненты
│   ├── pages/           # Страницы (Home, Admin)
│   ├── context/         # Глобальное состояние
│   ├── store.js         # Чтение/запись localStorage (+ миграции)
│   ├── api/             # (позже) клиент API к бэкенду
│   └── utils/           # Хелперы, форматирование
├── public/
│   └── logo.png         # Логотип для PDF
├── server/              # (позже) Node-бэкенд
│   ├── routes/
│   ├── services/
│   └── db/
└── package.json
```

---

## 3. Структура БД (PostgreSQL)

### 3.1 Таблицы

```sql
-- Пользователи админки (роли: admin, manager)
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  role VARCHAR(32) NOT NULL DEFAULT 'manager', -- admin | manager
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Дерево категорий
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  parent_id INT REFERENCES categories(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  "order" INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Товары
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  category_id INT REFERENCES categories(id) ON DELETE SET NULL,
  title VARCHAR(500) NOT NULL,
  article VARCHAR(100),           -- Артикул
  barcode VARCHAR(100),            -- Штрих-код
  description TEXT,
  image_url VARCHAR(500),          -- или хранение в S3/локально
  price_retail DECIMAL(12,2) NOT NULL DEFAULT 0,  -- Цена розница за шт
  price_opt DECIMAL(12,2),        -- Цена опт за коробку
  box_qty INT NOT NULL DEFAULT 1, -- Количество в коробке
  stock INT,                      -- Остаток (NULL = не ведём учёт)
  weight_g INT,                   -- Вес, г (опционально)
  volume_ml INT,                  -- Объём, мл (опционально)
  brand VARCHAR(255),             -- Бренд (опционально)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Заказы
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  client_name VARCHAR(255) NOT NULL,
  client_phone VARCHAR(50) NOT NULL,
  client_city VARCHAR(255),
  client_address TEXT NOT NULL,
  mode VARCHAR(20) NOT NULL,       -- retail | wholesale
  total_sum DECIMAL(12,2) NOT NULL,
  status VARCHAR(32) DEFAULT 'new', -- new | sent | done | cancelled
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Позиции заказа
CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INT REFERENCES products(id) ON DELETE SET NULL,
  title VARCHAR(500) NOT NULL,
  article VARCHAR(100),
  qty INT NOT NULL,               -- штук или коробок в зависимости от mode
  price DECIMAL(12,2) NOT NULL,
  sum DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Настройки (ключ-значение или одна таблица)
CREATE TABLE settings (
  key VARCHAR(100) PRIMARY KEY,
  value JSONB NOT NULL
);

-- Статистика посещений (агрегат по дням или лог)
CREATE TABLE visits (
  id SERIAL PRIMARY KEY,
  visited_at DATE NOT NULL DEFAULT CURRENT_DATE,
  count INT NOT NULL DEFAULT 1,
  UNIQUE(visited_at)
);
-- При визите: INSERT ... ON CONFLICT (visited_at) DO UPDATE SET count = visits.count + 1
```

### 3.2 Связи

- `categories.parent_id` → дерево категорий
- `products.category_id` → категория товара
- `orders` → `order_items` (один заказ — много позиций)
- `order_items.product_id` — для истории и аналитики (при удалении товара остаётся title/price в позиции)

---

## 4. Логика экранов

### 4.1 Сценарий пользователя (каталог → заказ)

```
[Вход на сайт]
       ↓
[Выбор режима: РОЗНИЦА | ОПТ]  ← сохраняется в sessionStorage/localStorage
       ↓
[Каталог: дерево категорий слева, карточки товаров справа]
       ↓
[Фильтры: категория, цена, наличие, сортировка, метка NEW]
       ↓
[Добавление в корзину] (штуки в рознице, коробки в опте)
       ↓
[Корзина: изменение кол-ва, пересчёт по режиму, сохранение корзины]
       ↓
[Кнопка «Оформить заказ»]
       ↓
[Форма: ФИО, Телефон, Город, Адрес]
       ↓
[Подтверждение]
       ↓
[Генерация PDF] → [Отправка текста заказа в WhatsApp] → [Сохранение заказа в историю]
```

### 4.2 Карта экранов и компонентов

| Экран | Маршрут | Компоненты | Данные |
|-------|---------|------------|--------|
| Главная (каталог) | `/` | Home, Sidebar (дерево), ProductCard, CartBar, OrderFormModal | products, categories, cart, mode |
| Админ — вход | `/admin` | Admin (login form) | settings.adminPassword |
| Админ — каталог | `/admin` (section=catalog) | Catalog layout, CategoryTree, ProductTable, ProductModal | products, categories |
| Админ — заказы | `/admin` (section=orders) | OrderList, OrderEditForm | orders |
| Админ — пользователи | `/admin` (section=users) | UserTable | users |
| Админ — посещения | `/admin` (section=visits) | VisitsStat | visits |
| Админ — настройки | `/admin` (section=settings) | SettingsForm | settings |

### 4.3 Роли в админке

| Роль | Товары | Категории | Заказы | Пользователи | Настройки | Статистика |
|------|--------|-----------|--------|---------------|-----------|------------|
| admin | CRUD | CRUD | просмотр, редактирование | CRUD | да | да |
| manager | CRUD | просмотр | просмотр, редактирование | — | нет | просмотр |

В MVP роли можно хранить в поле `user.role` и проверять в UI (скрывать блоки «Пользователи» и «Настройки» для manager).

---

## 5. Модель данных (MVP — localStorage)

Совместимость с текущим кодом и расширение под розницу/опт:

### 5.1 Product (товар)

| Поле | Тип | Описание |
|------|-----|----------|
| id | number | PK |
| title | string | Название |
| article | string | Артикул |
| barcode | string | Штрих-код |
| description | string | Описание |
| imageData | string (base64) | Фото (или imageUrl при переходе на бэкенд) |
| priceRetail | number | Цена розница за шт |
| priceOpt | number | Цена опт за коробку |
| boxQty | number | В коробке шт |
| stock | number \| null | Остаток |
| cat | id | Категория |
| size | string | Размер/артикул (дублирует article при миграции) |
| createdAt | string (ISO) | Дата добавления (для метки NEW) |
| brand | string | Бренд (опционально) |
| weight | number | Вес, г (опционально) |

Обратная совместимость: если у товара есть `price` и нет `priceRetail`, считать `price` = `priceRetail`; `priceOpt` по умолчанию = `price * boxQty` или отдельное поле.

### 5.2 Order (заказ)

| Поле | Описание |
|------|----------|
| id | PK |
| client | { name, phone, city, address } |
| items | [{ productId, title, article, qty, price, sum }] |
| totalSum | число |
| mode | 'retail' \| 'wholesale' |
| createdAt | ISO строка |

### 5.3 Cart (корзина)

- Ключ в localStorage: `lemonshop_cart` или внутри общего стора.
- Формат: `{ [productId]: quantity }` — в рознице quantity = штуки, в опте = коробки.
- Режим: `mode: 'retail' | 'wholesale'` хранить рядом или в основном сторе.

---

## 6. API (целевой, для бэкенда)

- `GET /api/products` — список (фильтры: category, priceMin, priceMax, inStock, sort)
- `GET /api/products/:id` — один товар
- `GET /api/categories` — дерево категорий
- `POST /api/orders` — создание заказа (тело: client, items, mode)
- `GET /api/orders` — список заказов (админ)
- `PATCH /api/orders/:id` — обновление заказа (админ)
- `GET /api/orders/:id/pdf` — скачать PDF накладной
- `POST /api/visits` — увеличить счётчик посещений
- Настройки, пользователи — по необходимости с защитой по ролям.

---

## 7. SEO и адаптивность

- Мета-теги (title, description) на главной и при переходе на Next — на каждой странице.
- Семантика: header, main, nav, article для карточек.
- Адаптив: брейкпоинты под мобильные (sidebar в коллапс, таблицы с горизонтальным скроллом).
- Подготовка к PWA: manifest.json, service worker — опционально в следующей итерации.

---

## 8. MVP — чек-лист реализации

- [x] Режим РОЗНИЦА / ОПТ на главной
- [x] Товар: фото, название, артикул, штрих-код, остаток, цена розница, цена опт
- [x] Корзина: изменение количества, пересчёт по режиму, сохранение (localStorage)
- [x] Дерево категорий, фильтр по цене, по наличию, сортировка, метка NEW (7 дней)
- [x] Форма заказа: ФИО, телефон, город, адрес
- [x] PDF: логотип (URL в настройках или /logo.png), данные клиента, таблица, сумма, дата
- [x] Отправка в WhatsApp (wa.me + текст)
- [x] Админ: роли (admin/manager), товары/категории/заказы, цены, остатки, штрих-коды, статистика (визиты + заказы)
- [ ] Бэкенд + PostgreSQL (следующий этап)
- [ ] Генерация PDF на сервере (следующий этап)
