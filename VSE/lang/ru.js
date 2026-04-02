// lang/ru.js — Russian locale for Vanilla SteamCMD Expanded
// Чтобы создать новый язык: скопируй этот файл, переименуй (например de.js), переведи значения.
// Строки с параметрами используют стрелочные функции: (n) => `Удалить ${n} модов`
// Ключи лог-сообщений (log_*) используются бэкендом через SSE и переводятся через tLog().

window.RIMMOD_LOCALE = {
    // ── Profile modal ──────────────────────────────────────────────
    pm_title_edit:     "Редактировать профиль",
    pm_title_new:      "Добавить игру",

    // ── Warning banner ─────────────────────────────────────────────
    warn_no_steamcmd:   "Путь к SteamCMD не указан или SteamCMD не установлен — скачивание модов не будет работать.",
    warn_go_settings:   "Перейти в настройки →",

    // ── Sidebar ────────────────────────────────────────────────────
    nav_mods:     "Моды",
    nav_trash:    "Корзина",
    nav_settings: "Настройки",
    status_ready: "Готово",

    // ── Mods page buttons ──────────────────────────────────────────
    btn_check_updates:   "Проверить обновления",
    btn_update_outdated: "Обновить выбранные",
    btn_download:        "Скачать",
    btn_workshop:        "Workshop Browser",
    btn_add_mod:         "+ Добавить мод",
    btn_export:          "Экспорт",
    btn_import:          "Импорт",
    btn_sel_all:         "Все",
    btn_sel_none:        "Снять",
    btn_delete:          "Удалить",
    btn_sel_section:     "Выделить",
    btn_desel_section:   "Снять",

    // ── Mod list ───────────────────────────────────────────────────
    search_placeholder:  "Поиск модов…",
    mod_list_empty:      "Список модов пуст",
    mod_list_no_results: "Ничего не найдено",
    status_installed:    "✓ Установлен",
    status_update:       "↑ Обновление",
    status_pending:      "↓ В очереди",
    tip_copy_link:       "ЛКМ — скопировать ссылку Workshop\nПКМ — открыть в браузере",
    tip_open_folder:     "Открыть локальную папку",
    tip_delete:          "Удалить",
    section_installed:   "Установленные",
    section_outdated:    "Устарело",
    section_queued:      "Очередь загрузки",

    // ── Status bar ─────────────────────────────────────────────────
    st_checking:     "Проверка обновлений",
    st_check_done:   "Проверка завершена",
    st_updating:     "Обновление модов…",
    st_update_done:  "Обновление завершено",
    st_working:      "Работаю…",
    st_stopping:     "Завершаю текущий пакет…",
    st_saved:        "Сохранено ✓",

    // ── Confirms / alerts ──────────────────────────────────────────
    confirm_delete_one:  "Удалить этот мод?",
    confirm_delete_many: (n) => `Удалить ${n} мод(ов)?`,
    confirm_update_many: (n) => `Обновить ${n} мод(ов)?`,
    alert_select_mods:        "Выберите моды",
    alert_no_updates_sel:     "Среди выделенных нет модов с обновлением",
    alert_no_updates:         "Нет модов, требующих обновления",
    alert_select_to_check:    "Выберите моды для проверки обновлений",
    check_scope:     (n) => `Проверка ${n} выделенных…`,
    check_scope_all: "Проверка всех модов…",

    // ── Add modal ──────────────────────────────────────────────────
    modal_add_title:   "Добавить моды",
    modal_add_hint:    "Вставьте ссылки Workshop, ID модов или коллекций — программа разберёт сама.",
    modal_add_ph:      "https://steamcommunity.com/sharedfiles/filedetails/?id=818773962\n818773962  2009463077",
    modal_add_cancel:  "Отмена",
    modal_add_confirm: "Добавить",

    // ── Trash ──────────────────────────────────────────────────────
    trash_title:     "Корзина",
    trash_empty:     "Корзина пуста.",
    btn_restore:     "Восстановить",
    btn_delete_perm: "Удалить",

    // ── Settings ───────────────────────────────────────────────────
    settings_title:       "Настройки",
    settings_steamcmd:    "SteamCMD путь",
    settings_steamcmd_ph: "…/SteamCMD/steamcmd.exe",
    settings_modsdir:     "Папка RimWorld Mods",
    settings_modsdir_ph:  "…/RimWorld/Mods",
    settings_login:       "Steam логин",
    settings_backup:      "ZIP-бэкап перед детекцией модов",
    settings_browse:      "Выбрать…",
    btn_save:             "Сохранить настройки",
    btn_reinstall_steamcmd: "Переустановить / Обновить SteamCMD",
    btn_detect:           "Найти установленные моды",
    btn_wizard:           "Мастер настройки",
    settings_quickstart:  "<b>Что означают эти настройки</b><br>" +
                          "<b>SteamCMD путь</b> – исполняемый файл steamcmd.exe. Без него скачивание модов невозможно.<br>" +
                          "<b>Переустановить / Обновить SteamCMD</b> – автоматически скачать свежую версию в ту же папку.<br>" +
                          "<b>Макс. модов за один пакет SteamCMD</b> – сколько модов SteamCMD обрабатывает за один запуск. " +
                          "Чем больше число, тем быстрее загрузка, но прерывание операции скачивания затруднено и стабильность - не гарантирована. Рекомендуется 10–20, не больше 50.<br>" +
                          "<b>ZIP-бэкап перед детекцией</b> – при активации этой опции и последующем нажатии «Detect» (на странице «Моды») будет создана резервная копия всей папки Mods.<br>" +
                          "<b>Язык</b> – меняет язык интерфейса.<br><br>" +
                          "Все изменения сохраняются автоматически, как только вы переключаетесь на другой элемент.",
    settings_language:    "Язык",

    // ── Log messages ───────────────────────────────────────────────
    log_fetching_info:        (n)    => `🔍 Получаю информацию о ${n} мод(е/ах)…`,
    log_added_mods:           (n)    => `✅ Добавлено ${n} мод(ов)`,
    log_loading_collection:   (id)   => `📚 Загружаю коллекцию ${id}…`,
    log_collection_empty:     ()     => `  ⚠ Коллекция пуста или не найдена`,
    log_collection_count:     (n)    => `  → ${n} модов в коллекции`,
    log_added_from_collection:(n)    => `✅ Добавлено ${n} модов из коллекции`,
    log_warning:              (msg)  => `⚠ ${msg}`,
    log_no_mods_to_check:     ()     => `Нет модов для проверки`,
    log_checking_updates:     (n)    => `🔍 Проверка обновлений ${n} мод(а/ов)…`,
    log_update_available:     (name) => `  ↑ Обновление доступно: ${name}`,
    log_updates_found:        (n)    => `✅ Найдено ${n} обновлений`,
    log_all_up_to_date:       ()     => `✅ Все проверенные моды актуальны`,
    log_updating:             (n)    => `⬆ Обновление ${n} мод(а/ов)…`,
    log_update_complete:      ()     => `✅ Обновление завершено`,
    log_update_failed:        ()     => `❌ Ошибка обновления`,
    log_mods_dir_missing:     ()     => `❌ Папка модов не указана или не существует`,
    log_creating_backup:      (name) => `📦 Создаю резервную копию: ${name}…`,
    log_backup_done:          ()     => `  ✅ Резерв создан`,
    log_backup_failed:        (err)  => `  ❌ Ошибка резервного копирования: ${err}`,
    log_found_folders:        (n)    => `  Найдено папок модов: ${n}`,
    log_all_already_listed:   ()     => `✅ Все моды уже в списке`,
    log_new_fetching:         (n)    => `  ${n} новых — запрашиваю Steam API…`,
    log_detect_done:          (n)    => `✅ Добавлено ${n} установленных модов`,

    log_progress_download:    (n, t) => `↓ ${n}/${t}`,
    log_progress_move:        (n, t) => `→ ${n}/${t}`,

    // steamcmd.py
    log_steamcmd_not_found:   ()           => `❌ SteamCMD не найден — укажи путь в Настройках`,
    log_steamcmd_start:       (n, dir)     => `▶ SteamCMD: ${n} мод(а/ов) → ${dir}`,
    log_steamcmd_exit_code:   (code)       => `❌ SteamCMD завершился с кодом ${code}`,
    log_steamcmd_error:       (err)        => `❌ ${err}`,
    log_moving_mods:          ()           => `📁 Перемещаем моды…`,
    log_moved_ok:             (mid)        => `  ✓ ${mid}`,
    log_moved_err:            (mid, err)   => `  ⚠ ${mid}: ${err}`,
    log_moved_missing:        (mid)        => `  ⚠ ${mid}: не найдено в папке загрузки`,
    log_moved_summary:        (n, total)   => `✅ Перемещено ${n}/${total}`,

    // workshop_browser.py
    log_workshop_script_missing: () => `❌ workshop_window.py не найден`,
    log_workshop_opened:         () => `🌐 Workshop Браузер открыт в отдельном окне`,

    // importexport.py
    log_export_done:      (n, path)        => `📤 Экспортировано ${n} модов → ${path}`,
    log_import_empty:     ()               => `⚠ В файле не найдено модов`,
    log_import_all_exist: (n)              => `✅ Все ${n} модов уже в списке`,
    log_import_fetching:  (newN, totalN)   => `📥 Импорт: ${newN} новых из ${totalN} — запрашиваю Steam API…`,
    log_import_done:      (n)              => `✅ Импортировано ${n} модов`,
  
    // ── Delete confirm modal ──────────────────────────────────────────────────
    confirm_delete_title:    "Подтверждение удаления",
    confirm_delete_one_named: "Удалить мод",
    confirm_delete_many_q:   "Удалить моды:",


    // ── Guide modal ───────────────────────────────────────────────────────────
    guide_title:          "Как пользоваться Vanilla SteamCMD Expanded",
    guide_close:          "Понятно!",
    guide_start_title:    "Быстрый старт",
    guide_start_1:        "Откройте <b>Настройки</b> → укажите путь к SteamCMD и размер пакета, так же можете переустановить SteamCMD.",
    guide_start_2:        "Нажмите <b>🔍 Найти установленные моды</b> – программа просканирует папку Mods и добавит установленные моды в список.",
    guide_start_3:        "Выберите моды → нажмите <b>⬇ Скачать</b>. SteamCMD скачает их пакетами (размер задаётся в настройках).",
    guide_buttons_title:  "Кнопки на странице модов",
    guide_btn_check:      "<b>🔄 Проверить обновления</b> – сравнивает дату создания установленных модов с последней датой обновления их же в Steam Workshop.<br><i>Работает только с выбранными модами – сначала отметьте нужные.</i>",
    guide_btn_update:     "<b>⬆ Обновить выбранные</b> – перекачивает моды с пометкой <b>↑ Обновление</b>. Предварительно выделите их.",
    guide_btn_download:   "<b>⬇ Скачать</b> – загружает выбранные моды, которые ещё не установлены или устарели (обновляет выбранные).",
    guide_btn_workshop:   "<b>🌐 Workshop Browser</b> – открывает Steam Workshop с тулбаром. Нажмите <b>➕ Add mod</b> или <b>📚 Add collection</b>.",
    guide_btn_add:        "<b>+ Добавить мод</b> – вставьте ссылки Workshop, ID модов или URL коллекций. Названия подтянутся из Steam автоматически.",
    guide_btn_export:     "<b>📤 Экспорт</b> – сохраняет выбранные моды (или все, если ничего не выбрано) и профиль в .txt файл.",
    guide_btn_import:     "<b>📥 Импорт</b> – загружает список модов из .txt файла. Уже существующие пропускаются.",
    guide_workshop_title: "Детали Workshop Browser",
    guide_ws_1:           "Нажмите <b>🌐 Workshop Browser</b> – откроется отдельное окно с Workshop активного профиля.",
    guide_ws_2:           "На странице любого мода нажмите <b>➕ Add mod</b> в тулбаре – главное окно обновится автоматически.",
    guide_ws_3:           "На странице коллекции нажмите <b>📚 Add collection</b> – все моды коллекции добавятся сразу.",
    guide_ws_4:           "Используйте кнопку <b>⚠️</b>, если страница распозналась неверно (принудительно добавит как один мод).",
    guide_tips_title:     "Дополнительные возможности",
    guide_tips:           "<b>Профили</b> – управляйте несколькими играми через выпадающий список в сайдбаре. Создавайте/редактируйте кнопками <b>+</b> и <b>⚙</b>.<br>" +
                          "<b>Корзина</b> – удалённые моды попадают в корзину (с поиском) и восстанавливаются в любой момент.<br>" +
                          "<b>Импорт полного профиля</b> – в окне редактирования/создания профиля нажмите <b>📥 Импорт из файла</b>, чтобы загрузить имя, AppID и моды.<br>" +
                          "<b>Кнопка 📁</b> – открывает локальную папку мода.<br>" +
                          "<b>Кнопка 🔗</b> – левый клик копирует ссылку Workshop, правый – открывает в браузере.<br>" +
                          "<b>Категории</b> – клик для сворачивания/разворачивания, кнопки All/None выделяют моды внутри секции.<br>" +
                          "<b>Shift+клик</b> – выделяет диапазон модов.",
    // ── First-run wizard ──────────────────────────────────────────
    wizard_title:          "Добро пожаловать в Vanilla SteamCMD Expanded",
    wizard_step:           (n, t) => `Шаг ${n} из ${t}`,
    wizard_btn_next:       "Далее →",
    wizard_btn_back:       "← Назад",
    wizard_btn_finish:     "Готово",
    wizard_btn_skip:       "Пропустить",

    wizard_btn_cancel:     "Отмена",

    // Profile wizard
    wizard_profile_title:      "Добавить игру",
    profile_edit_title:        "Редактировать профиль",
    wizard_profile_sub:        "Введите Steam App ID и название для профиля этой игры.",
    wizard_profile_name_label: "Название профиля",
    wizard_profile_name_ph:    "например RimWorld",
    wizard_appid_label:        "Steam App ID",
    wizard_appid_checking:     "Проверяю…",
    wizard_appid_notfound:     "Приложение не найдено",


    wizard_lang_title:     "Выберите язык",
    wizard_lang_sub:       "Можно изменить позже в Настройках.",

    // Step 2 — mods folder
    wizard_mods_title:     "Папка Mods RimWorld",
    wizard_mods_sub:       "Укажи папку Mods внутри установки RimWorld.",
    wizard_mods_ph:        "…/RimWorld/Mods",
    wizard_mods_browse:    "Выбрать…",
    wizard_mods_detect:    "Автоматически обнаружить установленные моды",
    wizard_mods_backup:    "Создать ZIP-бэкап перед обнаружением",

    // Step 3 — SteamCMD
    wizard_scmd_title:     "SteamCMD",
    wizard_scmd_sub:       "SteamCMD необходим для скачивания и обновления модов.",
    wizard_scmd_opt_dl:    "Скачать автоматически",
    wizard_scmd_opt_pick:  "У меня уже есть — выбрать файл",
    wizard_scmd_dir_label: "Установить в папку:",
    wizard_scmd_dir_ph:    "Папка установки",
    wizard_scmd_dir_browse:"Выбрать…",
    wizard_scmd_skip:      "Пропустить",
    wizard_scmd_downloading:"Скачиваю SteamCMD…",
    wizard_scmd_wait:      "Пожалуйста подождите, это может занять некоторое время.",

    // Step 5 — done
    wizard_done_title:     "Всё готово!",
    wizard_done_sub:       "RimMod Lite готов к работе. Выберите что делать дальше:",
    wizard_done_guide:     "Быстрый гайд",
    wizard_done_settings:  "Перейти в настройки",
    wizard_done_close:     "Закрыть",

    // Setup log keys
    log_setup_downloading:      () => "⬇ Скачиваю SteamCMD…",
    log_setup_progress:         (p) => `  ${p}%`,
    log_setup_extracting:       () => "📦 Распаковываю…",
    log_setup_steamcmd_done:    (p) => `✅ SteamCMD установлен: ${p}`,
    log_setup_steamcmd_missing: () => "❌ steamcmd.exe не найден после распаковки",
    log_setup_download_err:     (e) => `❌ Ошибка загрузки: ${e}`,
    log_setup_extract_err:      (e) => `❌ Ошибка распаковки: ${e}`,
    log_setup_mkdir_err:        (e) => `❌ Не удалось создать папку: ${e}`,

    // ── Batch size setting ────────────────────────────────────────────────────
    settings_batch_size:      "Макс. модов за один пакет SteamCMD",

    // ── Progress bar ──────────────────────────────────────────────────────────
    dl_bar_label:             "Скачивание",
    dl_bar_stop:              "Стоп",

    // ── Trash search ──────────────────────────────────────────────────────────
    trash_search_ph:          "Поиск в корзине…",

    // ── Profile import ────────────────────────────────────────────────────────
    profile_import_btn:       "Импорт из файла",
    profile_import_hint:      (n) => `${n} модов будут добавлены при сохранении`,
    profile_import_failed:    "Ошибка импорта",

};
