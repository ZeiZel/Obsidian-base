---
tags:
  - backend
  - golang
  - go
  - os
  - filesystem
---

# Работа с ОС и файловой системой

Эта глава охватывает взаимодействие Go-программ с операционной системой: чтение переменных окружения, работу с файлами и директориями, запуск процессов, обработку сигналов и конфигурацию приложений. Все эти навыки критически важны для написания реальных backend-сервисов и CLI-утилит.

> [!NOTE] Предпосылки
> Для понимания этой главы необходимо знание основ Go из [[01-basics]]: переменные, функции, структуры, обработка ошибок, слайсы и работа с пакетами.

---

## 1. Пакет os

Пакет `os` предоставляет платформонезависимый интерфейс к функциям операционной системы. Это фундаментальный пакет, который используется практически в каждом Go-приложении.

### Переменные окружения

Переменные окружения — основной способ конфигурации приложений в production-среде (12-Factor App). Go предоставляет три ключевые функции для работы с ними.

```go
package main

import (
	"fmt"
	"os"
)

func main() {
	// os.Getenv — получить значение переменной окружения
	// Если переменная не задана, возвращает пустую строку
	home := os.Getenv("HOME")
	fmt.Println("Домашняя директория:", home)

	// os.LookupEnv — получить значение + проверить, существует ли переменная
	// Это важно: пустая строка и отсутствие переменной — разные вещи
	dbHost, exists := os.LookupEnv("DB_HOST")
	if !exists {
		fmt.Println("DB_HOST не задана, используем значение по умолчанию")
		dbHost = "localhost"
	}
	fmt.Println("DB_HOST:", dbHost)

	// os.Setenv — установить переменную окружения для текущего процесса
	// Внимание: изменение НЕ затрагивает родительский процесс
	err := os.Setenv("APP_MODE", "development")
	if err != nil {
		fmt.Println("Ошибка установки переменной:", err)
	}

	// os.Unsetenv — удалить переменную окружения
	_ = os.Unsetenv("TEMP_VAR")

	// os.Environ — получить все переменные окружения как слайс строк
	// Каждый элемент имеет формат "KEY=VALUE"
	for _, env := range os.Environ() {
		fmt.Println(env)
	}
}
```

> [!WARNING] Конкурентный доступ
> Функции `os.Setenv` и `os.Getenv` НЕ являются потокобезопасными. Не вызывайте `Setenv` из горутин без синхронизации. В production лучше читать все переменные один раз при старте приложения и хранить в конфигурационной структуре.

### Аргументы командной строки

```go
package main

import (
	"fmt"
	"os"
)

func main() {
	// os.Args — слайс аргументов командной строки
	// os.Args[0] — всегда путь к исполняемому файлу
	// os.Args[1:] — переданные аргументы
	fmt.Println("Путь к программе:", os.Args[0])
	fmt.Println("Количество аргументов:", len(os.Args)-1)

	// Проверяем, передали ли аргументы
	if len(os.Args) < 2 {
		fmt.Println("Использование: program <имя>")
		os.Exit(1) // Завершаем программу с кодом ошибки
	}

	name := os.Args[1]
	fmt.Println("Привет,", name)
}
```

### Информация о системе

```go
package main

import (
	"fmt"
	"os"
)

func main() {
	// os.Hostname — имя хоста (полезно для логов и мониторинга)
	hostname, err := os.Hostname()
	if err != nil {
		fmt.Println("Ошибка получения hostname:", err)
	}
	fmt.Println("Hostname:", hostname)

	// os.Getwd — текущая рабочая директория
	cwd, err := os.Getwd()
	if err != nil {
		fmt.Println("Ошибка получения cwd:", err)
	}
	fmt.Println("Текущая директория:", cwd)

	// os.UserHomeDir — домашняя директория пользователя
	homeDir, err := os.UserHomeDir()
	if err != nil {
		fmt.Println("Ошибка:", err)
	}
	fmt.Println("Домашняя директория:", homeDir)

	// os.Getpid / os.Getppid — ID текущего процесса и родительского
	fmt.Println("PID:", os.Getpid())
	fmt.Println("PPID:", os.Getppid())

	// os.Exit — завершение программы с указанным кодом
	// 0 = успех, любое другое значение = ошибка
	// Внимание: defer-функции НЕ вызываются при os.Exit!
	// os.Exit(0)
}
```

> [!TIP] os.Exit и defer
> `os.Exit` немедленно завершает программу. Функции, зарегистрированные через `defer`, НЕ будут вызваны. Если нужно гарантировать выполнение cleanup-логики, используйте `return` из `main()` или вынесите логику в отдельную функцию.

###### 🏠 Домашнее задание

1. Напишите программу, которая выводит все переменные окружения, начинающиеся с `GO` (например, `GOPATH`, `GOROOT`).
2. Напишите CLI-утилиту, которая принимает через аргументы командной строки имя переменной окружения и выводит её значение, либо сообщение об отсутствии.
3. Создайте функцию `getEnvOrDefault(key, defaultValue string) string`, которая возвращает значение переменной окружения или значение по умолчанию, если переменная не задана.

---

## 2. Работа с файлами

Работа с файлами — одна из самых частых задач в backend-разработке: логирование, конфигурация, обработка данных, кеширование.

### Простые операции: ReadFile и WriteFile

Для простого чтения и записи небольших файлов целиком используются функции из пакета `os`.

```go
package main

import (
	"fmt"
	"os"
)

func main() {
	// === Запись файла целиком ===
	// os.WriteFile(имя, данные, права доступа)
	// 0644 — владелец: чтение+запись, группа и остальные: только чтение
	content := []byte("Привет, Go!\nВторая строка файла.\n")
	err := os.WriteFile("example.txt", content, 0644)
	if err != nil {
		fmt.Println("Ошибка записи:", err)
		return
	}
	fmt.Println("Файл записан успешно")

	// === Чтение файла целиком ===
	// os.ReadFile возвращает содержимое файла как []byte
	data, err := os.ReadFile("example.txt")
	if err != nil {
		fmt.Println("Ошибка чтения:", err)
		return
	}
	fmt.Println("Содержимое файла:")
	fmt.Println(string(data)) // Преобразуем байты в строку для вывода
}
```

> [!WARNING] Большие файлы
> `os.ReadFile` загружает ВЕСЬ файл в память. Для файлов размером в гигабайты это приведёт к исчерпанию памяти. Для больших файлов используйте потоковое чтение через `bufio.Scanner` (раздел 10).

### Работа с файловыми дескрипторами

Для более сложных сценариев (дозапись, чтение частями, контроль позиции) нужно работать с файловым дескриптором.

```go
package main

import (
	"fmt"
	"io"
	"os"
)

func main() {
	// === Создание нового файла ===
	// os.Create — создаёт файл или обрезает существующий до нулевого размера
	// Эквивалент os.OpenFile(name, os.O_RDWR|os.O_CREATE|os.O_TRUNC, 0666)
	f, err := os.Create("output.txt")
	if err != nil {
		fmt.Println("Ошибка создания файла:", err)
		return
	}
	defer f.Close() // ВСЕГДА закрываем файл через defer

	// Запись строки в файл
	_, err = f.WriteString("Строка 1\n")
	if err != nil {
		fmt.Println("Ошибка записи:", err)
		return
	}

	// Запись байтов
	_, err = f.Write([]byte("Строка 2\n"))
	if err != nil {
		fmt.Println("Ошибка записи:", err)
		return
	}

	// Используем fmt.Fprintf для форматированной записи в файл
	_, err = fmt.Fprintf(f, "Строка %d: %s\n", 3, "форматированная запись")
	if err != nil {
		fmt.Println("Ошибка записи:", err)
		return
	}

	// === Открытие существующего файла для чтения ===
	// os.Open — открывает файл только для чтения
	// Эквивалент os.OpenFile(name, os.O_RDONLY, 0)
	readFile, err := os.Open("output.txt")
	if err != nil {
		fmt.Println("Ошибка открытия:", err)
		return
	}
	defer readFile.Close()

	// io.ReadAll — читает все данные из Reader до EOF
	data, err := io.ReadAll(readFile)
	if err != nil {
		fmt.Println("Ошибка чтения:", err)
		return
	}
	fmt.Println("Прочитано:")
	fmt.Println(string(data))
}
```

### OpenFile: полный контроль

