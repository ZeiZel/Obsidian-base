---
tags:
  - ai
  - datascience
  - ml
  - analytics
  - bigdata
---

## AI и Data Science: связь и различия

**Data Science** — междисциплинарная область, извлекающая знания из данных с помощью статистики, ML и программирования.

**AI** — системы, имитирующие когнитивные функции человека.

```
┌─────────────────────────────────────────────────────────────┐
│                      Data Science                           │
│  ┌───────────────────────────────────────────────────────┐ │
│  │              Machine Learning                          │ │
│  │  ┌─────────────────────────────────────────────────┐  │ │
│  │  │              Deep Learning                       │  │ │
│  │  │  ┌─────────────────────────────────────────┐    │  │ │
│  │  │  │         Generative AI (LLM)             │    │  │ │
│  │  │  └─────────────────────────────────────────┘    │  │ │
│  │  └─────────────────────────────────────────────────┘  │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

| Область | Фокус | Типичные задачи |
|---------|-------|-----------------|
| **Data Science** | Анализ и insights | BI, визуализация, A/B тесты |
| **ML Engineering** | Модели в production | MLOps, serving, мониторинг |
| **AI Engineering** | AI-системы | LLM интеграция, агенты, RAG |

---

## Терминология Data Science

### Базовые понятия

| Термин | Определение |
|--------|-------------|
| **Dataset** | Структурированный набор данных для анализа/обучения |
| **Feature** | Признак, входная переменная модели |
| **Target** | Целевая переменная, которую предсказываем |
| **Training set** | Данные для обучения модели |
| **Test set** | Данные для оценки качества |
| **Validation set** | Данные для подбора гиперпараметров |

### Типы данных

```
Structured (табличные)
├── Числовые (continuous, discrete)
├── Категориальные (nominal, ordinal)
└── Временные ряды

Unstructured
├── Текст (NLP)
├── Изображения (CV)
├── Аудио
└── Видео

Semi-structured
├── JSON, XML
└── Графы
```

### Метрики качества

#### Для классификации

| Метрика | Формула | Применение |
|---------|---------|------------|
| **Accuracy** | (TP + TN) / Total | Сбалансированные классы |
| **Precision** | TP / (TP + FP) | Важна точность положительных |
| **Recall** | TP / (TP + FN) | Важно не пропустить положительные |
| **F1-score** | 2 * (P * R) / (P + R) | Баланс precision/recall |
| **ROC-AUC** | Area under ROC curve | Общее качество классификатора |

#### Для регрессии

| Метрика | Описание |
|---------|----------|
| **MAE** | Mean Absolute Error |
| **MSE** | Mean Squared Error |
| **RMSE** | Root Mean Squared Error |
| **R²** | Коэффициент детерминации |

---

## Data Science Pipeline

### Классический CRISP-DM

```
┌─────────────────┐
│ Business        │
│ Understanding   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│ Data            │────►│ Data            │
│ Understanding   │     │ Preparation     │
└────────┬────────┘     └────────┬────────┘
         │                       │
         │              ┌────────▼────────┐
         │              │    Modeling     │
         │              └────────┬────────┘
         │                       │
         │              ┌────────▼────────┐
         └─────────────►│   Evaluation    │
                        └────────┬────────┘
                                 │
                        ┌────────▼────────┐
                        │   Deployment    │
                        └─────────────────┘
```

### Современный ML Pipeline

```
Data Ingestion → Feature Engineering → Training → Evaluation → Deployment → Monitoring
      │                  │                │           │             │            │
      ▼                  ▼                ▼           ▼             ▼            ▼
   Kafka,            Spark,           PyTorch,    MLflow,      Kubernetes,   Prometheus,
   Airflow           dbt              TensorFlow  W&B          Seldon        Grafana
```

---

## Инструменты Data Science

### Языки и среды

| Инструмент | Назначение |
|------------|------------|
| **Python** | Основной язык DS/ML |
| **R** | Статистический анализ |
| **SQL** | Работа с данными |
| **Jupyter** | Интерактивная разработка |

### Python-экосистема

```
Data Manipulation     Visualization      ML/DL
├── NumPy            ├── Matplotlib     ├── scikit-learn
├── Pandas           ├── Seaborn        ├── PyTorch
├── Polars           ├── Plotly         ├── TensorFlow
└── Dask             └── Altair         └── XGBoost

NLP                   Computer Vision    MLOps
├── HuggingFace      ├── OpenCV         ├── MLflow
├── spaCy            ├── torchvision    ├── DVC
├── NLTK             └── Pillow         ├── Weights & Biases
└── LangChain                           └── Kubeflow
```

### Платформы и облака

| Платформа | Особенности |
|-----------|-------------|
| **Databricks** | Unified analytics, Spark |
| **Snowflake** | Data warehouse, ML features |
| **AWS SageMaker** | End-to-end ML платформа |
| **GCP Vertex AI** | AutoML, ML pipelines |
| **Azure ML** | Enterprise ML |

---

## Feature Engineering

### Техники обработки признаков

#### Числовые признаки

```python
# Нормализация (0-1)
from sklearn.preprocessing import MinMaxScaler
scaler = MinMaxScaler()
X_scaled = scaler.fit_transform(X)

