# Speech Recognition Service

Сервис распознавания речи на основе FastAPI и faster-whisper large-v3 turbo модели. Поддерживает аудио файлы с частотой дискретизации 8kHz и 16kHz.

## Возможности

- 🎤 **Распознавание речи** с использованием faster-whisper large-v3 turbo
- 📁 **Поддержка множественных форматов**: MP3, WAV, M4A, FLAC, OGG, AAC, WMA
- 🔄 **Пакетная обработка** нескольких аудио файлов одновременно
- 🌐 **Обработка по URL** - загрузка и обработка аудио с веб-ссылок
- ⏱️ **Временные метки** на уровне слов и сегментов
- 🌍 **Автоопределение языка** и поддержка перевода
- 📊 **Детальная информация** об аудио файлах
- 🚀 **Высокая производительность** с поддержкой GPU
- 📝 **Суммаризация стенограмм** через Ollama и модель Gemma 3 27B

## Установка

### Требования

- Python 3.10+
- CUDA (опционально, для GPU ускорения)

### Установка зависимостей

```bash
cd backend
pip install -r requirements.txt
```

### Установка faster-whisper

```bash
# Для CPU
pip install faster-whisper

# Для GPU (CUDA)
pip install faster-whisper[gpu]
```

## Запуск

### Разработка

```bash
cd backend
python -m app.main
```

### Продакшн

```bash
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 1
```

### С переменными окружения

```bash
export HOST=0.0.0.0
export PORT=8000
export WORKERS=1
export LOG_LEVEL=info
export MODEL_SIZE=large-v3
export DEVICE=auto
export COMPUTE_TYPE=auto

python -m app.main
```

## API Документация

После запуска сервиса документация доступна по адресам:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Использование

### 1. Проверка состояния сервиса

```bash
curl http://localhost:8000/api/v1/health
```

### 2. Распознавание одного файла

```bash
# Минимальный запрос (только файл)
curl -X POST "http://localhost:8000/api/v1/transcribe" \
  -F "file=@audio.mp3"

# С указанием языка
curl -X POST "http://localhost:8000/api/v1/transcribe" \
  -F "file=@audio.mp3" \
  -F "language=ru"

# С временными метками слов
curl -X POST "http://localhost:8000/api/v1/transcribe" \
  -F "file=@audio.mp3" \
  -F "language=ru" \
  -F "word_timestamps=true"
```

### 3. Пакетная обработка

```bash
# Несколько файлов
curl -X POST "http://localhost:8000/api/v1/transcribe/batch" \
  -F "files=@audio1.mp3" \
  -F "files=@audio2.wav" \
  -F "files=@audio3.m4a"

# С параметрами
curl -X POST "http://localhost:8000/api/v1/transcribe/batch" \
  -F "files=@audio1.mp3" \
  -F "files=@audio2.wav" \
  -F "language=ru" \
  -F "word_timestamps=true"
```

### 4. Обработка по URL

```bash
# Базовый запрос
curl -X POST "http://localhost:8000/api/v1/transcribe/url" \
  -d "url=https://example.com/audio.mp3"

# С параметрами
curl -X POST "http://localhost:8000/api/v1/transcribe/url" \
  -d "url=https://example.com/audio.mp3&language=ru&word_timestamps=true"
```

### 5. Суммаризация текста

```bash
curl -X POST "http://localhost:8000/api/v1/summarize" \
  -H "Content-Type: application/json" \
  -d '{
        "text": "...ваша расшифровка разговора...",
        "focus": "ключевые договорённости и следующие шаги",
        "format": "bullet"
      }'
```

Проверить доступность бэкенда суммаризации можно запросом:

```bash
curl http://localhost:8000/api/v1/summarize/health
```

⚠️ Убедитесь, что локально установлен Ollama и загружена модель `gemma3:27b`:

```bash
ollama pull gemma3:27b
```

## Параметры API

### Основные параметры

| Параметр | Описание | По умолчанию | Обязательный |
|----------|----------|--------------|--------------|
| `file` | Аудио файл для распознавания | - | ✅ |
| `language` | Код языка (ru, en, auto) | auto | ❌ |
| `task` | Тип задачи (transcribe/translate) | transcribe | ❌ |
| `word_timestamps` | Временные метки слов | false | ❌ |
| `initial_prompt` | Начальная подсказка для модели | - | ❌ |

### Параметры конфигурации (в config.py)

Все остальные параметры Whisper настраиваются через конфигурационный файл:

| Параметр | Описание | По умолчанию |
|----------|----------|--------------|
| `beam_size` | Размер луча для поиска | 5 |
| `best_of` | Количество кандидатов | 5 |
| `temperature` | Температура сэмплирования | 0.0 |
| `vad_filter` | Фильтр VAD | true |
| `compression_ratio_threshold` | Порог сжатия | 2.4 |
| `log_prob_threshold` | Порог логарифма вероятности | -1.0 |
| `no_speech_threshold` | Порог отсутствия речи | 0.6 |
| `summarization_required` | Прерывать запуск при недоступной LLM-суммаризации | false |
| `summarization_timeout` | Таймаут ожидания ответа от сервиса суммаризации (сек) | 300 |

Настройки сервиса суммаризации задаются переменными окружения `OLLAMA_BASE_URL`, `SUMMARIZATION_MODEL`, `SUMMARIZATION_MAX_TOKENS`, `SUMMARIZATION_TEMPERATURE` и др. (см. `app/config.py`).

## Поддерживаемые форматы

### Аудио форматы
- MP3 (.mp3)
- WAV (.wav)
- M4A (.m4a)
- FLAC (.flac)
- OGG (.ogg)
- AAC (.aac)
- WMA (.wma)

### Частота дискретизации
- 8 kHz
- 16 kHz
- 22.05 kHz
- 44.1 kHz
- 48 kHz

## Структура проекта

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 # Главный файл приложения
│   ├── config.py               # Конфигурация
│   ├── models.py               # Pydantic модели
│   ├── exceptions.py           # Пользовательские исключения
│   ├── utils.py                # Утилиты
│   ├── whisper_service.py      # Сервис Whisper
│   ├── summarization_service.py# Сервис суммаризации Ollama
│   └── api/
│       ├── __init__.py
│       ├── transcription.py    # API endpoints для распознавания
│       └── summarization.py    # API endpoints для суммаризации
├── requirements.txt
└── README.md
```

## Переменные окружения

```bash
# Сервер
HOST=0.0.0.0
PORT=8000
WORKERS=1
LOG_LEVEL=info

# Модель
MODEL_SIZE=large-v3
DEVICE=auto
COMPUTE_TYPE=auto

# Файлы
MAX_FILE_SIZE=104857600  # 100MB
MAX_BATCH_FILES=10
TEMP_DIR=/tmp/speech_recognition

# CORS
CORS_ORIGINS=["*"]
CORS_ALLOW_CREDENTIALS=true
CORS_ALLOW_METHODS=["*"]
CORS_ALLOW_HEADERS=["*"]

# Суммаризация
OLLAMA_BASE_URL=http://localhost:11434
SUMMARIZATION_MODEL=gemma3:27b
SUMMARIZATION_MAX_TOKENS=512
SUMMARIZATION_TEMPERATURE=0.3
```

## Примеры ответов

### Успешное распознавание

```json
{
  "text": "Привет, как дела?",
  "language": "ru",
  "duration": 2.5,
  "segments": [
    {
      "id": 0,
      "start": 0.0,
      "end": 2.5,
      "text": "Привет, как дела?",
      "tokens": [1234, 5678, 9012],
      "temperature": 0.0,
      "avg_logprob": -0.5,
      "compression_ratio": 1.2,
      "no_speech_prob": 0.1
    }
  ],
  "words": [
    {
      "start": 0.0,
      "end": 0.5,
      "word": "Привет",
      "probability": 0.95
    },
    {
      "start": 0.6,
      "end": 1.0,
      "word": "как",
      "probability": 0.92
    }
  ]
}
```

### Пакетная обработка

```json
{
  "results": [
    {
      "text": "Первый файл",
      "language": "ru",
      "duration": 1.0
    },
    {
      "text": "Второй файл",
      "language": "ru",
      "duration": 1.5
    }
  ],
  "total_files": 2,
  "successful_files": 2,
  "failed_files": 0,
  "errors": []
}
```

## Производительность

### Рекомендации

1. **GPU ускорение**: Используйте CUDA для значительного ускорения
2. **Размер файлов**: Ограничьте размер файлов до 100MB
3. **Пакетная обработка**: Используйте для множественных файлов
4. **Частота дискретизации**: 16kHz оптимальна для большинства случаев

### Примерные времена обработки

| Длительность | CPU (Intel i7) | GPU (RTX 3080) |
|--------------|----------------|----------------|
| 1 минута     | ~30 секунд     | ~5 секунд      |
| 5 минут      | ~2.5 минуты    | ~25 секунд     |
| 10 минут     | ~5 минут       | ~50 секунд     |

## Устранение неполадок

### Частые проблемы

1. **Модель не загружается**
   - Проверьте доступность CUDA
   - Убедитесь в наличии свободного места на диске

2. **Ошибки обработки аудио**
   - Проверьте формат файла
   - Убедитесь в корректности файла

3. **Медленная обработка**
   - Используйте GPU
   - Уменьшите размер файлов
   - Настройте параметры модели

### Логи

Логи сохраняются в файл `speech_recognition.log` и выводятся в консоль.

## Лицензия

MIT License