```go
package main

import (
	"fmt"
	"os"
)

func main() {
	// os.OpenFile даёт полный контроль над режимом открытия файла
	// Флаги можно комбинировать через побитовое ИЛИ (|):
	//   os.O_RDONLY  — только чтение
	//   os.O_WRONLY  — только запись
	//   os.O_RDWR   — чтение и запись
	//   os.O_APPEND  — дозапись в конец файла
	//   os.O_CREATE  — создать файл, если не существует
	//   os.O_TRUNC   — обрезать файл при открытии
	//   os.O_EXCL    — ошибка, если файл уже существует (с O_CREATE)

	// Дозапись в лог-файл (создать, если не существует)
	logFile, err := os.OpenFile(
		"app.log",
		os.O_APPEND|os.O_CREATE|os.O_WRONLY, // Дозаписываем, создаём, только запись
		0644,                                  // Права доступа: -rw-r--r--
	)
	if err != nil {
		fmt.Println("Ошибка открытия лог-файла:", err)
		return
	}
	defer logFile.Close()

	// Записываем строки в лог
	_, _ = fmt.Fprintf(logFile, "[INFO] Приложение запущено\n")
	_, _ = fmt.Fprintf(logFile, "[INFO] Обработано %d записей\n", 42)

	// === Права доступа (Unix permission bits) ===
	// 0644 = -rw-r--r-- (файлы: владелец rw, остальные r)
	// 0755 = -rwxr-xr-x (исполняемые файлы и директории)
	// 0600 = -rw------- (приватные файлы, ключи, секреты)
	// 0666 = -rw-rw-rw- (чтение/запись для всех, маска umask обрежет)
}
```

> [!INFO] Права доступа
> В Unix-системах права задаются в восьмеричной системе. Первая цифра — владелец, вторая — группа, третья — остальные. 4=чтение, 2=запись, 1=исполнение. Например, `0644` = 6(rw) + 4(r) + 4(r).

###### 🏠 Домашнее задание

1. Напишите программу, которая копирует содержимое одного файла в другой (имена файлов передаются через аргументы).
2. Реализуйте простую систему логирования: функция `appendLog(filename, message string) error`, которая дозаписывает строку с таймстампом в файл.
3. Создайте программу, которая считает количество строк, слов и байтов в файле (аналог `wc`).

---

## 3. Директории

### Создание и удаление директорий

```go
package main

import (
	"fmt"
	"os"
)

func main() {
	// os.Mkdir — создать одну директорию
	// Ошибка, если родительская директория не существует
	err := os.Mkdir("testdir", 0755)
	if err != nil {
		fmt.Println("Ошибка создания директории:", err)
	}

	// os.MkdirAll — создать директорию и все родительские
	// Аналог mkdir -p в командной строке
	err = os.MkdirAll("path/to/nested/dir", 0755)
	if err != nil {
		fmt.Println("Ошибка:", err)
	}

	// os.Remove — удалить файл или ПУСТУЮ директорию
	err = os.Remove("testdir")
	if err != nil {
		fmt.Println("Ошибка удаления:", err)
	}

	// os.RemoveAll — удалить директорию со всем содержимым (рекурсивно)
	// Аналог rm -rf. ОСТОРОЖНО — восстановить данные невозможно!
	err = os.RemoveAll("path")
	if err != nil {
		fmt.Println("Ошибка удаления:", err)
	}
}
```

### Чтение содержимого директории

```go
package main

import (
	"fmt"
	"os"
)

func main() {
	// os.ReadDir — прочитать содержимое директории
	// Возвращает отсортированный по имени слайс os.DirEntry
	entries, err := os.ReadDir(".")
	if err != nil {
		fmt.Println("Ошибка чтения директории:", err)
		return
	}

	for _, entry := range entries {
		// entry.Name() — имя файла/директории
		// entry.IsDir() — является ли директорией
		// entry.Type() — тип записи (файл, директория, симлинк)
		if entry.IsDir() {
			fmt.Printf("[DIR]  %s\n", entry.Name())
		} else {
			// entry.Info() возвращает os.FileInfo с подробной информацией
			info, err := entry.Info()
			if err != nil {
				continue
			}
			fmt.Printf("[FILE] %s (%d байт)\n", entry.Name(), info.Size())
		}
	}
}
```

### Проверка существования файла через os.Stat

```go
package main

import (
	"errors"
	"fmt"
	"os"
)

// fileExists проверяет существование файла или директории
func fileExists(path string) bool {
	_, err := os.Stat(path)
	return !errors.Is(err, os.ErrNotExist)
}

// isDirectory проверяет, является ли путь директорией
func isDirectory(path string) (bool, error) {
	info, err := os.Stat(path)
	if err != nil {
		return false, err
	}
	return info.IsDir(), nil
}

func main() {
	// os.Stat возвращает os.FileInfo с подробной информацией о файле
	info, err := os.Stat("go.mod")
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			fmt.Println("Файл не существует")
		} else {
			fmt.Println("Ошибка:", err)
		}
		return
	}

	// Информация о файле
	fmt.Println("Имя:", info.Name())       // Имя файла без пути
	fmt.Println("Размер:", info.Size())     // Размер в байтах
	fmt.Println("Права:", info.Mode())      // Права доступа
	fmt.Println("Время модификации:", info.ModTime()) // Последнее изменение
	fmt.Println("Директория:", info.IsDir()) // true если директория

	// Пример использования функции проверки
	if fileExists("config.json") {
		fmt.Println("Конфиг найден")
	} else {
		fmt.Println("Конфиг не найден, создаём по умолчанию")
	}
}
```

> [!TIP] os.ErrNotExist vs os.IsNotExist
> В современном Go предпочтительно использовать `errors.Is(err, os.ErrNotExist)` вместо устаревшей функции `os.IsNotExist(err)`. Первый вариант корректно работает с обёрнутыми ошибками (`%w`).

###### 🏠 Домашнее задание

1. Напишите функцию `listFiles(dir string) ([]string, error)`, которая возвращает только файлы (не директории) из указанной директории.
2. Реализуйте рекурсивный подсчёт общего размера файлов в директории (аналог `du -s`).
3. Создайте утилиту, которая находит все пустые директории в заданном пути и предлагает их удалить.

---

## 4. Пакеты io и bufio

### io.Reader и io.Writer — фундаментальные абстракции

Интерфейсы `io.Reader` и `io.Writer` — основа всей системы ввода-вывода в Go. Файлы, сетевые соединения, буферы, HTTP-тела — всё реализует эти интерфейсы.

```go
// Определения из стандартной библиотеки:
// type Reader interface {
//     Read(p []byte) (n int, err error)
// }
// type Writer interface {
//     Write(p []byte) (n int, err error)
// }
```

```go
package main

import (
	"fmt"
	"io"
	"os"
	"strings"
)

func main() {
	// === io.Copy — копирование данных между Reader и Writer ===
	// Это самый эффективный способ копирования — использует буфер 32KB

	// Копируем содержимое файла в stdout
	f, err := os.Open("example.txt")
	if err != nil {
		fmt.Println("Ошибка:", err)
		return
	}
	defer f.Close()

	// os.Stdout реализует io.Writer, а f реализует io.Reader
	bytesCopied, err := io.Copy(os.Stdout, f)
	if err != nil {
		fmt.Println("Ошибка копирования:", err)
		return
	}
	fmt.Printf("\nСкопировано %d байт\n", bytesCopied)

	// === io.ReadAll — прочитать всё из Reader ===
	reader := strings.NewReader("Данные из строки") // strings.Reader реализует io.Reader
	data, err := io.ReadAll(reader)
	if err != nil {
		fmt.Println("Ошибка:", err)
		return
	}
	fmt.Println(string(data))

	// === io.MultiReader — объединить несколько Reader в один ===
	// Читает последовательно: когда первый Reader заканчивается, переходит ко второму
	r1 := strings.NewReader("Часть 1. ")
	r2 := strings.NewReader("Часть 2. ")
	r3 := strings.NewReader("Часть 3.\n")
	combined := io.MultiReader(r1, r2, r3)
	_, _ = io.Copy(os.Stdout, combined) // Выведет: "Часть 1. Часть 2. Часть 3."

	// === io.TeeReader — чтение с одновременной записью копии ===
	// Полезно для логирования, подсчёта хешей при чтении и т.д.
	source := strings.NewReader("Важные данные для обработки")
	logFile, _ := os.Create("read_log.txt")
	defer logFile.Close()

	// tee читает из source и одновременно записывает прочитанное в logFile
	tee := io.TeeReader(source, logFile)
	content, _ := io.ReadAll(tee)
	fmt.Println("Обработано:", string(content))
	// В read_log.txt теперь та же строка — копия всего прочитанного
}
```

### bufio — буферизованный ввод-вывод

Пакет `bufio` оборачивает `io.Reader` и `io.Writer`, добавляя буферизацию. Это критически важно для производительности при множественных мелких операциях чтения/записи.

