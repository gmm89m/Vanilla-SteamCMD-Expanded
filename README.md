# VSE — Vanilla SteamCMD Expanded

> A mod download utility for RimWorld with SteamCMD integration, multi-profile support, and a web-based interface.
>
> Утилита для скачивания модов RimWorld с интеграцией SteamCMD, поддержкой профилей и веб-интерфейсом.

![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)
![Flask](https://img.shields.io/badge/Flask-3.x-green.svg)
![License](https://img.shields.io/badge/license-MIT-yellow.svg)

---

[English](#english) · [Русский](#русский)

---

## English

### What is this?

**VSE — Vanilla SteamCMD Expanded** automates the tedious parts of mod management: downloading mods via SteamCMD, organizing them into the right folder, keeping them updated, and switching between different mod profiles. It runs as a local web app with an optional PyWebview window — no browser configuration needed.

### Features

- Add mods by Workshop URL or paste an entire collection link
- Download mods by splitting them into configurable batches (e.g., 50 mods per batch) via SteamCMD.
- Check installed mods for updates against the Steam API
- Multiple profiles — manage different AppIDs or mod sets independently
- Export and import mod lists as plain-text files (easy to share or version-control)
- Trash bin — deleted mods can be restored
- Workshop Browser — a separate companion window for browsing and adding mods without leaving the app

### Installation

**Prerequisites:** Python 3.8+, SteamCMD installed and accessible.

```bash
pip install flask requests pywebview
```

### Running from source

```bash
python web_app.py
```

The app will open in your default browser or in a PyWebview window.

### Building a standalone executable

```bash
pip install pyinstaller
build.bat
```

Output in `dist/VSE/`:

| File | Description |
|------|-------------|
| `VSE.exe` | Main application |
| `WorkshopBrowser.exe` | Companion browser window |
| `python3xx.dll` | Required runtime dependency |

### Project structure

```
project/
├── core/
│   ├── config.py           # JSON config, multi-profile system
│   ├── state.py            # Log buffer, busy flag, run_bg()
│   ├── steam_api.py        # Steam Web API (fetch_mod_info, fetch_collection)
│   ├── steamcmd.py         # SteamCMD launcher, progress events
│   ├── dialogs.py          # Native dialogs (pywebview + tkinter fallback)
│   ├── utils.py            # parse_ids, identify_ids, fmt_size
│   └── workshop_browser.py # Launches WorkshopBrowser.exe / workshop_window.py
├── routes/
│   ├── system.py           # SSE log, /api/status, browse
│   ├── config_routes.py    # GET/POST /api/config, GET /api/lang-files
│   ├── mods.py             # All mod operations
│   ├── importexport.py     # Export/import mod lists
│   ├── trash.py            # Trash bin
│   ├── workshop.py         # /api/add-from-url (with is_collection flag)
│   ├── setup.py            # First-run wizard
│   └── profiles.py         # Profile CRUD, /api/profiles/app-info
├── web_static/
│   ├── index.html          # Single-page frontend
│   └── js/
│       ├── i18n.js         # Locale loader
│       ├── api.js          # Fetch wrapper, SSE, progress events
│       ├── profiles.js     # Profile selector, edit modal
│       ├── mods.js         # Mod list, download progress bar
│       ├── workshop.js     # Workshop helpers
│       ├── trash.js        # Trash bin UI
│       ├── settings.js     # Auto-save settings
│       └── main.js         # Init, navigation
├── lang/
│   └── lots of localisations               # window.RIMMOD_LOCALE = { ... }
├── web_app.py              # Flask app, blueprint registration
├── workshop_window.py      # Standalone Workshop browser window
├── hook_dll_fix.py         # PyInstaller DLL fix
├── rimmod.spec             # PyInstaller spec (two executables)
├── build.bat               # Build script
└── requirements.txt
```

### Configuration

**Global** (`scmdmm_config.json`):

| Key | Default | Description |
|-----|---------|-------------|
| `steamcmd_path` | — | Path to `SteamCMD.exe` |
| `language` | `en` | Interface language |
| `require_backup` | `true` | Create a backup before each download |

**Per-profile** (`profiles/*.json`):

| Key | Description |
|-----|-------------|
| `app_id` | Steam AppID of the target game (RimWorld: `294100`) |
| `mods_dir` | Absolute path to the mods folder |

### Mod list format

```
# RimMod Manager — Mod List
# Profile: MyProfile
# AppID: 294100
# Date: 2025-01-15

[mods]
123456789 # Mod Name
```

### Tips

- Keep all paths in English — Cyrillic or special characters in paths can cause SteamCMD to fail.
- Install SteamCMD in its default location to avoid manual path configuration.

### License

[MIT](LICENSE) — do whatever you want with it.

---

## Русский

### Что это?

**VSE — Vanilla SteamCMD Expanded** автоматизирует управление модами: скачивает их через SteamCMD, раскладывает по нужным папкам, проверяет обновления и позволяет переключаться между разными наборами модов. Работает как локальное веб-приложение — открывается прямо в браузере или через встроенное окно PyWebview.

### Возможности

- Добавление модов по ссылке на Workshop или на целую коллекцию
- Загрузка модов с разделением на настраиваемые пакеты (например, по 50 модов за раз) через SteamCMD.
- Проверка установленных модов на обновления через Steam API
- Несколько профилей — независимое управление разными AppID или наборами модов
- Экспорт и импорт списков модов в виде текстовых файлов (удобно для шаринга и версионирования)
- Корзина — удалённые моды можно восстановить
- Workshop Browser — отдельное окно для просмотра и добавления модов прямо из интерфейса

### Установка

**Требования:** Python 3.8+, установленный SteamCMD.

```bash
pip install flask requests pywebview
```

### Запуск из исходников

```bash
python web_app.py
```

Приложение откроется в браузере или в окне PyWebview.

### Сборка исполняемого файла

```bash
pip install pyinstaller
build.bat
```

Результат в `dist/VSE/`:

| Файл | Описание |
|------|----------|
| `VSE.exe` | Основное приложение |
| `WorkshopBrowser.exe` | Окно браузера Workshop |
| `python3xx.dll` | Необходимая runtime-зависимость |

### Структура проекта

```
проект/
├── core/
│   ├── config.py           # JSON-конфиг, мультипрофильная система
│   ├── state.py            # Лог-буфер, busy-флаг, run_bg()
│   ├── steam_api.py        # Steam Web API (fetch_mod_info, fetch_collection)
│   ├── steamcmd.py         # Запуск SteamCMD, прогресс-события
│   ├── dialogs.py          # Нативные диалоги (pywebview + tkinter fallback)
│   ├── utils.py            # parse_ids, identify_ids, fmt_size
│   └── workshop_browser.py # Запуск WorkshopBrowser.exe / workshop_window.py
├── routes/
│   ├── system.py           # SSE лог, /api/status, browse
│   ├── config_routes.py    # GET/POST /api/config, GET /api/lang-files
│   ├── mods.py             # Все операции с модами
│   ├── importexport.py     # Экспорт/импорт списков модов
│   ├── trash.py            # Корзина
│   ├── workshop.py         # /api/add-from-url (флаг is_collection)
│   ├── setup.py            # Мастер первого запуска
│   └── profiles.py         # CRUD профилей, /api/profiles/app-info
├── web_static/
│   ├── index.html          # Единственный HTML-файл
│   └── js/
│       ├── i18n.js         # Загрузчик локалей
│       ├── api.js          # Fetch wrapper, SSE, прогресс-события
│       ├── profiles.js     # Селектор профилей, модал редактирования
│       ├── mods.js         # Список модов, прогресс-бар загрузки
│       ├── workshop.js     # Вспомогательные функции Workshop
│       ├── trash.js        # Корзина
│       ├── settings.js     # Автосохранение настроек
│       └── main.js         # Инициализация, навигация
├── lang/
│   └── много-много локализаций
├── web_app.py              # Flask app, регистрация blueprints
├── workshop_window.py      # Отдельное окно Workshop
├── hook_dll_fix.py         # PyInstaller DLL fix
├── rimmod.spec             # PyInstaller spec (два exe)
├── build.bat               # Скрипт сборки
└── requirements.txt
```

### Настройки

**Глобальные** (`scmdmm_config.json`):

| Ключ | По умолчанию | Описание |
|------|-------------|----------|
| `steamcmd_path` | — | Путь к `SteamCMD.exe` |
| `language` | `en` | Язык интерфейса |
| `require_backup` | `true` | Создавать резервную копию перед загрузкой |

**Профильные** (`profiles/*.json`):

| Ключ | Описание |
|------|----------|
| `app_id` | Steam AppID игры (RimWorld: `294100`) |
| `mods_dir` | Абсолютный путь к папке с модами |

### Формат списка модов

```
# RimMod Manager — Mod List
# Profile: MyProfile
# AppID: 294100
# Date: 2025-01-15

[mods]
123456789 # Название мода
```

### Советы

- Держите все пути на английском языке — кириллица и спецсимволы в путях могут привести к ошибкам SteamCMD.
- Устанавливайте SteamCMD в стандартное расположение, чтобы не настраивать путь вручную.

### Лицензия

[MIT](LICENSE) — делайте что хотите.