# Стандартизация (mean=0, std=1)
from sklearn.preprocessing import StandardScaler
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# Log-трансформация для скошенных распределений
import numpy as np
X_log = np.log1p(X)
```

#### Категориальные признаки

```python
# One-Hot Encoding
from sklearn.preprocessing import OneHotEncoder
encoder = OneHotEncoder(sparse=False)
X_encoded = encoder.fit_transform(X[['category']])

# Label Encoding (для ordinal)
from sklearn.preprocessing import LabelEncoder
le = LabelEncoder()
X['category_encoded'] = le.fit_transform(X['category'])

# Target Encoding
import category_encoders as ce
encoder = ce.TargetEncoder(cols=['category'])
X_encoded = encoder.fit_transform(X, y)
```

#### Работа с пропусками

| Стратегия | Применение |
|-----------|------------|
| **Удаление** | Малая доля пропусков (<5%) |
| **Среднее/Медиана** | Числовые признаки |
| **Мода** | Категориальные признаки |
| **KNN Imputer** | Сложные зависимости |
| **Отдельная категория** | "Unknown" для категорий |

---

## Exploratory Data Analysis (EDA)

### Чек-лист EDA

```markdown
## 1. Обзор данных
- [ ] Размерность (rows, columns)
- [ ] Типы данных
- [ ] Пропущенные значения
- [ ] Дубликаты

## 2. Univariate Analysis
- [ ] Распределения числовых признаков
- [ ] Частоты категориальных
- [ ] Выбросы (outliers)

## 3. Bivariate Analysis
- [ ] Корреляции между признаками
- [ ] Зависимости с target
- [ ] Категориальные vs числовые

## 4. Multivariate Analysis
- [ ] PCA / t-SNE визуализация
- [ ] Кластеризация
- [ ] Feature importance
```

### Код для быстрого EDA

```python
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

# Обзор
df.info()
df.describe()
df.isnull().sum()

# Распределения
df.hist(figsize=(12, 8))
plt.tight_layout()

# Корреляции
plt.figure(figsize=(10, 8))
sns.heatmap(df.corr(), annot=True, cmap='coolwarm')

# Категориальные
for col in df.select_dtypes(include='object'):
    df[col].value_counts().plot(kind='bar')
    plt.title(col)
    plt.show()
```

---

## ML для разработчиков

### Быстрый старт с scikit-learn

```python
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report

# Разделение данных
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# Обучение
model = RandomForestClassifier(n_estimators=100)
model.fit(X_train, y_train)

# Оценка
y_pred = model.predict(X_test)
print(classification_report(y_test, y_pred))
```

### AutoML инструменты

| Инструмент | Особенности |
|------------|-------------|
| **AutoGluon** | Лучший для табличных данных |
| **H2O AutoML** | Enterprise-ready |
| **TPOT** | Генетические алгоритмы |
| **Auto-sklearn** | На основе sklearn |
| **PyCaret** | Low-code ML |

```python
# Пример AutoGluon
from autogluon.tabular import TabularPredictor

predictor = TabularPredictor(label='target').fit(train_data)
predictions = predictor.predict(test_data)
```

---

## LLM и Data Science

### Применение LLM в DS

| Задача | Подход |
|--------|--------|
| **Анализ данных** | Код-ассистенты (Copilot, Claude) |
| **EDA** | Генерация кода для визуализаций |
| **Feature Engineering** | Предложение новых признаков |
| **Документация** | Автогенерация описаний |
| **Text Analytics** | Zero-shot классификация, NER |

### LLM для текстовых данных

```python
from langchain_anthropic import ChatAnthropic
from langchain.prompts import PromptTemplate

llm = ChatAnthropic(model="claude-3-sonnet-20240229")

# Классификация тональности
prompt = PromptTemplate(
    input_variables=["text"],
    template="Classify sentiment: {text}\nSentiment:"
)

# Извлечение сущностей
prompt = PromptTemplate(
    input_variables=["text"],
    template="Extract named entities (person, org, location): {text}"
)
```

### Синтетические данные

LLM для генерации данных:

```python
prompt = """Generate 10 synthetic customer reviews for a
software product. Include both positive and negative reviews.
Format: JSON array with fields: text, rating (1-5)"""

synthetic_data = llm.invoke(prompt)
```

---

## Ссылки

- [[AI|Искусственный интеллект]]
- [[AI Engineering|AI Engineering Pipeline]]
- [[AI#Работа с данными|Работа с данными]]
- [[AI#ML/AI-библиотеки|ML/AI библиотеки]]