```go
package main

import (
	"bufio"
	"fmt"
	"os"
	"strings"
)

func main() {
	// === bufio.Scanner — построчное чтение ===
	// Самый удобный способ читать файл строка за строкой

	file, err := os.Open("example.txt")
	if err != nil {
		fmt.Println("Ошибка:", err)
		return
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	lineNum := 0
	for scanner.Scan() { // Scan() читает следующую строку, возвращает false при EOF
		lineNum++
		line := scanner.Text() // Text() возвращает текущую строку без \n
		fmt.Printf("%d: %s\n", lineNum, line)
	}
	// Всегда проверяем ошибку после цикла
	if err := scanner.Err(); err != nil {
		fmt.Println("Ошибка чтения:", err)
	}

	// === Увеличение размера буфера Scanner ===
	// По умолчанию Scanner читает строки до 64KB
	// Для длинных строк нужно увеличить буфер
	bigScanner := bufio.NewScanner(strings.NewReader("очень длинная строка..."))
	buf := make([]byte, 0, 1024*1024) // Начальный буфер 1MB
	bigScanner.Buffer(buf, 10*1024*1024) // Максимум 10MB на строку

	// === bufio.Scanner с разными разделителями ===
	// По умолчанию Scanner разделяет по строкам (ScanLines)
	// Можно разделять по словам или по байтам
	wordScanner := bufio.NewScanner(strings.NewReader("один два три четыре"))
	wordScanner.Split(bufio.ScanWords) // Разделяем по словам
	for wordScanner.Scan() {
		fmt.Println("Слово:", wordScanner.Text())
	}

	// === bufio.NewWriter — буферизованная запись ===
	outFile, err := os.Create("buffered_output.txt")
	if err != nil {
		fmt.Println("Ошибка:", err)
		return
	}
	defer outFile.Close()

	// Буферизованный Writer собирает данные и записывает их блоками
	// Это значительно быстрее, чем множество мелких Write()
	writer := bufio.NewWriter(outFile)

	for i := 0; i < 1000; i++ {
		fmt.Fprintf(writer, "Строка %d\n", i)
	}

	// ВАЖНО: обязательно вызвать Flush() для записи оставшихся данных из буфера!
	// Без Flush() последние данные могут потеряться
	err = writer.Flush()
	if err != nil {
		fmt.Println("Ошибка сброса буфера:", err)
	}

	// === bufio.NewReader — буферизованное чтение ===
	// Полезно для чтения по символам или произвольными порциями
	reader := bufio.NewReader(strings.NewReader("Привет\nМир\n"))

	// ReadString читает до указанного разделителя (включительно)
	line, err := reader.ReadString('\n')
	if err != nil {
		fmt.Println("Ошибка:", err)
	}
	fmt.Printf("Первая строка: %q\n", line) // "Привет\n"
}
```

> [!WARNING] Не забывайте Flush!
> `bufio.Writer` хранит данные в памяти до вызова `Flush()`. Если программа завершится аварийно, данные в буфере будут потеряны. Всегда вызывайте `Flush()` явно или используйте `defer writer.Flush()` сразу после создания Writer.

###### 🏠 Домашнее задание

1. Напишите функцию, которая с помощью `io.TeeReader` читает файл и одновременно считает MD5-хеш его содержимого (используя `crypto/md5`).
2. Реализуйте программу, которая объединяет несколько текстовых файлов в один с помощью `io.MultiReader` (аналог `cat file1 file2 > output`).
3. Сравните производительность записи 1 миллиона строк в файл с `bufio.Writer` и без него. Используйте `time.Now()` для замера.

---

## 5. Пакет path/filepath

