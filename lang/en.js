// lang/en.js — English locale for Vanilla SteamCMD Expanded
// To create a new language: copy this file, rename it (e.g. de.js), translate the values.
// String keys with parameters use arrow functions: (n) => `Delete ${n} mods`
// Log message keys (log_*) are used by the backend SSE stream via tLog().

window.RIMMOD_LOCALE = {
    // ── Profile modal ──────────────────────────────────────────────
    pm_title_edit:     "Edit Profile",
    pm_title_new:      "Add Game",

    // ── Warning banner ─────────────────────────────────────────────
    warn_no_steamcmd:   "SteamCMD path is not set or SteamCMD is not installed — downloading mods will not work.",
    warn_go_settings:   "Go to Settings →",

    // ── Sidebar ────────────────────────────────────────────────────
    nav_mods:     "Mods",
    nav_trash:    "Trash",
    nav_settings: "Settings",
    status_ready: "Ready",

    // ── Mods page buttons ──────────────────────────────────────────
    btn_check_updates:   "Check Updates",
    btn_update_outdated: "Update Selected",
    btn_download:        "Download",
    btn_workshop:        "Workshop Browser",
    btn_add_mod:         "+ Add Mod",
    btn_export:          "Export",
    btn_import:          "Import",
    btn_sel_all:         "All",
    btn_sel_none:        "None",
    btn_delete:          "Delete",
    btn_sel_section:     "All",
    btn_desel_section:   "None",

    // ── Mod list ───────────────────────────────────────────────────
    search_placeholder:  "Search mods…",
    mod_list_empty:      "Mod list is empty",
    mod_list_no_results: "No results found",
    status_installed:    "✓ Installed",
    status_update:       "↑ Update",
    status_pending:      "↓ Pending",
    tip_copy_link:       "LMB — copy Workshop link\nRMB — open in browser",
    tip_open_folder:     "Open local folder",
    tip_delete:          "Delete",
    section_installed:   "Installed",
    section_outdated:    "Outdated",
    section_queued:      "Download Queue",

    // ── Status bar ─────────────────────────────────────────────────
    st_checking:     "Checking updates",
    st_check_done:   "Check complete",
    st_updating:     "Updating mods…",
    st_update_done:  "Update complete",
    st_working:      "Working…",
    st_stopping:     "Finishing current batch…",
    st_saved:        "Saved ✓",

    // ── Confirms / alerts ──────────────────────────────────────────
    confirm_delete_one:  "Delete this mod?",
    confirm_delete_many: (n) => `Delete ${n} mod(s)?`,
    confirm_update_many: (n) => `Update ${n} mod(s)?`,
    alert_select_mods:        "Select mods first",
    alert_no_updates_sel:     "No updates available among selected mods",
    alert_no_updates:         "No updates available",
    alert_select_to_check:    "Select mods to check for updates",
    check_scope:     (n) => `Checking ${n} selected…`,
    check_scope_all: "Checking all mods…",

    // ── Add modal ──────────────────────────────────────────────────
    modal_add_title:   "Add Mods",
    modal_add_hint:    "Paste Workshop links, mod IDs or collection URLs — the app will sort them out.",
    modal_add_ph:      "https://steamcommunity.com/sharedfiles/filedetails/?id=818773962\n818773962  2009463077",
    modal_add_cancel:  "Cancel",
    modal_add_confirm: "Add",

    // ── Trash ──────────────────────────────────────────────────────
    trash_title:      "Trash",
    trash_empty:      "Trash is empty.",
    btn_restore:      "Restore",
    btn_delete_perm:  "Delete",

    // ── Settings ───────────────────────────────────────────────────
    settings_title:       "Settings",
    settings_steamcmd:    "SteamCMD executable",
    settings_steamcmd_ph: "…/SteamCMD/steamcmd.exe",
    settings_modsdir:     "RimWorld Mods folder",
    settings_modsdir_ph:  "…/RimWorld/Mods",
    settings_login:       "Steam login",
    settings_backup:      "ZIP backup before mod detection",
    settings_browse:      "Browse…",
    btn_save:             "Save Settings",
    btn_reinstall_steamcmd: "Reinstall / Update SteamCMD",
    btn_detect:           "Detect Installed Mods",
    btn_wizard:           "Setup Wizard",
    settings_quickstart:  "<b>What these settings do</b><br>" +
                          "<b>SteamCMD path</b> – the steamcmd.exe executable. Required for downloading mods.<br>" +
                          "<b>Reinstall / Update SteamCMD</b> – automatically downloads the latest version into the same folder.<br>" +
                          "<b>Max mods per SteamCMD package</b> – how many mods SteamCMD processes in one run. " +
                          "Higher numbers speed up downloads, but interrupting the download becomes harder and stability is not guaranteed. Recommended: 10–20, never exceed 50.<br>" +
                          "<b>ZIP backup before detection</b> – when enabled, clicking <b>Detect</b> on the Mods page creates a backup of your entire Mods folder.<br>" +
                          "<b>Language</b> – changes the UI language.<br><br>" +
                          "All settings are saved automatically as soon as you move to another field.",
    settings_language:    "Language",

    // ── Log messages (emitted by backend as "log_key|param") ───────
    log_fetching_info:        (n)    => `🔍 Fetching info for ${n} mod(s)…`,
    log_added_mods:           (n)    => `✅ Added ${n} mod(s)`,
    log_loading_collection:   (id)   => `📚 Loading collection ${id}…`,
    log_collection_empty:     ()     => `  ⚠ Collection is empty or not found`,
    log_collection_count:     (n)    => `  → ${n} mods in collection`,
    log_added_from_collection:(n)    => `✅ Added ${n} mods from collection`,
    log_warning:              (msg)  => `⚠ ${msg}`,
    log_no_mods_to_check:     ()     => `No mods to check`,
    log_checking_updates:     (n)    => `🔍 Checking updates for ${n} mod(s)…`,
    log_update_available:     (name) => `  ↑ Update available: ${name}`,
    log_updates_found:        (n)    => `✅ Found ${n} update(s)`,
    log_all_up_to_date:       ()     => `✅ All checked mods are up to date`,
    log_updating:             (n)    => `⬆ Updating ${n} mod(s)…`,
    log_update_complete:      ()     => `✅ Update complete`,
    log_update_failed:        ()     => `❌ Update failed`,
    log_mods_dir_missing:     ()     => `❌ Mods directory not set or does not exist`,
    log_creating_backup:      (name) => `📦 Creating backup: ${name}…`,
    log_backup_done:          ()     => `  ✅ Backup created`,
    log_backup_failed:        (err)  => `  ❌ Backup failed: ${err}`,
    log_found_folders:        (n)    => `  Found ${n} mod folder(s)`,
    log_all_already_listed:   ()     => `✅ All mods already in list`,
    log_new_fetching:         (n)    => `  ${n} new — fetching Steam info…`,
    log_detect_done:          (n)    => `✅ Added ${n} installed mod(s)`,

    log_progress_download:    (n, t) => `↓ ${n}/${t}`,
    log_progress_move:        (n, t) => `→ ${n}/${t}`,

    // steamcmd.py
    log_steamcmd_not_found:   ()           => `❌ SteamCMD not found — set the path in Settings`,
    log_steamcmd_start:       (n, dir)     => `▶ SteamCMD: ${n} mod(s) → ${dir}`,
    log_steamcmd_exit_code:   (code)       => `❌ SteamCMD exited with code ${code}`,
    log_steamcmd_error:       (err)        => `❌ ${err}`,
    log_moving_mods:          ()           => `📁 Moving mods…`,
    log_moved_ok:             (mid)        => `  ✓ ${mid}`,
    log_moved_err:            (mid, err)   => `  ⚠ ${mid}: ${err}`,
    log_moved_missing:        (mid)        => `  ⚠ ${mid}: not found in download dir`,
    log_moved_summary:        (n, total)   => `✅ Moved ${n}/${total}`,

    // workshop_browser.py
    log_workshop_script_missing: () => `❌ workshop_window.py not found`,
    log_workshop_opened:         () => `🌐 Workshop Browser opened in a separate window`,

    // importexport.py
    log_export_done:      (n, path)        => `📤 Exported ${n} mod(s) → ${path}`,
    log_import_empty:     ()               => `⚠ No mods found in file`,
    log_import_all_exist: (n)              => `✅ All ${n} mods already in list`,
    log_import_fetching:  (newN, totalN)   => `📥 Import: ${newN} new of ${totalN} — fetching Steam API…`,
    log_import_done:      (n)              => `✅ Imported ${n} mod(s)`,
  
    // ── Delete confirm modal ──────────────────────────────────────────────────
    confirm_delete_title:    "Confirm deletion",
    confirm_delete_one_named: "Delete mod",
    confirm_delete_many_q:   "Delete mods:",


    // ── Guide modal ───────────────────────────────────────────────────────────
    guide_title:          "How to use Vanilla SteamCMD Expanded",
    guide_close:          "Got it!",
    guide_start_title:    "Quick Start",
    guide_start_1:        "Open <b>Settings</b> → set the SteamCMD path and package size, you can also reinstall SteamCMD there.",
    guide_start_2:        "Click <b>🔍 Detect Installed Mods</b> – the app scans your Mods folder and adds installed mods to the list.",
    guide_start_3:        "Select mods → click <b>⬇ Download</b>. SteamCMD downloads them in batches (size set in Settings).",
    guide_buttons_title:  "Buttons on the Mods page",
    guide_btn_check:      "<b>🔄 Check Updates</b> – compares the modification date of installed mods with the last update date on Steam Workshop.<br><i>Works only on selected mods – select the ones you want first.</i>",
    guide_btn_update:     "<b>⬆ Update Selected</b> – re-downloads mods marked with <b>↑ Update</b>. Select them first.",
    guide_btn_download:   "<b>⬇ Download</b> – downloads selected mods that are not yet installed or outdated (updates selected ones).",
    guide_btn_workshop:   "<b>🌐 Workshop Browser</b> – opens Steam Workshop with a toolbar. Click <b>➕ Add mod</b> or <b>📚 Add collection</b>.",
    guide_btn_add:        "<b>+ Add Mod</b> – paste Workshop links, mod IDs or collection URLs. Names are fetched from Steam automatically.",
    guide_btn_export:     "<b>📤 Export</b> – saves selected mods (or all if none selected) and the profile to a .txt file.",
    guide_btn_import:     "<b>📥 Import</b> – loads a mod list from a .txt file. Already existing mods are skipped.",
    guide_workshop_title: "Workshop Browser details",
    guide_ws_1:           "Click <b>🌐 Workshop Browser</b> – a separate window opens with the Workshop of the active profile.",
    guide_ws_2:           "On any mod page, click <b>➕ Add mod</b> in the toolbar – the main window refreshes automatically.",
    guide_ws_3:           "On a collection page, click <b>📚 Add collection</b> – all mods from the collection are added at once.",
    guide_ws_4:           "Use the <b>⚠️</b> button if the page is misdetected (forces adding as a single mod).",
    guide_tips_title:     "Additional features",
    guide_tips:           "<b>Profiles</b> – manage multiple games via the dropdown in the sidebar. Create/edit with the <b>+</b> and <b>⚙</b> buttons.<br>" +
                          "<b>Trash</b> – deleted mods go to the Trash (searchable) and can be restored anytime.<br>" +
                          "<b>Import full profile</b> – in the profile edit/create window, click <b>📥 Import from file</b> to load name, AppID and mods.<br>" +
                          "<b>📁 button</b> – opens the mod's local folder.<br>" +
                          "<b>🔗 button</b> – left‑click copies the Workshop link, right‑click opens it in the browser.<br>" +
                          "<b>Sections</b> – click to collapse/expand, All/None buttons select mods inside a section.<br>" +
                          "<b>Shift+click</b> – selects a range of mods.",
    // ── First-run wizard ──────────────────────────────────────────
    wizard_title:          "Welcome to Vanilla SteamCMD Expanded",
    wizard_step:           (n, t) => `Step ${n} of ${t}`,
    wizard_btn_next:       "Next →",
    wizard_btn_back:       "← Back",
    wizard_btn_finish:     "Finish",
    wizard_btn_skip:       "Skip",

    wizard_btn_cancel:     "Cancel",

    // Profile wizard
    wizard_profile_title:      "Add game",
    profile_edit_title:        "Edit profile",
    wizard_profile_sub:        "Enter the Steam App ID and a name for this game profile.",
    wizard_profile_name_label: "Profile name",
    wizard_profile_name_ph:    "e.g. RimWorld",
    wizard_appid_label:        "Steam App ID",
    wizard_appid_checking:     "Looking up…",
    wizard_appid_notfound:     "App not found",


    wizard_lang_title:     "Choose language",
    wizard_lang_sub:       "You can change this later in Settings.",

    // Step 2 — mods folder
    wizard_mods_title:     "RimWorld Mods folder",
    wizard_mods_sub:       "Point to the Mods folder inside your RimWorld installation.",
    wizard_mods_ph:        "…/RimWorld/Mods",
    wizard_mods_browse:    "Browse…",
    wizard_mods_detect:    "Detect installed mods automatically",
    wizard_mods_backup:    "Create ZIP backup before detection",

    // Step 3 — SteamCMD
    wizard_scmd_title:     "SteamCMD",
    wizard_scmd_sub:       "SteamCMD is required to download and update mods.",
    wizard_scmd_opt_dl:    "Download automatically",
    wizard_scmd_opt_pick:  "I already have it — choose file",
    wizard_scmd_dir_label: "Install to folder:",
    wizard_scmd_dir_ph:    "Install folder",
    wizard_scmd_dir_browse:"Browse…",
    wizard_scmd_skip:      "Skip for now",
    wizard_scmd_downloading:"Downloading SteamCMD…",
    wizard_scmd_wait:      "Please wait, this may take a moment.",

    // Step 5 — done
    wizard_done_title:     "All set!",
    wizard_done_sub:       "RimMod Lite is ready to use. Choose what to do next:",
    wizard_done_guide:     "Quick Guide",
    wizard_done_settings:  "Go to Settings",
    wizard_done_close:     "Close",

    // Setup log keys
    log_setup_downloading:      () => "⬇ Downloading SteamCMD…",
    log_setup_progress:         (p) => `  ${p}%`,
    log_setup_extracting:       () => "📦 Extracting…",
    log_setup_steamcmd_done:    (p) => `✅ SteamCMD installed: ${p}`,
    log_setup_steamcmd_missing: () => "❌ steamcmd.exe not found after extraction",
    log_setup_download_err:     (e) => `❌ Download error: ${e}`,
    log_setup_extract_err:      (e) => `❌ Extract error: ${e}`,
    log_setup_mkdir_err:        (e) => `❌ Cannot create folder: ${e}`,

    // ── Batch size setting ────────────────────────────────────────────────────
    settings_batch_size:      "Max mods per SteamCMD package",

    // ── Progress bar ──────────────────────────────────────────────────────────
    dl_bar_label:             "Downloading",
    dl_bar_stop:              "Stop",

    // ── Trash search ──────────────────────────────────────────────────────────
    trash_search_ph:          "Search trash…",

    // ── Profile import ────────────────────────────────────────────────────────
    profile_import_btn:       "Import from file",
    profile_import_hint:      (n) => `${n} mods will be added on Save`,
    profile_import_failed:    "Import failed",

};
