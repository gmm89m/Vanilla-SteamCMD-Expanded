# -*- mode: python ; coding: utf-8 -*-
# Both VSE.exe and WorkshopBrowser.exe are collected into the same folder
# so they share a single _internal directory.

# ── Main window ───────────────────────────────────────────────────────────────
a_main = Analysis(
    ['web_app.py'],
    pathex=['.'],
    binaries=[],
    datas=[
        ('web_static', 'web_static'),
        ('core',       'core'),
        ('routes',     'routes'),
        ('lang',       'lang'),
    ],
    hiddenimports=[
        'flask',
        'flask.templating',
        'jinja2',
        'werkzeug',
        'werkzeug.serving',
        'werkzeug.debug',
        'requests',
        'webview',
        'webview.platforms.winforms',
        'webview.platforms.edgechromium',
        'clr',
        'routes.system',
        'routes.config_routes',
        'routes.mods',
        'routes.importexport',
        'routes.trash',
        'routes.workshop',
        'routes.setup',
        'routes.profiles',
        'core.config',
        'core.state',
        'core.dialogs',
        'core.utils',
        'core.steam_api',
        'core.steamcmd',
        'core.workshop_browser',
    ],
    hookspath=[],
    runtime_hooks=['hook_dll_fix.py'],
    excludes=[],
    noarchive=False,
)

# ── Workshop Browser ──────────────────────────────────────────────────────────
a_workshop = Analysis(
    ['workshop_window.py'],
    pathex=['.'],
    binaries=[],
    datas=[
        ('core', 'core'),
    ],
    hiddenimports=[
        'webview',
        'webview.platforms.winforms',
        'webview.platforms.edgechromium',
        'clr',
        'requests',
        'core.config',
        'core.utils',
        'core.state',
    ],
    hookspath=[],
    runtime_hooks=['hook_dll_fix.py'],
    excludes=['flask', 'werkzeug'],
    noarchive=False,
)

pyz_main = PYZ(a_main.pure)
pyz_ws   = PYZ(a_workshop.pure)

exe_main = EXE(
    pyz_main,
    a_main.scripts,
    [],
    exclude_binaries=True,
    name='VSE',
    debug=False,
    strip=False,
    upx=True,
    console=False,
    icon='ikonka2.ico',
)

exe_ws = EXE(
    pyz_ws,
    a_workshop.scripts,
    [],
    exclude_binaries=True,
    name='WorkshopBrowser',
    debug=False,
    strip=False,
    upx=True,
    console=False,
    # icon='ikonka2.ico',   # оставляем без иконки, как просили
)

# Single COLLECT — both exes share one _internal
coll = COLLECT(
    exe_main,
    a_main.binaries,
    a_main.zipfiles,
    a_main.datas,
    exe_ws,
    a_workshop.binaries,
    a_workshop.zipfiles,
    a_workshop.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name='VSE',
)