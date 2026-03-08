---
tags:
  - ai
  - rag
  - agi
  - datascience
---

## Навигация по разделу AI

Этот раздел содержит всю информацию об искусственном интеллекте: от базовых концепций до практического применения в разработке.

| Заметка | Описание |
|---------|----------|
| [[AI Agent]] | AI-агенты, мульти-агентные системы, архитектуры оркестрации, организация команд агентов. Фреймворки: LangChain, CrewAI, AutoGen |
| [[AI Engineering]] | Пайплайн AI-разработки, создание спецификаций, интеграция AI в проекты. RAG, prompt engineering, MLOps |
| [[AI Instruments]] | Практические инструменты: Claude Code, Beads, Spec Kit. Вайбкодинг и настройка агентов |
| [[AI and Data Science]] | Data Science терминология, EDA, feature engineering, ML для разработчиков. Связь DS и AI |
| [[AI Prompts]] | Коллекция промптов для обучения, исследования и повседневных задач |

---

## Общее

### Что такое искусственный интеллект

#### Определение ИИ

Искусственный интеллект (ИИ) — это направление в информатике, которое занимается созданием программ и систем, способных выполнять задачи, которые обычно требуют человеческого интеллекта. 

ИИ — это класс подходов: от простых правил до сложных нейросетей. В фокусе ИИ всегда стоит **поиск решений, требующих "разумности"** — например, распознавание изображений, перевод текста, рекомендация товаров.

#### Различие между классическими алгоритмами и ИИ

- **Классические алгоритмы** решают задачи по заранее прописанным правилам: если вход X, то сделать Y. Например, сортировка чисел или поиск элемента в списке.
- **ИИ — это системы, где поведение определяется обучением:** не все правила заранее заданы. Система учится на примерах и строит внутреннюю модель, которая способна обобщать и работать с новыми, ранее не встречавшимися случаями.
- Главное отличие: **ИИ умеет находить закономерности, которые не были явно заложены разработчиком**, и принимать сложные решения на основе опыта.

Пример для разработчика:

- Алгоритм: если значение > 10 — вывести "больше десяти".
- ИИ (например, классификатор): "Определи, на картинке кошка или собака", — модель обучается распознавать образы на основе обучающих данных, а не жёсткого набора правил.

#### Основные задачи, которые стараются решить с помощью ИИ

- **Распознавание образов (Computer Vision):** определение объектов на изображениях, анализ видео, контроль качества на производстве
    
- **Обработка естественного языка (NLP):** перевод текста, анализ тональности, чат-боты, генерация текстов
    
- **Рекомендательные системы:** подбор товаров, фильмов, персонализация контента
    
- **Автоматизация решений:** финансовые прогнозы, диагностика в медицине, автономное управление
    
- **Генерация контента:** создание картинок, видео, текста на основе запросов (Midjourney, GPT)
    

Практически — ИИ используют там, где **нет чётких правил**, а задача требует найти скрытые зависимости и принимать сложные решения в условиях неопределённости.

---

## Краткая история развития ИИ

### Начало исследований (1950–1970)

В 1950 году Алан Тьюринг опубликовал работу "Computing Machinery and Intelligence", предложив знаменитый тест Тьюринга. В 1956 году на Дартмутской конференции термин "искусственный интеллект" был официально введён. В этот период появились первые программы: Logic Theorist (доказательство теорем), ELIZA (имитация психотерапевта), перцептрон Розенблатта.

### Зимы ИИ (1970-е, 1980-е)

Периоды резкого сокращения финансирования из-за нереализованных ожиданий. Первая зима (1974–1980) наступила после критики перцептронов Минским и Пейпертом. Вторая зима (1987–1993) последовала за крахом рынка экспертных систем и специализированного оборудования.

### Бум экспертных систем (1980-е)

Системы на основе правил (if-then) для узких доменов: MYCIN (медицинская диагностика), DENDRAL (химический анализ). Коммерческий успех, но ограниченная масштабируемость и сложность поддержки баз знаний.