Пакет `path/filepath` предоставляет функции для работы с путями файлов, учитывающие особенности операционной системы (разделители `/` и `\`).

> [!NOTE] path vs path/filepath
> Пакет `path` работает только со слешами (`/`) и предназначен для URL-путей. Для работы с путями файловой системы всегда используйте `path/filepath` — он корректно обрабатывает разделители на Windows и Unix.

```go
package main

import (
	"fmt"
	"path/filepath"
)

func main() {
	// === filepath.Join — платформонезависимая сборка пути ===
	// На Linux: "home/user/documents/file.txt"
	// На Windows: "home\\user\\documents\\file.txt"
	path := filepath.Join("home", "user", "documents", "file.txt")
	fmt.Println("Путь:", path)

	// Join автоматически очищает путь от лишних разделителей
	clean := filepath.Join("home/", "/user/", "//documents/")
	fmt.Println("Очищенный путь:", clean) // home/user/documents

	// === Разбор пути на компоненты ===
	fullPath := "/home/user/project/main.go"

	fmt.Println("Dir:", filepath.Dir(fullPath))   // /home/user/project
	fmt.Println("Base:", filepath.Base(fullPath))  // main.go
	fmt.Println("Ext:", filepath.Ext(fullPath))    // .go

	// === filepath.Abs — получить абсолютный путь ===
	absPath, err := filepath.Abs("relative/path")
	if err != nil {
		fmt.Println("Ошибка:", err)
	}
	fmt.Println("Абсолютный путь:", absPath)

	// === filepath.Rel — получить относительный путь ===
	relPath, err := filepath.Rel("/home/user", "/home/user/project/main.go")
	if err != nil {
		fmt.Println("Ошибка:", err)
	}
	fmt.Println("Относительный путь:", relPath) // project/main.go

	// === filepath.Glob — поиск файлов по шаблону ===
	// Поддерживает * (любые символы), ? (один символ), [...] (диапазон)
	goFiles, err := filepath.Glob("*.go")
	if err != nil {
		fmt.Println("Ошибка:", err)
	}
	fmt.Println("Go-файлы:", goFiles)

	// === filepath.Match — проверка соответствия шаблону ===
	matched, err := filepath.Match("*.go", "main.go")
	if err != nil {
		fmt.Println("Ошибка:", err)
	}
	fmt.Println("Совпадает:", matched) // true
}
```

### filepath.WalkDir — рекурсивный обход директории

```go
package main

import (
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"strings"
)

func main() {
	// filepath.WalkDir рекурсивно обходит все файлы и директории
	// Это замена устаревшей filepath.Walk (WalkDir эффективнее)

	root := "." // Начальная директория

	// Пример: найти все .go файлы в проекте
	var goFiles []string

	err := filepath.WalkDir(root, func(path string, d fs.DirEntry, err error) error {
		// Если произошла ошибка доступа к файлу — пропускаем
		if err != nil {
			fmt.Printf("Ошибка доступа к %s: %v\n", path, err)
			return nil // Возвращаем nil, чтобы продолжить обход
		}

		// Пропускаем скрытые директории и vendor
		if d.IsDir() {
			name := d.Name()
			if strings.HasPrefix(name, ".") || name == "vendor" || name == "node_modules" {
				return filepath.SkipDir // Пропустить директорию целиком
			}
			return nil
		}

		// Собираем .go файлы
		if filepath.Ext(path) == ".go" {
			goFiles = append(goFiles, path)
		}
		return nil
	})

	if err != nil {
		fmt.Println("Ошибка обхода:", err)
		os.Exit(1)
	}

	fmt.Printf("Найдено %d Go-файлов:\n", len(goFiles))
	for _, f := range goFiles {
		fmt.Println(" ", f)
	}
}
```

> [!TIP] filepath.SkipDir и filepath.SkipAll
> Возврат `filepath.SkipDir` из колбэка пропускает текущую директорию и все её содержимое. В Go 1.20 появился `filepath.SkipAll`, который полностью прекращает обход (полезно, когда нашли то, что искали).

###### 🏠 Домашнее задание

1. Напишите утилиту, которая находит все дубликаты файлов в директории (по MD5-хешу содержимого), используя `filepath.WalkDir`.
2. Реализуйте функцию `findLargestFiles(root string, n int) ([]string, error)`, которая возвращает `n` самых больших файлов.
3. Создайте программу, которая переименовывает все файлы в директории, заменяя пробелы на подчёркивания.

---

## 6. Работа с процессами: os/exec

Пакет `os/exec` позволяет запускать внешние программы из Go-кода. Это полезно для интеграции с системными утилитами, скриптами и другими приложениями.

```go
package main

import (
	"bytes"
	"context"
	"fmt"
	"os/exec"
	"time"
)

func main() {
	// === exec.Command — создать команду ===
	// Первый аргумент — программа, остальные — её аргументы

	// cmd.Run() — запустить и дождаться завершения
	cmd := exec.Command("echo", "Привет", "из", "Go")
	err := cmd.Run()
	if err != nil {
		fmt.Println("Ошибка выполнения:", err)
	}

	// === cmd.Output() — запустить и получить stdout ===
	out, err := exec.Command("date").Output()
	if err != nil {
		fmt.Println("Ошибка:", err)
		return
	}
	fmt.Println("Текущая дата:", string(out))

	// === cmd.CombinedOutput() — stdout + stderr вместе ===
	combined, err := exec.Command("ls", "-la", "/tmp").CombinedOutput()
	if err != nil {
		fmt.Println("Ошибка:", err)
	}
	fmt.Println("Содержимое /tmp:")
	fmt.Println(string(combined))

	// === Раздельный захват stdout и stderr ===
	cmd2 := exec.Command("ls", "-la", "/nonexistent")
	var stdout, stderr bytes.Buffer
	cmd2.Stdout = &stdout // Перенаправляем stdout в буфер
	cmd2.Stderr = &stderr // Перенаправляем stderr в буфер
	err = cmd2.Run()
	if err != nil {
		fmt.Println("Команда завершилась с ошибкой:")
		fmt.Println("stderr:", stderr.String())
	}

	// === Настройка окружения и рабочей директории ===
	cmd3 := exec.Command("go", "version")
	cmd3.Dir = "/tmp"            // Рабочая директория для команды
	cmd3.Env = append(cmd3.Env,  // Переменные окружения
		"PATH=/usr/local/go/bin:/usr/bin",
		"HOME=/home/user",
	)
	output3, _ := cmd3.Output()
	fmt.Println(string(output3))
}
```

### Start/Wait и длительные процессы

```go
package main

import (
	"fmt"
	"os/exec"
)

func main() {
	// cmd.Start() — запустить процесс без ожидания завершения
	// cmd.Wait() — дождаться завершения запущенного процесса
	// Это полезно для параллельного запуска нескольких команд

	cmd := exec.Command("sleep", "2")
	err := cmd.Start()
	if err != nil {
		fmt.Println("Ошибка запуска:", err)
		return
	}

	fmt.Println("Процесс запущен, PID:", cmd.Process.Pid)
	fmt.Println("Делаем другую работу, пока процесс выполняется...")

	// Ждём завершения
	err = cmd.Wait()
	if err != nil {
		fmt.Println("Процесс завершился с ошибкой:", err)
	} else {
		fmt.Println("Процесс завершился успешно")
	}
}
```

### Timeout через context

```go
package main

import (
	"context"
	"fmt"
	"os/exec"
	"time"
)

func main() {
	// Создаём контекст с таймаутом 3 секунды
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	// exec.CommandContext — команда, привязанная к контексту
	// Если контекст отменится (таймаут), процесс будет убит
	cmd := exec.CommandContext(ctx, "sleep", "10")
	err := cmd.Run()
	if err != nil {
		// Проверяем, был ли таймаут
		if ctx.Err() == context.DeadlineExceeded {
			fmt.Println("Команда была прервана по таймауту")
		} else {
			fmt.Println("Ошибка:", err)
		}
	}
}
```

### Запуск shell-команд с пайпами

```go
package main

import (
	"fmt"
	"os/exec"
)

func main() {
	// Для выполнения сложных shell-команд с пайпами и перенаправлениями
	// нужно запускать через shell (bash/sh)
	cmd := exec.Command("bash", "-c", "ps aux | grep go | head -5")
	out, err := cmd.CombinedOutput()
	if err != nil {
		fmt.Println("Ошибка:", err)
	}
	fmt.Println(string(out))

	// Программное соединение двух команд через Pipe
	// (без вызова shell — безопаснее для пользовательского ввода)
	grepCmd := exec.Command("grep", "root")
	psCmd := exec.Command("ps", "aux")

	// Соединяем stdout ps со stdin grep
	pipe, err := psCmd.StdoutPipe()
	if err != nil {
		fmt.Println("Ошибка создания pipe:", err)
		return
	}
	grepCmd.Stdin = pipe

	// Запускаем обе команды
	err = psCmd.Start()
	if err != nil {
		fmt.Println("Ошибка запуска ps:", err)
		return
	}
	out2, err := grepCmd.Output()
	if err != nil {
		fmt.Println("Ошибка grep:", err)
	}
	_ = psCmd.Wait()
	fmt.Println(string(out2))
}
```

> [!WARNING] Безопасность os/exec
> Никогда не передавайте пользовательский ввод напрямую в shell-команды! Это может привести к инъекции команд (command injection). Используйте `exec.Command("program", arg1, arg2)` с отдельными аргументами вместо `exec.Command("bash", "-c", userInput)`.

###### 🏠 Домашнее задание

1. Напишите программу, которая запускает `git log --oneline -10` и выводит результат. Обработайте случай, когда `git` не установлен.
2. Реализуйте функцию `runWithTimeout(command string, args []string, timeout time.Duration) (string, error)`, которая запускает команду с таймаутом.
3. Создайте утилиту, которая параллельно пингует список хостов (используя `exec.Command("ping", "-c", "1", host)`) и выводит результаты.

---

## 7. Сигналы: os/signal, syscall

Сигналы — механизм ОС для уведомления процесса о внешних событиях. Обработка сигналов необходима для корректного завершения (graceful shutdown) серверов и фоновых процессов.

```go
package main

import (
	"fmt"
	"os"
	"os/signal"
	"syscall"
	"time"
)

func main() {
	// signal.Notify — подписка на сигналы ОС
	// Создаём канал для получения сигналов
	sigChan := make(chan os.Signal, 1) // Буферизованный канал (важно!)

	// Подписываемся на SIGINT (Ctrl+C) и SIGTERM (kill)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

	fmt.Println("Приложение запущено. Нажмите Ctrl+C для завершения...")

	// Запускаем рабочую горутину
	go func() {
		for i := 0; ; i++ {
			fmt.Printf("Работаем... итерация %d\n", i)
			time.Sleep(1 * time.Second)
		}
	}()

	// Блокируемся, ожидая сигнал
	sig := <-sigChan
	fmt.Printf("\nПолучен сигнал: %v\n", sig)
	fmt.Println("Выполняем graceful shutdown...")

	// Здесь можно:
	// - Закрыть соединения с БД
	// - Дождаться завершения текущих запросов
	// - Сохранить состояние на диск
	// - Закрыть файлы и очистить ресурсы

	fmt.Println("Приложение корректно завершено")
}
```

### signal.NotifyContext (Go 1.16+)

Более современный способ обработки сигналов через context — идеально подходит для серверных приложений.

```go
package main

import (
	"context"
	"fmt"
	"os/signal"
	"syscall"
	"time"
)

func main() {
	// signal.NotifyContext создаёт контекст, который отменяется при получении сигнала
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop() // Освобождаем ресурсы при выходе

	fmt.Println("Сервер запущен. Ctrl+C для остановки...")

	// Имитация работы сервера с graceful shutdown
	go func() {
		ticker := time.NewTicker(1 * time.Second)
		defer ticker.Stop()
		for {
			select {
			case <-ctx.Done(): // Контекст отменён — сигнал получен
				fmt.Println("Рабочая горутина завершается...")
				return
			case t := <-ticker.C:
				fmt.Println("Обработка в", t.Format("15:04:05"))
			}
		}
	}()

	// Ожидаем отмены контекста (получения сигнала)
	<-ctx.Done()

	fmt.Println("Получен сигнал завершения")
	fmt.Println("Даём 5 секунд на завершение текущих операций...")

	// Создаём новый контекст с таймаутом для graceful shutdown
	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer shutdownCancel()

	// Здесь выполняем shutdown: server.Shutdown(shutdownCtx)
	_ = shutdownCtx // Используется для остановки HTTP-сервера

	fmt.Println("Shutdown завершён")
}
```

> [!INFO] Подробнее о graceful shutdown
> Полная реализация паттерна graceful shutdown для HTTP-серверов, gRPC и воркеров рассматривается в [[09-deploy]]. Там же описаны health checks и readiness probes для Kubernetes.

###### 🏠 Домашнее задание

1. Напишите программу, которая при получении SIGUSR1 выводит текущую статистику (uptime, количество обработанных запросов), а при SIGINT/SIGTERM корректно завершается.
2. Модифицируйте пример с `signal.NotifyContext`, добавив graceful shutdown с ожиданием завершения нескольких горутин через `sync.WaitGroup`.

---

## 8. Работа с временными файлами

Временные файлы необходимы для безопасной промежуточной обработки данных: скачивание, трансформация, атомарная запись.

```go
package main

import (
	"fmt"
	"os"
	"path/filepath"
)

func main() {
	// === os.CreateTemp — создать временный файл ===
	// Первый аргумент — директория ("" = системная временная директория)
	// Второй аргумент — шаблон имени (* заменяется на случайную строку)
	tmpFile, err := os.CreateTemp("", "myapp-*.txt")
	if err != nil {
		fmt.Println("Ошибка создания temp файла:", err)
		return
	}
	// Гарантируем удаление временного файла при выходе
	defer os.Remove(tmpFile.Name())
	defer tmpFile.Close()

	fmt.Println("Временный файл:", tmpFile.Name())
	// Например: /tmp/myapp-123456789.txt

	// Пишем данные во временный файл
	_, err = tmpFile.WriteString("Промежуточные данные\n")
	if err != nil {
		fmt.Println("Ошибка записи:", err)
		return
	}

	// === os.MkdirTemp — создать временную директорию ===
	tmpDir, err := os.MkdirTemp("", "myapp-workdir-*")
	if err != nil {
		fmt.Println("Ошибка создания temp директории:", err)
		return
	}
	defer os.RemoveAll(tmpDir) // Удаляем всю директорию при выходе

	fmt.Println("Временная директория:", tmpDir)

	// Можно создавать файлы внутри временной директории
	dataFile := filepath.Join(tmpDir, "data.json")
	err = os.WriteFile(dataFile, []byte(`{"status":"ok"}`), 0644)
	if err != nil {
		fmt.Println("Ошибка:", err)
		return
	}

	fmt.Println("Создан файл:", dataFile)
}
```

### Паттерн атомарной записи

```go
package main

import (
	"fmt"
	"os"
	"path/filepath"
)

// atomicWriteFile — атомарная запись файла
// Гарантирует, что файл либо полностью записан, либо не изменён
// Это критически важно для конфигов, БД и других важных файлов
func atomicWriteFile(filename string, data []byte, perm os.FileMode) error {
	// 1. Создаём временный файл в той же директории
	//    (важно: в той же файловой системе, чтобы Rename был атомарным)
	dir := filepath.Dir(filename)
	tmpFile, err := os.CreateTemp(dir, ".tmp-*")
	if err != nil {
		return fmt.Errorf("создание temp файла: %w", err)
	}
	tmpName := tmpFile.Name()

	// Если что-то пойдёт не так — удаляем временный файл
	defer func() {
		if tmpName != "" {
			_ = os.Remove(tmpName)
		}
	}()

	// 2. Записываем данные во временный файл
	_, err = tmpFile.Write(data)
	if err != nil {
		_ = tmpFile.Close()
		return fmt.Errorf("запись данных: %w", err)
	}

	// 3. Синхронизируем данные с диском (fsync)
	err = tmpFile.Sync()
	if err != nil {
		_ = tmpFile.Close()
		return fmt.Errorf("sync: %w", err)
	}

	// 4. Закрываем файл
	err = tmpFile.Close()
	if err != nil {
		return fmt.Errorf("закрытие файла: %w", err)
	}

	// 5. Устанавливаем нужные права доступа
	err = os.Chmod(tmpName, perm)
	if err != nil {
		return fmt.Errorf("chmod: %w", err)
	}

	// 6. Атомарно заменяем целевой файл (rename в рамках одной ФС — атомарная операция)
	err = os.Rename(tmpName, filename)
	if err != nil {
		return fmt.Errorf("rename: %w", err)
	}

	tmpName = "" // Rename успешен, не удаляем файл в defer
	return nil
}

func main() {
	data := []byte(`{"todos": ["задача 1", "задача 2"]}`)
	err := atomicWriteFile("todos.json", data, 0644)
	if err != nil {
		fmt.Println("Ошибка:", err)
		return
	}
	fmt.Println("Файл атомарно записан")
}
```

> [!TIP] Зачем нужна атомарная запись?
> Если программа упадёт во время обычной записи, файл может оказаться повреждённым (частично записан). Атомарная запись через temp + rename гарантирует, что файл всегда будет в целостном состоянии. Этот паттерн используется в базах данных, конфигурационных системах и менеджерах пакетов.

###### 🏠 Домашнее задание

1. Реализуйте функцию `safeWriteJSON(filename string, v interface{}) error`, которая сериализует объект в JSON и атомарно записывает в файл.
2. Напишите программу, которая скачивает файл по URL во временный файл и затем перемещает его в целевое место (только после успешного скачивания).

---

## 9. Конфигурация приложения

Конфигурация — одна из первых задач при запуске любого приложения. Go предоставляет пакет `flag` для работы с CLI-флагами, а переменные окружения мы уже рассмотрели в разделе 1.

### Пакет flag

```go
package main

import (
	"flag"
	"fmt"
)

func main() {
	// === Определение флагов ===
	// flag.String возвращает указатель на строковую переменную
	host := flag.String("host", "localhost", "Хост для подключения")
	port := flag.Int("port", 8080, "Порт сервера")
	debug := flag.Bool("debug", false, "Включить отладочный режим")
	timeout := flag.Duration("timeout", 0, "Таймаут подключения (например, 30s, 5m)")

	// === Привязка к существующей переменной ===
	var configPath string
	flag.StringVar(&configPath, "config", "config.yaml", "Путь к файлу конфигурации")

	// === Парсинг флагов ===
	// Обязательно вызвать до использования значений
	flag.Parse()

	// === Использование значений (через разыменование указателя) ===
	fmt.Printf("Хост: %s\n", *host)
	fmt.Printf("Порт: %d\n", *port)
	fmt.Printf("Debug: %v\n", *debug)
	fmt.Printf("Timeout: %v\n", *timeout)
	fmt.Printf("Config: %s\n", configPath)

	// === flag.Args() — аргументы после флагов ===
	// Например: ./app -port 3000 arg1 arg2
	// flag.Args() вернёт ["arg1", "arg2"]
	fmt.Println("Оставшиеся аргументы:", flag.Args())
	fmt.Println("Количество аргументов:", flag.NArg())

	// === Пользовательский usage ===
	// flag.Usage можно переопределить
	flag.Usage = func() {
		fmt.Println("Мой сервер v1.0")
		fmt.Println("Использование:")
		flag.PrintDefaults() // Выводит все флаги с описанием
	}
}
```

> [!INFO] Запуск с флагами
> ```bash
> go run main.go -host 0.0.0.0 -port 3000 -debug -timeout 30s
> go run main.go -config /etc/myapp/config.yaml
> go run main.go --help  # Показать все доступные флаги
> ```

### Паттерн конфигурации через структуру

```go
package main

import (
	"flag"
	"fmt"
	"os"
	"strconv"
	"time"
)

// Config — структура конфигурации приложения
// Объединяет флаги командной строки и переменные окружения
type Config struct {
	Host         string        `json:"host"`
	Port         int           `json:"port"`
	Debug        bool          `json:"debug"`
	DatabaseURL  string        `json:"database_url"`
	ReadTimeout  time.Duration `json:"read_timeout"`
	WriteTimeout time.Duration `json:"write_timeout"`
	LogLevel     string        `json:"log_level"`
}

// LoadConfig загружает конфигурацию с приоритетом:
// 1. Флаги командной строки (высший приоритет)
// 2. Переменные окружения
// 3. Значения по умолчанию (низший приоритет)
func LoadConfig() *Config {
	cfg := &Config{}

	// Определяем флаги со значениями по умолчанию
	flag.StringVar(&cfg.Host, "host", getEnvOrDefault("APP_HOST", "localhost"), "Хост сервера")
	flag.IntVar(&cfg.Port, "port", getEnvInt("APP_PORT", 8080), "Порт сервера")
	flag.BoolVar(&cfg.Debug, "debug", getEnvBool("APP_DEBUG", false), "Режим отладки")
	flag.StringVar(&cfg.DatabaseURL, "db-url", getEnvOrDefault("DATABASE_URL", ""), "URL базы данных")
	flag.DurationVar(&cfg.ReadTimeout, "read-timeout", getEnvDuration("READ_TIMEOUT", 5*time.Second), "Таймаут чтения")
	flag.DurationVar(&cfg.WriteTimeout, "write-timeout", getEnvDuration("WRITE_TIMEOUT", 10*time.Second), "Таймаут записи")
	flag.StringVar(&cfg.LogLevel, "log-level", getEnvOrDefault("LOG_LEVEL", "info"), "Уровень логирования")

	flag.Parse()
	return cfg
}

// === Вспомогательные функции для чтения env ===

func getEnvOrDefault(key, defaultValue string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return defaultValue
}

func getEnvInt(key string, defaultValue int) int {
	if value, exists := os.LookupEnv(key); exists {
		if intVal, err := strconv.Atoi(value); err == nil {
			return intVal
		}
	}
	return defaultValue
}

func getEnvBool(key string, defaultValue bool) bool {
	if value, exists := os.LookupEnv(key); exists {
		if boolVal, err := strconv.ParseBool(value); err == nil {
			return boolVal
		}
	}
	return defaultValue
}

func getEnvDuration(key string, defaultValue time.Duration) time.Duration {
	if value, exists := os.LookupEnv(key); exists {
		if dur, err := time.ParseDuration(value); err == nil {
			return dur
		}
	}
	return defaultValue
}

func main() {
	cfg := LoadConfig()

	fmt.Printf("Конфигурация:\n")
	fmt.Printf("  Host:          %s\n", cfg.Host)
	fmt.Printf("  Port:          %d\n", cfg.Port)
	fmt.Printf("  Debug:         %v\n", cfg.Debug)
	fmt.Printf("  DatabaseURL:   %s\n", cfg.DatabaseURL)
	fmt.Printf("  ReadTimeout:   %v\n", cfg.ReadTimeout)
	fmt.Printf("  WriteTimeout:  %v\n", cfg.WriteTimeout)
	fmt.Printf("  LogLevel:      %s\n", cfg.LogLevel)
}
```

### Обзор cobra и viper

Для сложных CLI-приложений стандартного пакета `flag` может быть недостаточно. Два самых популярных решения:

> [!summary] cobra и viper
> **cobra** — фреймворк для создания CLI-приложений с подкомандами (как `git commit`, `docker run`). Используется в kubectl, Hugo, GitHub CLI и многих других проектах.
>
> **viper** — библиотека для конфигурации, поддерживающая:
> - Чтение из JSON, YAML, TOML, .env файлов
> - Переменные окружения с префиксами
> - Флаги командной строки (интеграция с cobra)
> - Горячая перезагрузка конфигурации (watch)
> - Значения по умолчанию и приоритеты
>
> Подробное использование cobra и viper разбирается в разделах о создании production CLI-приложений.

```go
// Пример минимальной конфигурации с viper (для ознакомления):
//
// import "github.com/spf13/viper"
//
// viper.SetConfigName("config")    // Имя файла без расширения
// viper.SetConfigType("yaml")      // Тип файла
// viper.AddConfigPath(".")         // Искать конфиг в текущей директории
// viper.AddConfigPath("$HOME/.myapp") // ...и в домашней директории
//
// viper.SetDefault("port", 8080)   // Значение по умолчанию
// viper.SetEnvPrefix("MYAPP")      // Префикс для env: MYAPP_PORT
// viper.AutomaticEnv()             // Автоматически читать env
//
// err := viper.ReadInConfig()      // Прочитать файл конфигурации
// port := viper.GetInt("port")     // Получить значение
```

###### 🏠 Домашнее задание

1. Расширьте структуру `Config` полями для Redis (хост, порт, пароль, номер БД). Реализуйте загрузку из env и CLI-флагов.
2. Напишите функцию `Validate() error` для структуры Config, которая проверяет обязательные поля (например, DatabaseURL не должен быть пустым).
3. Реализуйте чтение конфигурации из JSON-файла и объединение с переменными окружения (env имеет приоритет).

---

## 10. Потоковая обработка файлов

В production-среде файлы могут весить гигабайты. Загрузка их целиком в память недопустима. Go предоставляет эффективные инструменты для потоковой обработки.

### Построчное чтение больших файлов

```go
package main

import (
	"bufio"
	"fmt"
	"os"
	"strings"
	"time"
)

// processLogFile — обработка большого лог-файла построчно
// Подсчитываем количество ошибок и предупреждений
func processLogFile(filename string) error {
	file, err := os.Open(filename)
	if err != nil {
		return fmt.Errorf("открытие файла: %w", err)
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)

	// Для очень длинных строк увеличиваем буфер
	buf := make([]byte, 0, 64*1024)
	scanner.Buffer(buf, 1024*1024) // Максимум 1MB на строку

	var (
		totalLines int
		errors     int
		warnings   int
	)

	start := time.Now()

	for scanner.Scan() {
		line := scanner.Text()
		totalLines++

		// Анализируем каждую строку
		switch {
		case strings.Contains(line, "[ERROR]"):
			errors++
		case strings.Contains(line, "[WARN]"):
			warnings++
		}

		// Прогресс каждые 100000 строк
		if totalLines%100000 == 0 {
			fmt.Printf("Обработано %d строк...\n", totalLines)
		}
	}

	if err := scanner.Err(); err != nil {
		return fmt.Errorf("ошибка чтения: %w", err)
	}

	elapsed := time.Since(start)
	fmt.Printf("Результаты обработки %s:\n", filename)
	fmt.Printf("  Всего строк:     %d\n", totalLines)
	fmt.Printf("  Ошибок (ERROR):  %d\n", errors)
	fmt.Printf("  Предупреждений:  %d\n", warnings)
	fmt.Printf("  Время обработки: %v\n", elapsed)

	return nil
}

func main() {
	if len(os.Args) < 2 {
		fmt.Println("Использование: program <файл-лога>")
		os.Exit(1)
	}
	if err := processLogFile(os.Args[1]); err != nil {
		fmt.Println("Ошибка:", err)
		os.Exit(1)
	}
}
```

### Чтение CSV-файлов

```go
package main

import (
	"encoding/csv"
	"fmt"
	"io"
	"os"
	"strconv"
)

// User — структура для данных из CSV
type User struct {
	ID    int
	Name  string
	Email string
	Age   int
}

func readUsersCSV(filename string) ([]User, error) {
	file, err := os.Open(filename)
	if err != nil {
		return nil, fmt.Errorf("открытие файла: %w", err)
	}
	defer file.Close()

	reader := csv.NewReader(file)
	reader.Comma = ','      // Разделитель (по умолчанию запятая)
	reader.Comment = '#'    // Строки начинающиеся с # будут пропущены
	reader.LazyQuotes = true // Более мягкая обработка кавычек

	// Читаем заголовок
	header, err := reader.Read()
	if err != nil {
		return nil, fmt.Errorf("чтение заголовка: %w", err)
	}
	fmt.Println("Заголовки:", header)

	var users []User

	// Читаем строки потоково (по одной)
	for {
		record, err := reader.Read()
		if err == io.EOF {
			break // Файл закончился
		}
		if err != nil {
			fmt.Printf("Ошибка чтения строки: %v, пропускаем\n", err)
			continue
		}

		// Парсим поля
		id, _ := strconv.Atoi(record[0])
		age, _ := strconv.Atoi(record[3])

		users = append(users, User{
			ID:    id,
			Name:  record[1],
			Email: record[2],
			Age:   age,
		})
	}

	return users, nil
}

// writeUsersCSV — запись данных в CSV
func writeUsersCSV(filename string, users []User) error {
	file, err := os.Create(filename)
	if err != nil {
		return fmt.Errorf("создание файла: %w", err)
	}
	defer file.Close()

	writer := csv.NewWriter(file)
	defer writer.Flush()

	// Записываем заголовок
	err = writer.Write([]string{"id", "name", "email", "age"})
	if err != nil {
		return fmt.Errorf("запись заголовка: %w", err)
	}

	// Записываем данные
	for _, u := range users {
		record := []string{
			strconv.Itoa(u.ID),
			u.Name,
			u.Email,
			strconv.Itoa(u.Age),
		}
		if err := writer.Write(record); err != nil {
			return fmt.Errorf("запись строки: %w", err)
		}
	}

	return nil
}

func main() {
	users := []User{
		{1, "Алиса", "alice@example.com", 28},
		{2, "Борис", "boris@example.com", 35},
		{3, "Виктор", "victor@example.com", 42},
	}

	err := writeUsersCSV("users.csv", users)
	if err != nil {
		fmt.Println("Ошибка записи:", err)
		return
	}
	fmt.Println("CSV-файл записан")

	// Читаем обратно
	loaded, err := readUsersCSV("users.csv")
	if err != nil {
		fmt.Println("Ошибка чтения:", err)
		return
	}
	for _, u := range loaded {
		fmt.Printf("  %d: %s (%s), возраст %d\n", u.ID, u.Name, u.Email, u.Age)
	}
}
```

### JSON-файлы: чтение и запись

```go
package main

import (
	"encoding/json"
	"fmt"
	"os"
)

// ServerConfig — конфигурация для сериализации в JSON
type ServerConfig struct {
	Host     string   `json:"host"`
	Port     int      `json:"port"`
	Debug    bool     `json:"debug"`
	AllowedOrigins []string `json:"allowed_origins"`
}

// saveJSON — запись структуры в JSON-файл с форматированием
func saveJSON(filename string, v interface{}) error {
	file, err := os.Create(filename)
	if err != nil {
		return fmt.Errorf("создание файла: %w", err)
	}
	defer file.Close()

	encoder := json.NewEncoder(file)
	encoder.SetIndent("", "  ") // Красивое форматирование с отступами
	return encoder.Encode(v)
}

// loadJSON — чтение JSON-файла в структуру
func loadJSON(filename string, v interface{}) error {
	file, err := os.Open(filename)
	if err != nil {
		return fmt.Errorf("открытие файла: %w", err)
	}
	defer file.Close()

	decoder := json.NewDecoder(file)
	decoder.DisallowUnknownFields() // Ошибка при неизвестных полях
	return decoder.Decode(v)
}

// processLargeJSON — потоковое чтение массива JSON-объектов
// Не загружает весь файл в память
func processLargeJSON(filename string) error {
	file, err := os.Open(filename)
	if err != nil {
		return err
	}
	defer file.Close()

	decoder := json.NewDecoder(file)

	// Читаем открывающую скобку массива [
	token, err := decoder.Token()
	if err != nil {
		return fmt.Errorf("чтение начала массива: %w", err)
	}
	fmt.Println("Начало:", token)

	// Читаем элементы по одному
	for decoder.More() {
		var item map[string]interface{}
		if err := decoder.Decode(&item); err != nil {
			return fmt.Errorf("декодирование элемента: %w", err)
		}
		// Обрабатываем каждый элемент
		fmt.Printf("Элемент: %v\n", item)
	}

	// Читаем закрывающую скобку ]
	token, err = decoder.Token()
	if err != nil {
		return fmt.Errorf("чтение конца массива: %w", err)
	}
	fmt.Println("Конец:", token)

	return nil
}

func main() {
	// Сохраняем конфиг
	cfg := ServerConfig{
		Host:     "0.0.0.0",
		Port:     8080,
		Debug:    true,
		AllowedOrigins: []string{"http://localhost:3000", "https://example.com"},
	}

	err := saveJSON("server_config.json", cfg)
	if err != nil {
		fmt.Println("Ошибка сохранения:", err)
		return
	}
	fmt.Println("Конфиг сохранён")

	// Загружаем конфиг
	var loaded ServerConfig
	err = loadJSON("server_config.json", &loaded)
	if err != nil {
		fmt.Println("Ошибка загрузки:", err)
		return
	}
	fmt.Printf("Загружен конфиг: %+v\n", loaded)
}
```

> [!TIP] json.Decoder vs json.Unmarshal
> `json.NewDecoder` читает JSON из потока (`io.Reader`) и подходит для файлов, HTTP-ответов и больших данных. `json.Unmarshal` работает с байтами в памяти (`[]byte`). Для файлов всегда используйте `Decoder` — это экономит память и позволяет обрабатывать данные потоково.

###### 🏠 Домашнее задание

1. Напишите программу, которая читает CSV-файл с продажами (дата, товар, количество, цена) и вычисляет: общую выручку, самый продаваемый товар, среднюю стоимость заказа.
2. Реализуйте конвертер CSV в JSON: читайте CSV построчно и записывайте массив JSON-объектов.
3. Создайте программу, которая обрабатывает лог-файл размером 1GB+ и группирует ошибки по типу. Замерьте потребление памяти.

---

## 11. embed (Go 1.16+)

Директива `//go:embed` позволяет встроить файлы прямо в бинарный файл на этапе компиляции. Это удобно для шаблонов, статических файлов, конфигураций по умолчанию и миграций БД.

```go
package main

import (
	"embed"
	"fmt"
	"io/fs"
	"net/http"
)

// === Встраивание одного файла как строки ===
//
//go:embed config.default.yaml
var defaultConfig string

// === Встраивание одного файла как байтов ===
//
//go:embed version.txt
var version []byte

// === Встраивание директории целиком ===
//
//go:embed static/*
var staticFiles embed.FS

// === Встраивание нескольких паттернов ===
//
//go:embed templates/*.html templates/*.tmpl
var templates embed.FS

// === Встраивание всех SQL-миграций ===
//
//go:embed migrations/*.sql
var migrations embed.FS

func main() {
	// Использование строковой переменной
	fmt.Println("Конфиг по умолчанию:")
	fmt.Println(defaultConfig)

	// Использование байтовой переменной
	fmt.Printf("Версия: %s\n", string(version))

	// === Чтение файла из embed.FS ===
	data, err := staticFiles.ReadFile("static/index.html")
	if err != nil {
		fmt.Println("Файл не найден:", err)
	} else {
		fmt.Println("index.html:", string(data))
	}

	// === Обход встроенных файлов ===
	fmt.Println("\nВстроенные миграции:")
	err = fs.WalkDir(migrations, ".", func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if !d.IsDir() {
			fmt.Println(" ", path)
		}
		return nil
	})
	if err != nil {
		fmt.Println("Ошибка обхода:", err)
	}

	// === HTTP-сервер для статических файлов ===
	// embed.FS реализует интерфейс fs.FS
	// Можно использовать как файловый сервер

	// Sub создаёт подсистему FS с указанным корнем
	staticFS, err := fs.Sub(staticFiles, "static")
	if err != nil {
		fmt.Println("Ошибка:", err)
		return
	}

	// http.FileServer подаёт встроенные файлы по HTTP
	http.Handle("/static/", http.StripPrefix("/static/", http.FileServer(http.FS(staticFS))))
	fmt.Println("Статические файлы доступны на /static/")

	// В production это позволяет деплоить один бинарник
	// без необходимости копировать статические файлы отдельно
}
```

> [!NOTE] Правила embed
> - Директива `//go:embed` должна быть непосредственно перед объявлением переменной
> - Переменная может быть типа `string`, `[]byte` или `embed.FS`
> - Паттерны поддерживают `*` (любые символы) и `**` (рекурсивно)
> - Скрытые файлы (начинающиеся с `.`) и директории по умолчанию пропускаются. Используйте `all:` prefix для включения: `//go:embed all:static`
> - Пути всегда относительны к директории с исходным файлом

> [!WARNING] Размер бинарника
> Встроенные файлы увеличивают размер бинарника. Не встраивайте большие файлы (видео, базы данных). Для production-приложений рассмотрите сжатие встроенных ресурсов или подгрузку из CDN.

###### 🏠 Домашнее задание

1. Создайте проект с embed.FS, который встраивает HTML-шаблон и CSS-файл, а затем подаёт их через HTTP.
2. Реализуйте систему миграций БД: встройте SQL-файлы из директории `migrations/` и выполните их в алфавитном порядке.
3. Создайте CLI-утилиту, которая при запуске с флагом `--dump-config` выводит встроенный конфиг по умолчанию, а при обычном запуске — читает конфиг из файла.

---

## 12. Сквозной проект: Todo CLI с сохранением в файл

Расширяем Todo CLI-приложение из [[01-basics]], добавляя персистентность: сохранение и загрузку задач из JSON-файла.

> [!summary] Чему мы научимся
> - Чтение и запись JSON-файлов
> - Атомарная запись (temp + rename)
> - Создание файла, если он не существует
> - Работа с флагами командной строки
> - Корректная обработка ошибок на каждом шаге
> - Организация кода для реального CLI-приложения

### Полный код приложения

```go
package main

import (
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"
)

// === Модель данных ===

// Todo — структура одной задачи
type Todo struct {
	ID        int       `json:"id"`         // Уникальный идентификатор
	Title     string    `json:"title"`       // Название задачи
	Done      bool      `json:"done"`        // Флаг выполнения
	CreatedAt time.Time `json:"created_at"`  // Время создания
	DoneAt    *time.Time `json:"done_at,omitempty"` // Время выполнения (nil если не выполнена)
}

// TodoStore — хранилище задач
type TodoStore struct {
	Todos  []Todo `json:"todos"`   // Список задач
	NextID int    `json:"next_id"` // Счётчик для генерации ID
}

// === Работа с файлами ===

// defaultFilePath возвращает путь к файлу по умолчанию
// Сохраняем в домашней директории пользователя
func defaultFilePath() string {
	home, err := os.UserHomeDir()
	if err != nil {
		// Если не удалось определить домашнюю директорию — используем текущую
		return ".todos.json"
	}
	return filepath.Join(home, ".todos.json")
}

// loadStore загружает хранилище из JSON-файла
func loadStore(filename string) (*TodoStore, error) {
	store := &TodoStore{
		Todos:  []Todo{},
		NextID: 1,
	}

	// Открываем файл
	file, err := os.Open(filename)
	if err != nil {
		// Если файл не существует — возвращаем пустое хранилище
		if errors.Is(err, os.ErrNotExist) {
			return store, nil
		}
		return nil, fmt.Errorf("открытие файла %s: %w", filename, err)
	}
	defer file.Close()

	// Проверяем, не пустой ли файл
	info, err := file.Stat()
	if err != nil {
		return nil, fmt.Errorf("stat файла: %w", err)
	}
	if info.Size() == 0 {
		return store, nil // Пустой файл — пустое хранилище
	}

	// Декодируем JSON
	decoder := json.NewDecoder(file)
	if err := decoder.Decode(store); err != nil {
		return nil, fmt.Errorf("декодирование JSON из %s: %w", filename, err)
	}

	return store, nil
}

// saveStore сохраняет хранилище в JSON-файл (атомарная запись)
func saveStore(filename string, store *TodoStore) error {
	// Сериализуем в JSON с отступами
	data, err := json.MarshalIndent(store, "", "  ")
	if err != nil {
		return fmt.Errorf("сериализация JSON: %w", err)
	}
	data = append(data, '\n') // Добавляем перевод строки в конце

	// Атомарная запись: temp файл -> rename
	dir := filepath.Dir(filename)

	// Убедимся, что директория существует
	if err := os.MkdirAll(dir, 0755); err != nil {
		return fmt.Errorf("создание директории %s: %w", dir, err)
	}

	// Создаём временный файл в той же директории
	tmpFile, err := os.CreateTemp(dir, ".todos-tmp-*.json")
	if err != nil {
		return fmt.Errorf("создание temp файла: %w", err)
	}
	tmpName := tmpFile.Name()

	// Cleanup: удаляем temp файл, если что-то пойдёт не так
	success := false
	defer func() {
		if !success {
			_ = os.Remove(tmpName)
		}
	}()

	// Записываем данные
	if _, err := tmpFile.Write(data); err != nil {
		_ = tmpFile.Close()
		return fmt.Errorf("запись данных: %w", err)
	}

	// Синхронизируем с диском
	if err := tmpFile.Sync(); err != nil {
		_ = tmpFile.Close()
		return fmt.Errorf("sync: %w", err)
	}

	// Закрываем файл
	if err := tmpFile.Close(); err != nil {
		return fmt.Errorf("закрытие temp файла: %w", err)
	}

	// Устанавливаем права
	if err := os.Chmod(tmpName, 0644); err != nil {
		return fmt.Errorf("chmod: %w", err)
	}

	// Атомарное переименование
	if err := os.Rename(tmpName, filename); err != nil {
		return fmt.Errorf("rename %s -> %s: %w", tmpName, filename, err)
	}

	success = true // Всё прошло успешно, не удаляем файл в defer
	return nil
}

// === Операции с задачами ===

// addTodo добавляет новую задачу
func addTodo(store *TodoStore, title string) Todo {
	todo := Todo{
		ID:        store.NextID,
		Title:     title,
		Done:      false,
		CreatedAt: time.Now(),
	}
	store.Todos = append(store.Todos, todo)
	store.NextID++
	return todo
}

// completeTodo отмечает задачу как выполненную
func completeTodo(store *TodoStore, id int) error {
	for i := range store.Todos {
		if store.Todos[i].ID == id {
			if store.Todos[i].Done {
				return fmt.Errorf("задача #%d уже выполнена", id)
			}
			now := time.Now()
			store.Todos[i].Done = true
			store.Todos[i].DoneAt = &now
			return nil
		}
	}
	return fmt.Errorf("задача #%d не найдена", id)
}

// deleteTodo удаляет задачу
func deleteTodo(store *TodoStore, id int) error {
	for i, todo := range store.Todos {
		if todo.ID == id {
			// Удаляем элемент из слайса
			store.Todos = append(store.Todos[:i], store.Todos[i+1:]...)
			return nil
		}
	}
	return fmt.Errorf("задача #%d не найдена", id)
}

// listTodos выводит список задач
func listTodos(store *TodoStore, showAll bool) {
	if len(store.Todos) == 0 {
		fmt.Println("Список задач пуст.")
		return
	}

	fmt.Println()
	for _, todo := range store.Todos {
		// Пропускаем выполненные, если не указан флаг --all
		if todo.Done && !showAll {
			continue
		}

		// Формируем статус
		status := "[ ]"
		if todo.Done {
			status = "[x]"
		}

		// Форматируем дату
		created := todo.CreatedAt.Format("02.01.2006 15:04")

		fmt.Printf("  %s #%d: %s (создана: %s)", status, todo.ID, todo.Title, created)

		if todo.Done && todo.DoneAt != nil {
			fmt.Printf(" (выполнена: %s)", todo.DoneAt.Format("02.01.2006 15:04"))
		}
		fmt.Println()
	}
	fmt.Println()

	// Статистика
	total := len(store.Todos)
	done := 0
	for _, t := range store.Todos {
		if t.Done {
			done++
		}
	}
	fmt.Printf("Всего: %d | Выполнено: %d | Осталось: %d\n", total, done, total-done)
}

// === Точка входа ===

func main() {
	// Определяем флаги
	filePath := flag.String("file", defaultFilePath(), "Путь к файлу с задачами")
	showAll := flag.Bool("all", false, "Показать все задачи (включая выполненные)")

	// Настраиваем Usage
	flag.Usage = func() {
		fmt.Println("Todo CLI — управление списком задач")
		fmt.Println()
		fmt.Println("Использование:")
		fmt.Println("  todo add <текст задачи>     Добавить задачу")
		fmt.Println("  todo list [--all]            Список задач")
		fmt.Println("  todo done <id>               Отметить как выполненную")
		fmt.Println("  todo delete <id>             Удалить задачу")
		fmt.Println()
		fmt.Println("Флаги:")
		flag.PrintDefaults()
	}

	flag.Parse()

	// Проверяем наличие команды
	args := flag.Args()
	if len(args) == 0 {
		flag.Usage()
		os.Exit(1)
	}

	// Загружаем хранилище
	store, err := loadStore(*filePath)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Ошибка загрузки: %v\n", err)
		os.Exit(1)
	}

	// Флаг необходимости сохранения
	needSave := false

	// Выполняем команду
	command := strings.ToLower(args[0])
	switch command {
	case "add":
		if len(args) < 2 {
			fmt.Println("Ошибка: укажите текст задачи")
			fmt.Println("Пример: todo add Купить молоко")
			os.Exit(1)
		}
		title := strings.Join(args[1:], " ")
		todo := addTodo(store, title)
		fmt.Printf("Добавлена задача #%d: %s\n", todo.ID, todo.Title)
		needSave = true

	case "list", "ls":
		listTodos(store, *showAll)

	case "done", "complete":
		if len(args) < 2 {
			fmt.Println("Ошибка: укажите ID задачи")
			fmt.Println("Пример: todo done 1")
			os.Exit(1)
		}
		id, err := strconv.Atoi(args[1])
		if err != nil {
			fmt.Printf("Ошибка: '%s' не является числом\n", args[1])
			os.Exit(1)
		}
		if err := completeTodo(store, id); err != nil {
			fmt.Printf("Ошибка: %v\n", err)
			os.Exit(1)
		}
		fmt.Printf("Задача #%d отмечена как выполненная\n", id)
		needSave = true

	case "delete", "rm":
		if len(args) < 2 {
			fmt.Println("Ошибка: укажите ID задачи")
			fmt.Println("Пример: todo delete 1")
			os.Exit(1)
		}
		id, err := strconv.Atoi(args[1])
		if err != nil {
			fmt.Printf("Ошибка: '%s' не является числом\n", args[1])
			os.Exit(1)
		}
		if err := deleteTodo(store, id); err != nil {
			fmt.Printf("Ошибка: %v\n", err)
			os.Exit(1)
		}
		fmt.Printf("Задача #%d удалена\n", id)
		needSave = true

	default:
		fmt.Printf("Неизвестная команда: %s\n", command)
		flag.Usage()
		os.Exit(1)
	}

	// Сохраняем, если были изменения
	if needSave {
		if err := saveStore(*filePath, store); err != nil {
			fmt.Fprintf(os.Stderr, "Ошибка сохранения: %v\n", err)
			os.Exit(1)
		}
	}
}
```

### Пример использования

```bash
# Добавляем задачи
$ go run main.go add Изучить пакет os
Добавлена задача #1: Изучить пакет os

$ go run main.go add Написать тесты для Todo CLI
Добавлена задача #2: Написать тесты для Todo CLI

$ go run main.go add Настроить CI/CD
Добавлена задача #3: Настроить CI/CD

# Просматриваем список
$ go run main.go list
  [ ] #1: Изучить пакет os (создана: 11.04.2026 15:30)
  [ ] #2: Написать тесты для Todo CLI (создана: 11.04.2026 15:30)
  [ ] #3: Настроить CI/CD (создана: 11.04.2026 15:31)

Всего: 3 | Выполнено: 0 | Осталось: 3

# Отмечаем задачу выполненной
$ go run main.go done 1
Задача #1 отмечена как выполненная

# Просматриваем с выполненными
$ go run main.go --all list
  [x] #1: Изучить пакет os (создана: 11.04.2026 15:30) (выполнена: 11.04.2026 15:35)
  [ ] #2: Написать тесты для Todo CLI (создана: 11.04.2026 15:30)
  [ ] #3: Настроить CI/CD (создана: 11.04.2026 15:31)

Всего: 3 | Выполнено: 1 | Осталось: 2

# Удаляем задачу
$ go run main.go delete 3
Задача #3 удалена
```

### Содержимое JSON-файла

```json
{
  "todos": [
    {
      "id": 1,
      "title": "Изучить пакет os",
      "done": true,
      "created_at": "2026-04-11T15:30:00Z",
      "done_at": "2026-04-11T15:35:00Z"
    },
    {
      "id": 2,
      "title": "Написать тесты для Todo CLI",
      "done": false,
      "created_at": "2026-04-11T15:30:00Z"
    }
  ],
  "next_id": 4
}
```

> [!NOTE] Ключевые решения в проекте
> 1. **Атомарная запись** — данные никогда не будут повреждены при аварийном завершении
> 2. **Автосоздание файла** — при первом запуске файл создаётся автоматически
> 3. **JSON с отступами** — файл можно читать и редактировать вручную
> 4. **Разделение команд** — каждая операция изолирована и тестируема
> 5. **Гибкий путь к файлу** — можно указать свой путь через флаг `--file`

###### 🏠 Домашнее задание

1. Добавьте команду `edit <id> <новый текст>` для редактирования названия задачи.
2. Реализуйте команду `search <текст>` для поиска задач по подстроке (регистронезависимый).
3. Добавьте приоритеты задач (low, medium, high) и сортировку при выводе.
4. Реализуйте экспорт задач в CSV-формат: `todo export --format csv > tasks.csv`.
5. Добавьте поддержку нескольких списков задач: `todo --list work add "Задача для работы"`.
6. Напишите юнит-тесты для функций `addTodo`, `completeTodo`, `deleteTodo`, `loadStore` и `saveStore`. Используйте `os.CreateTemp` для тестовых файлов.

---

## Итоги главы

В этой главе мы изучили ключевые инструменты Go для взаимодействия с операционной системой:

| Тема | Пакеты | Ключевые функции |
|------|--------|-----------------|
| Переменные окружения | `os` | `Getenv`, `LookupEnv`, `Setenv` |
| Работа с файлами | `os`, `io` | `ReadFile`, `WriteFile`, `Create`, `Open`, `OpenFile` |
| Директории | `os` | `Mkdir`, `MkdirAll`, `ReadDir`, `Stat` |
| Буферизованный I/O | `bufio` | `Scanner`, `NewWriter`, `NewReader` |
| Пути | `path/filepath` | `Join`, `WalkDir`, `Glob`, `Abs` |
| Процессы | `os/exec` | `Command`, `Run`, `Output`, `CommandContext` |
| Сигналы | `os/signal` | `Notify`, `NotifyContext` |
| Временные файлы | `os` | `CreateTemp`, `MkdirTemp` |
| Конфигурация | `flag` | `String`, `Int`, `Bool`, `Parse` |
| CSV/JSON обработка | `encoding/csv`, `encoding/json` | `NewReader`, `NewDecoder`, `Encode` |
| Встраивание файлов | `embed` | `//go:embed`, `embed.FS` |

> [!summary] Что дальше
> В [[03-networking]] мы изучим сетевое программирование: HTTP-серверы и клиенты, работу с TCP/UDP, WebSocket, а также пакеты `net/http`, `net` и популярные фреймворки. Многие паттерны из этой главы (io.Reader/Writer, bufio, context) будут активно использоваться при обработке сетевых запросов.