### Глубокое обучение (2010+)

Прорыв AlexNet (2012) в распознавании изображений на ImageNet. Ключевые факторы: GPU-вычисления, большие датасеты, новые архитектуры (dropout, batch normalization). Развитие RNN/LSTM для последовательностей, появление GAN (2014).

### Эра трансформеров и LLM (2017+)

Архитектура Transformer (статья "Attention Is All You Need", 2017) изменила NLP. GPT (2018), BERT (2018), GPT-3 (2020), ChatGPT (2022), GPT-4 (2023), Claude (2023-2024). Генеративные модели: DALL-E, Midjourney, Stable Diffusion.

> Подробнее: [История ИИ — Stanford](https://hai.stanford.edu/research/ai-index)
    

---

## Основные понятия и терминология

### Классификация ИИ

#### Узкий (Narrow AI) vs Общий (AGI)

**Узкий ИИ (ANI)** — системы, решающие конкретную задачу: распознавание лиц, игра в шахматы, генерация текста. Все современные AI-системы относятся к этой категории.

**Общий ИИ (AGI)** — гипотетическая система с человеческим уровнем интеллекта, способная решать любые когнитивные задачи. Не существует на данный момент.

**Суперинтеллект (ASI)** — гипотетический ИИ, превосходящий человеческий интеллект во всех областях.

#### Слабый vs Сильный ИИ

**Слабый ИИ** — имитирует интеллектуальное поведение без понимания. Современные LLM формально относятся сюда: они не "понимают" текст, а предсказывают вероятные продолжения.

**Сильный ИИ** — обладает сознанием, самосознанием и истинным пониманием. Философская концепция, связанная с проблемой сознания.

### Термины машинного обучения

| Термин | Определение |
|--------|-------------|
| **Модель** | Математическая функция, преобразующая входные данные в выходные. Результат обучения на данных |
| **Обучение (Training)** | Процесс подбора параметров модели для минимизации ошибки на обучающих данных |
| **Инференс (Inference)** | Применение обученной модели к новым данным для получения предсказаний |
| **Датасет** | Набор примеров (данных) для обучения и оценки модели |
| **Признак (Feature)** | Входная переменная модели, характеристика объекта |
| **Целевая переменная (Target)** | То, что модель должна предсказать |
| **Веса (Weights)** | Обучаемые параметры модели |
| **Loss function** | Функция потерь, измеряющая ошибку модели |
| **Градиентный спуск** | Алгоритм оптимизации весов модели |

### Типы машинного обучения

#### Обучение с учителем (Supervised Learning)

Модель учится на размеченных данных — парах (вход, правильный ответ). Задачи: классификация (спам/не спам), регрессия (прогноз цены). Примеры: линейная регрессия, деревья решений, нейросети.

![[_canvas/supervised-learning.canvas]]

#### Обучение без учителя (Unsupervised Learning)

Модель ищет закономерности в неразмеченных данных. Задачи: кластеризация (группировка клиентов), уменьшение размерности (PCA), поиск аномалий. Примеры: k-means, DBSCAN, autoencoders.

#### Обучение с подкреплением (Reinforcement Learning)

Агент учится через взаимодействие со средой, получая награды/штрафы за действия. Применение: игры (AlphaGo, Atari), робототехника, управление ресурсами. Ключевые понятия: состояние, действие, награда, политика.

#### Self-supervised и Semi-supervised Learning

**Self-supervised** — модель сама создаёт задачу из неразмеченных данных (например, предсказание следующего слова в тексте). Основа современных LLM.

**Semi-supervised** — комбинация небольшого количества размеченных данных и большого объёма неразмеченных.

> Подробнее: [[AI and Data Science|Data Science терминология]]
    

---

## Основные задачи и методы ИИ

### Классификация и регрессия

#### Классификация

Задача отнесения объекта к одному из заранее определённых классов.

**Примеры задач:**
- Спам / не спам (бинарная классификация)
- Распознавание цифр MNIST (мультиклассовая, 10 классов)
- Диагностика заболеваний
- Определение тональности текста (positive/negative/neutral)

**Основные методы:**

| Метод | Особенности | Когда использовать |
|-------|-------------|-------------------|
| **Логистическая регрессия** | Линейный классификатор, интерпретируемый | Baseline, линейно разделимые данные |
| **Деревья решений** | Набор правил if-then, интерпретируемый | Когда важна объяснимость |
| **Random Forest** | Ансамбль деревьев, устойчив к переобучению | Табличные данные, универсален |
| **SVM** | Максимизация зазора между классами | Небольшие датасеты, высокая размерность |
| **Нейронные сети** | Нелинейные зависимости любой сложности | Большие данные, изображения, текст |

#### Регрессия

Задача предсказания непрерывной величины.

**Примеры:** прогноз цены недвижимости, температуры, спроса.

**Методы:** линейная регрессия, полиномиальная регрессия, Ridge/Lasso, Gradient Boosting (XGBoost, LightGBM), нейросети.

### Кластеризация

Задача группировки объектов по схожести без заранее известных меток.

**Применение:**
- Сегментация клиентов (маркетинг)
- Группировка документов по темам
- Поиск аномалий (объекты вне кластеров)
- Сжатие изображений (квантизация цветов)

**Методы:**

| Метод | Принцип | Особенности |
|-------|---------|-------------|
| **K-means** | Минимизация расстояния до центроидов | Требует задать K, чувствителен к выбросам |
| **DBSCAN** | Плотностная кластеризация | Находит кластеры произвольной формы |
| **Hierarchical** | Дендрограмма (дерево слияний) | Визуализация иерархии кластеров |
| **GMM** | Смесь гауссовых распределений | Мягкая кластеризация (вероятности) |

```python
from sklearn.cluster import KMeans

kmeans = KMeans(n_clusters=3, random_state=42)
clusters = kmeans.fit_predict(X)
```

### Глубокое обучение

#### Нейронная сеть: структура

![[_canvas/neural-network-structure.canvas]]

**Компоненты:**
- **Нейрон** — линейная комбинация входов + функция активации
- **Слой** — набор нейронов
- **Веса** — обучаемые параметры связей
- **Функции активации:** ReLU, Sigmoid, Tanh, Softmax

#### Типы нейросетей

| Архитектура | Применение | Особенности |
|-------------|------------|-------------|
| **MLP** (Multilayer Perceptron) | Табличные данные | Полносвязные слои |
| **CNN** (Convolutional) | Изображения, видео | Свёрточные слои, пулинг |
| **RNN/LSTM/GRU** | Последовательности, временные ряды | Память о предыдущих состояниях |
| **Transformer** | NLP, генерация | Механизм внимания (attention) |
| **GAN** | Генерация изображений | Генератор + дискриминатор |
| **Diffusion** | Генерация (Stable Diffusion) | Постепенное удаление шума |

#### Процесс обучения

1. **Forward pass** — прогон данных через сеть, получение предсказания
2. **Loss calculation** — вычисление ошибки (MSE, Cross-Entropy)
3. **Backward pass** — вычисление градиентов (backpropagation)
4. **Weight update** — обновление весов (SGD, Adam)

> Ссылки: [PyTorch Tutorials](https://pytorch.org/tutorials/), [TensorFlow Guide](https://www.tensorflow.org/guide)

### RAG (Retrieval-Augmented Generation)

#### Что такое RAG

RAG — архитектурный паттерн, дополняющий LLM внешними знаниями через поиск релевантных документов. Решает проблемы:
- **Галлюцинации** — модель отвечает на основе реальных документов
- **Актуальность** — данные обновляются без переобучения модели
- **Приватность** — корпоративные данные не попадают в модель

#### Архитектура RAG

![[_canvas/rag-detailed.canvas]]

#### Компоненты RAG-системы

| Компонент | Инструменты |
|-----------|-------------|
| **Chunking** | LangChain splitters, semantic chunking |
| **Embeddings** | OpenAI ada-002, Cohere, sentence-transformers |
| **Vector DB** | Pinecone, Weaviate, Chroma, Milvus, pgvector |
| **Retriever** | LangChain, LlamaIndex |
| **Reranker** | Cohere Rerank, BGE Reranker |

#### Пример RAG с LangChain

```python
from langchain.vectorstores import Chroma
from langchain.embeddings import OpenAIEmbeddings
from langchain.chains import RetrievalQA
from langchain.llms import OpenAI

# Создание vectorstore
vectorstore = Chroma.from_documents(docs, OpenAIEmbeddings())

# RAG-цепочка
qa_chain = RetrievalQA.from_chain_type(
    llm=OpenAI(),
    retriever=vectorstore.as_retriever()
)

answer = qa_chain.run("What is the company policy on remote work?")
```

> Подробнее: [[AI Engineering#RAG|RAG в AI Engineering]], [LangChain RAG Tutorial](https://python.langchain.com/docs/tutorials/rag/)
    

---

## Работа с данными

### Датасеты

#### Структура датасета

Датасет — структурированный набор данных для обучения и оценки моделей.

![[_canvas/dataset-structure.canvas]]

#### Предобработка данных

| Этап | Действия |
|------|----------|
| **Очистка** | Удаление дубликатов, исправление ошибок, фильтрация выбросов |
| **Пропуски** | Удаление строк, заполнение средним/медианой/модой, KNN imputer |
| **Нормализация** | Min-Max scaling (0-1), Z-score (mean=0, std=1) |
| **Кодирование** | One-Hot для категорий, Label encoding для ordinal |

```python
from sklearn.preprocessing import StandardScaler
from sklearn.impute import SimpleImputer

# Заполнение пропусков
imputer = SimpleImputer(strategy='median')
X_filled = imputer.fit_transform(X)

# Нормализация
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X_filled)
```

#### Разделение данных

```
Dataset (100%)
    ├── Training set (60-80%) — обучение модели
    ├── Validation set (10-20%) — подбор гиперпараметров
    └── Test set (10-20%) — финальная оценка
```

```python
from sklearn.model_selection import train_test_split

X_train, X_temp, y_train, y_temp = train_test_split(X, y, test_size=0.3)
X_val, X_test, y_val, y_test = train_test_split(X_temp, y_temp, test_size=0.5)
```

### Feature Engineering

Создание и отбор признаков — часто важнее выбора модели.

#### Техники создания признаков

| Техника | Пример |
|---------|--------|
| **Агрегации** | Среднее, медиана, сумма по группам |
| **Временные** | День недели, час, квартал из datetime |
| **Взаимодействия** | Произведения признаков (x1 * x2) |
| **Полиномиальные** | x², x³, sqrt(x) |
| **Текстовые** | TF-IDF, word embeddings, длина текста |

#### Отбор признаков (Feature Selection)

- **Filter methods** — корреляция, chi-square, mutual information
- **Wrapper methods** — рекурсивное удаление (RFE)
- **Embedded methods** — L1 регуляризация, feature importance из деревьев

```python
from sklearn.feature_selection import SelectKBest, f_classif

selector = SelectKBest(f_classif, k=10)
X_selected = selector.fit_transform(X, y)
```

> Подробнее: [[AI and Data Science#Feature Engineering|Feature Engineering в DS]]
    

---

## Инструменты для программиста

### Языки программирования

#### Python — стандарт AI/ML

Python доминирует в AI/ML благодаря:
- Богатая экосистема библиотек (NumPy, Pandas, scikit-learn, PyTorch)
- Простой синтаксис для быстрого прототипирования
- Интеграция с C/C++ для производительности
- Jupyter notebooks для интерактивной разработки

#### Основные пакеты

| Пакет | Назначение |
|-------|------------|
| **NumPy** | Многомерные массивы, линейная алгебра, быстрые вычисления |
| **Pandas** | Табличные данные (DataFrame), анализ, трансформации |
| **Matplotlib / Seaborn** | Визуализация данных |
| **Jupyter** | Интерактивные notebook'и |

```python
import numpy as np
import pandas as pd

# NumPy: векторизованные операции
arr = np.array([1, 2, 3, 4])
print(arr * 2)  # [2, 4, 6, 8]

# Pandas: работа с таблицами
df = pd.read_csv('data.csv')
df.groupby('category').mean()
```

### ML/AI-библиотеки

#### scikit-learn

Универсальная библиотека для классического ML. Единый API для всех алгоритмов.

```python
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import cross_val_score

model = RandomForestClassifier(n_estimators=100)
scores = cross_val_score(model, X, y, cv=5)
model.fit(X_train, y_train)
predictions = model.predict(X_test)
```

**Включает:** классификацию, регрессию, кластеризацию, preprocessing, метрики.

> Документация: [scikit-learn.org](https://scikit-learn.org/)

#### PyTorch

Фреймворк глубокого обучения от Meta. Динамические графы вычислений, pythonic API.

```python
import torch
import torch.nn as nn

class SimpleNet(nn.Module):
    def __init__(self):
        super().__init__()
        self.fc1 = nn.Linear(784, 128)
        self.fc2 = nn.Linear(128, 10)

    def forward(self, x):
        x = torch.relu(self.fc1(x))
        return self.fc2(x)

model = SimpleNet()
optimizer = torch.optim.Adam(model.parameters())
```

> Документация: [pytorch.org](https://pytorch.org/)

#### TensorFlow / Keras

Фреймворк от Google. Production-ready, TensorFlow Serving, TFLite для мобильных.

```python
import tensorflow as tf
from tensorflow import keras

model = keras.Sequential([
    keras.layers.Dense(128, activation='relu'),
    keras.layers.Dense(10, activation='softmax')
])

model.compile(optimizer='adam', loss='sparse_categorical_crossentropy')
model.fit(X_train, y_train, epochs=10)
```

> Документация: [tensorflow.org](https://www.tensorflow.org/)

#### HuggingFace Transformers

Библиотека готовых моделей (BERT, GPT, T5) и инструментов для NLP.

```python
from transformers import pipeline

# Zero-shot классификация
classifier = pipeline("zero-shot-classification")
result = classifier(
    "I love this product!",
    candidate_labels=["positive", "negative"]
)

# Генерация текста
generator = pipeline("text-generation", model="gpt2")
text = generator("The future of AI is", max_length=50)
```

> Документация: [huggingface.co](https://huggingface.co/docs/transformers)

#### OpenAI API / Anthropic API

Доступ к мощным LLM через API.

```python
from anthropic import Anthropic

client = Anthropic()
message = client.messages.create(
    model="claude-3-sonnet-20240229",
    max_tokens=1024,
    messages=[{"role": "user", "content": "Explain RAG in simple terms"}]
)
```

### LLM-фреймворки

#### LangChain

Фреймворк для построения приложений на базе LLM: цепочки, агенты, RAG.

```python
from langchain.chains import LLMChain
from langchain.prompts import PromptTemplate
from langchain_openai import ChatOpenAI

prompt = PromptTemplate(
    input_variables=["topic"],
    template="Write a short article about {topic}"
)

chain = LLMChain(llm=ChatOpenAI(), prompt=prompt)
result = chain.run(topic="machine learning")
```

> Документация: [python.langchain.com](https://python.langchain.com/)

#### LlamaIndex

Фреймворк для RAG и работы с данными в контексте LLM.

```python
from llama_index import VectorStoreIndex, SimpleDirectoryReader

documents = SimpleDirectoryReader("./data").load_data()
index = VectorStoreIndex.from_documents(documents)

query_engine = index.as_query_engine()
response = query_engine.query("What is the main topic?")
```

> Документация: [llamaindex.ai](https://docs.llamaindex.ai/)
    

---

## Практика и применение в программировании

### Интеграция AI и LLM в проекты

#### Уровни интеграции

| Уровень | Описание | Инструменты |
|---------|----------|-------------|
| **API** | Вызовы LLM из кода | OpenAI API, Anthropic API |
| **IDE** | Autocomplete, code generation | GitHub Copilot, Cursor, Tabnine |
| **CLI** | Автономные агенты | Claude Code, Codex |
| **CI/CD** | Автоматизация в пайплайнах | Code review bots, test generation |

#### Типовые сценарии интеграции

**Генерация текста:**
```python
# Генерация описания продукта
def generate_description(product_name, features):
    prompt = f"Write a product description for {product_name} with features: {features}"
    return llm.generate(prompt)
```

**Классификация:**
```python
# Классификация тикетов поддержки
def classify_ticket(text):
    return llm.classify(
        text,
        categories=["bug", "feature_request", "question", "billing"]
    )
```

**Извлечение данных:**
```python
# Извлечение структурированных данных из текста
def extract_entities(text):
    prompt = f"Extract name, email, phone from: {text}. Return JSON."
    return json.loads(llm.generate(prompt))
```

#### AI-инструменты в IDE

| Инструмент | Особенности |
|------------|-------------|
| **GitHub Copilot** | Autocomplete, chat, inline suggestions |
| **Cursor** | AI-first IDE, агентные возможности |
| **Tabnine** | On-premise опция, приватность |
| **Codeium** | Бесплатный, поддержка многих IDE |

### Разработка ML-проекта

#### Этапы ML-проекта

```
1. Problem Definition
   └── Бизнес-цель → ML-задача → Метрики успеха

2. Data Collection
   └── Источники → Сбор → Хранение

3. EDA & Preprocessing
   └── Анализ → Очистка → Feature Engineering

4. Modeling
   └── Baseline → Эксперименты → Выбор модели

5. Evaluation
   └── Валидация → Тестирование → Error analysis

6. Deployment
   └── Serving → Мониторинг → Обновление
```

#### Чек-лист ML-проекта

```markdown
## Problem Definition
- [ ] Бизнес-задача сформулирована
- [ ] ML-подход обоснован (не over-engineering)
- [ ] Success metrics определены
- [ ] Baseline установлен

## Data
- [ ] Данные собраны и доступны
- [ ] EDA проведён
- [ ] Качество данных проверено
- [ ] Train/val/test split выполнен

## Modeling
- [ ] Baseline модель обучена
- [ ] Эксперименты задокументированы
- [ ] Лучшая модель выбрана
- [ ] Гиперпараметры оптимизированы

## Evaluation
- [ ] Метрики на test set рассчитаны
- [ ] Error analysis проведён
- [ ] Bias/fairness проверены

## Deployment
- [ ] Модель сериализована
- [ ] API/serving настроены
- [ ] Мониторинг подключён
- [ ] Документация написана
```

> Подробнее: [[AI Engineering|AI Engineering Pipeline]]
    

---

## Подробности обучения моделей

### Процесс обучения

#### Train / Validation / Test Split

![[_canvas/train-val-test.canvas]]

**Cross-validation** — более надёжная оценка на небольших датасетах:

```python
from sklearn.model_selection import cross_val_score

scores = cross_val_score(model, X, y, cv=5)
print(f"Mean: {scores.mean():.3f} ± {scores.std():.3f}")
```

#### Overfitting vs Underfitting

| Проблема | Признаки | Решения |
|----------|----------|---------|
| **Overfitting** | Train accuracy >> Test accuracy | Регуляризация, dropout, больше данных, ранняя остановка |
| **Underfitting** | Train accuracy низкая | Более сложная модель, больше признаков, меньше регуляризации |

![[_canvas/overfitting-graph.canvas]]

#### Метрики качества

**Для классификации:**

| Метрика | Формула | Когда важна |
|---------|---------|-------------|
| **Accuracy** | (TP+TN) / Total | Сбалансированные классы |
| **Precision** | TP / (TP+FP) | Цена false positive высока (спам) |
| **Recall** | TP / (TP+FN) | Цена false negative высока (болезни) |
| **F1** | 2 * P*R / (P+R) | Баланс precision/recall |
| **ROC-AUC** | Area under ROC | Общее качество, разные пороги |

```python
from sklearn.metrics import classification_report, roc_auc_score

print(classification_report(y_test, y_pred))
auc = roc_auc_score(y_test, y_pred_proba)
```

**Confusion Matrix:**

![[_canvas/confusion-matrix.canvas]]

### Настройка моделей

#### Параметры vs Гиперпараметры

| Тип | Определение | Примеры |
|-----|-------------|---------|
| **Параметры** | Обучаются из данных | Веса нейросети, коэффициенты регрессии |
| **Гиперпараметры** | Задаются до обучения | Learning rate, число слоёв, max_depth |

#### Поиск гиперпараметров

**Grid Search** — перебор всех комбинаций:

```python
from sklearn.model_selection import GridSearchCV

param_grid = {
    'n_estimators': [100, 200, 300],
    'max_depth': [5, 10, 15],
    'min_samples_split': [2, 5, 10]
}

grid = GridSearchCV(RandomForestClassifier(), param_grid, cv=5)
grid.fit(X_train, y_train)
print(grid.best_params_)
```

**Random Search** — случайная выборка параметров (эффективнее при большом пространстве):

```python
from sklearn.model_selection import RandomizedSearchCV
from scipy.stats import randint

param_dist = {
    'n_estimators': randint(50, 500),
    'max_depth': randint(3, 20)
}

search = RandomizedSearchCV(model, param_dist, n_iter=50, cv=5)
```

**Bayesian Optimization** — умный поиск на основе предыдущих результатов:

```python
# Optuna
import optuna

def objective(trial):
    n_estimators = trial.suggest_int('n_estimators', 50, 500)
    max_depth = trial.suggest_int('max_depth', 3, 20)
    model = RandomForestClassifier(n_estimators=n_estimators, max_depth=max_depth)
    return cross_val_score(model, X, y, cv=5).mean()

study = optuna.create_study(direction='maximize')
study.optimize(objective, n_trials=100)
```

> Ссылки: [Optuna](https://optuna.org/), [Weights & Biases](https://wandb.ai/)
    

---

## Этические и правовые аспекты

### Риски и ограничения ИИ

| Риск | Описание | Митигация |
|------|----------|-----------|
| **Галлюцинации** | LLM генерируют правдоподобную, но ложную информацию | RAG, fact-checking, ограничение домена |
| **Bias** | Модели воспроизводят предубеждения из данных | Аудит данных, fairness metrics, diverse datasets |
| **Privacy** | Утечка персональных данных | Differential privacy, data anonymization |
| **Security** | Prompt injection, adversarial attacks | Input validation, guardrails |
| **Reliability** | Непредсказуемое поведение | Тестирование, мониторинг, fallbacks |

### Галлюцинации LLM

LLM предсказывают вероятные продолжения, а не проверяют факты. Они могут:
- Придумывать несуществующие цитаты и ссылки
- Уверенно давать неправильные ответы
- Смешивать факты из разных контекстов

**Снижение галлюцинаций:**
- Использование RAG с проверенными источниками
- Запрос на цитирование источников
- Ограничение задач конкретным доменом
- Температура = 0 для детерминированных ответов

### Приватность и безопасность

**Проблемы:**
- Модели могут запоминать данные из обучения (membership inference)
- Prompt injection — внедрение вредоносных инструкций
- Jailbreaking — обход ограничений модели

**Практики:**
- Не передавать чувствительные данные в публичные API
- Использовать on-premise или private cloud решения
- Валидировать и санитизировать входные данные
- Применять content filtering на выходе

### Этическая ответственность разработчика

```markdown
## Чек-лист этичного AI

- [ ] Прозрачность: пользователь знает, что взаимодействует с AI
- [ ] Объяснимость: можно объяснить решения модели
- [ ] Fairness: проверен bias по защищённым группам
- [ ] Privacy: данные пользователей защищены
- [ ] Safety: предусмотрены safeguards от вредного использования
- [ ] Accountability: есть ответственные за систему люди
```

### Регулирование AI

| Регион | Регулирование |
|--------|---------------|
| **EU** | AI Act — классификация по уровню риска, требования к high-risk AI |
| **US** | Executive Order on AI, секторальное регулирование |
| **China** | Регулирование алгоритмов рекомендаций, генеративного AI |

> Ссылки: [EU AI Act](https://artificialintelligenceact.eu/), [NIST AI RMF](https://www.nist.gov/itl/ai-risk-management-framework)
    

---

## Продвинутые темы

### GAN (Generative Adversarial Networks)

Архитектура из двух сетей: **Generator** создаёт изображения, **Discriminator** отличает реальные от сгенерированных. Соревнование улучшает обе сети.

![[_canvas/gan-architecture.canvas]]

**Применение:** генерация лиц (StyleGAN), image-to-image (pix2pix), super resolution.

**Проблемы:** mode collapse, нестабильность обучения.

### Reinforcement Learning (RL)

Агент учится через взаимодействие со средой, получая награды за действия.

![[_canvas/rl-loop.canvas]]

**Ключевые понятия:**
- **Policy** — стратегия выбора действий
- **Value function** — ожидаемая награда
- **Q-learning** — оценка качества пар (состояние, действие)

**Применение:** игры (AlphaGo, Atari), робототехника, оптимизация ресурсов, RLHF для LLM.

### Self-supervised Learning

Модель создаёт задачу из неразмеченных данных. Основа современных LLM и foundation models.

**Примеры задач:**
- **Masked Language Modeling (BERT)** — предсказание скрытых слов
- **Next Token Prediction (GPT)** — предсказание следующего токена
- **Contrastive Learning (CLIP)** — сопоставление изображений и текста

### AutoML и MLOps

#### AutoML

Автоматизация выбора модели, feature engineering, hyperparameter tuning.

| Инструмент | Особенности |
|------------|-------------|
| **AutoGluon** | Лучший для табличных данных, stacking |
| **H2O AutoML** | Enterprise, интерпретируемость |
| **Google AutoML** | Cloud-based, images/text/tables |
| **TPOT** | Генетические алгоритмы |

#### MLOps

DevOps-практики для ML: версионирование, CI/CD, мониторинг моделей.

![[_canvas/mlops-pipeline.canvas]]

> Ссылки: [MLflow](https://mlflow.org/), [DVC](https://dvc.org/), [Weights & Biases](https://wandb.ai/)

---

## Как закрепить материал и прокачаться в практике

### Микропроекты с LLM

| Проект | Сложность | Чему учит |
|--------|-----------|-----------|
| Чат-бот с RAG | Средняя | LangChain, embeddings, vector DB |
| Классификатор тикетов | Низкая | Prompt engineering, API интеграция |
| Summarizer документов | Низкая | Chunking, prompt design |
| Code reviewer | Средняя | Агенты, tool use |

### Классические ML-задачи

| Датасет | Задача | Что практикуется |
|---------|--------|------------------|
| **Iris** | Классификация | Baseline, метрики |
| **Titanic** | Классификация | Feature engineering, EDA |
| **MNIST** | Классификация | Нейросети, CNN |
| **Boston Housing** | Регрессия | Preprocessing, регрессоры |
| **IMDB Reviews** | NLP | Text classification |

### Ресурсы для обучения

**Курсы:**
- [fast.ai](https://www.fast.ai/) — практический deep learning
- [Coursera ML (Andrew Ng)](https://www.coursera.org/learn/machine-learning) — классика ML
- [Hugging Face Course](https://huggingface.co/course) — NLP и Transformers

**Соревнования:**
- [Kaggle](https://www.kaggle.com/) — соревнования и датасеты
- [DrivenData](https://www.drivendata.org/) — социально значимые задачи

**Чтение:**
- [Papers With Code](https://paperswithcode.com/) — статьи с кодом
- [Distill](https://distill.pub/) — визуальные объяснения ML
- [The Batch](https://www.deeplearning.ai/the-batch/) — еженедельник по AI

