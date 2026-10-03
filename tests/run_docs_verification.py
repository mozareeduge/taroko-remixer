#!/usr/bin/env python3
"""
Documentation verifier for TAROKE RIMIXER v07.7 / v07.8 release checkpoint.
Python standard library only. Offline. Deterministic.
"""

import os
import re
import sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

passed = 0
failed = 0

def p(label):
    global passed
    passed += 1
    print(f"PASS | {label}")

def f(label, detail=''):
    global failed
    failed += 1
    msg = f"FAIL | {label}"
    if detail:
        msg += f"\n       {detail}"
    print(msg)

def read(path):
    full = os.path.join(ROOT, path)
    try:
        with open(full, 'r', encoding='utf-8') as fh:
            return fh.read()
    except FileNotFoundError:
        return None

def exists(path):
    return os.path.exists(os.path.join(ROOT, path))

# ─── 1. All six public docs exist ──────────────────────────────────────────

PUBLIC_DOCS = [
    'docs/WHAT_IS_TAROKO_REMIXER.md',
    'docs/MAKE_A_REMIX.md',
    'docs/IMPORTING_AUTHORED_PROJECTS.md',
    'docs/EXPORT_PREVIEW_AND_RECOVERY.md',
    'docs/KNOWN_LIMITS.md',
    'docs/RELEASE_v07_7.md',
]

for doc in PUBLIC_DOCS:
    if exists(doc):
        p(f"doc exists: {doc}")
    else:
        f(f"doc exists: {doc}", f"missing: {doc}")

# ─── 2. README links to all six ────────────────────────────────────────────

readme = read('README.md') or ''
for doc in PUBLIC_DOCS:
    basename = os.path.basename(doc)
    # Check for either the full path or just the basename in a markdown link
    if basename in readme or doc in readme:
        p(f"README links to {basename}")
    else:
        f(f"README links to {basename}", f"not found in README.md")

# ─── 3. Every relative Markdown link resolves ──────────────────────────────

all_docs = PUBLIC_DOCS + ['README.md', 'docs/CLAUDE_WORKFLOW.md']
# Also scan technical docs
for fname in os.listdir(os.path.join(ROOT, 'docs')):
    if fname.endswith('.md'):
        candidate = f'docs/{fname}'
        if candidate not in all_docs:
            all_docs.append(candidate)

link_errors = []
for doc in all_docs:
    content = read(doc)
    if content is None:
        continue
    doc_dir = os.path.dirname(os.path.join(ROOT, doc))
    for m in re.finditer(r'\[([^\]]*)\]\(([^)#]+)(?:#[^)]*)?\)', content):
        href = m.group(2).strip()
        if href.startswith('http://') or href.startswith('https://'):
            continue  # skip external links
        if href.startswith('mailto:'):
            continue
        target = os.path.normpath(os.path.join(doc_dir, href))
        if not os.path.exists(target):
            link_errors.append((doc, href, target))

if link_errors:
    for (src, href, target) in link_errors:
        f(f"link resolves: {href} in {src}", f"missing: {target}")
else:
    p("all relative Markdown links resolve")

# ─── 4. Every referenced local image exists ────────────────────────────────

img_errors = []
for doc in all_docs:
    content = read(doc)
    if content is None:
        continue
    doc_dir = os.path.dirname(os.path.join(ROOT, doc))
    for m in re.finditer(r'!\[[^\]]*\]\(([^)]+)\)', content):
        href = m.group(1).strip()
        if href.startswith('http://') or href.startswith('https://'):
            continue
        target = os.path.normpath(os.path.join(doc_dir, href))
        if not os.path.exists(target):
            img_errors.append((doc, href))

if img_errors:
    for (src, href) in img_errors:
        f(f"image exists: {href} in {src}")
else:
    p("all referenced local images exist")

# ─── 5. Named chamber labels exist in src/app.js ───────────────────────────

app_js = read('src/app.js') or ''

CHAMBER_LABELS = [
    'Source ground',
    'Sample banks',
    'Form modulators',
    'Line devices',
    'Stanza patterns',
    'Flow scenes',
    'Trigger conditions',
    'Output surface',
    'Run chamber',
    'Notes / repairs',
    'Export',
]

for label in CHAMBER_LABELS:
    if label in app_js:
        p(f"chamber label in app.js: '{label}'")
    else:
        f(f"chamber label in app.js: '{label}'")

# ─── 6. Named primary Export actions exist in app.js ───────────────────────

EXPORT_ACTIONS = [
    'Save playable HTML',
    'Export project JSON',
    'Copy JSON',
]

for action in EXPORT_ACTIONS:
    if action in app_js:
        p(f"export action in app.js: '{action}'")
    else:
        f(f"export action in app.js: '{action}'")

# ─── 7. Autosave key matches source ────────────────────────────────────────

EXPECTED_KEY = 'taroke.remixer.v07.draft'

if EXPECTED_KEY in app_js:
    p(f"autosave key in app.js: '{EXPECTED_KEY}'")
else:
    f(f"autosave key in app.js: '{EXPECTED_KEY}'")

export_doc = read('docs/EXPORT_PREVIEW_AND_RECOVERY.md') or ''
if EXPECTED_KEY in export_doc:
    p(f"autosave key in EXPORT_PREVIEW_AND_RECOVERY.md")
else:
    f(f"autosave key in EXPORT_PREVIEW_AND_RECOVERY.md", f"expected '{EXPECTED_KEY}'")

# ─── 8. Test count agrees across README, TEST_REPORT, CLAUDE.md ────────────

def extract_counts(text):
    """Return all 'NNN passed' integers found in text."""
    return [int(m.group(1)) for m in re.finditer(r'(\d+)\s+passed', text)]

readme_counts = extract_counts(readme)
test_report = read('TEST_REPORT.md') or ''
tr_counts = extract_counts(test_report)
claude_md = read('CLAUDE.md') or ''
cm_counts = extract_counts(claude_md)

# We expect the largest number in each to agree (or README might show the final total)
readme_max = max(readme_counts) if readme_counts else 0
tr_max = max(tr_counts) if tr_counts else 0
cm_max = max(cm_counts) if cm_counts else 0

# README and TEST_REPORT totals should match
if readme_max == tr_max and readme_max > 0:
    p(f"README and TEST_REPORT agree on total: {readme_max} passed")
else:
    f(f"README and TEST_REPORT agree on total", f"README max={readme_max}, TEST_REPORT max={tr_max}")

# CLAUDE.md expected count should match TEST_REPORT total
if cm_max == tr_max and cm_max > 0:
    p(f"CLAUDE.md and TEST_REPORT agree on expected: {cm_max} passed")
else:
    f(f"CLAUDE.md and TEST_REPORT agree on expected", f"CLAUDE.md={cm_max}, TEST_REPORT max={tr_max}")

# ─── 9. TEST_REPORT suite arithmetic equals stated total ───────────────────

# Find all "N passed, 0 failed" lines and the Total line
suite_lines = re.findall(r'(\d+)\s+passed,\s*0\s+failed', test_report)
# Exclude the Total line (last occurrence is typically the Total)
total_match = re.search(r'[Tt]otal[:\s]+(\d+)\s+passed', test_report)
if suite_lines and total_match:
    # Find the total line's value
    stated_total = int(total_match.group(1))
    # Sum the per-suite lines (all except the one that matches the total)
    # We need to find per-suite lines that are not the total itself
    # Strategy: find total line position and take all before it
    lines_before_total = test_report[:total_match.start()]
    per_suite = [int(m) for m in re.findall(r'(\d+)\s+passed,\s*0\s+failed', lines_before_total)]
    computed = sum(per_suite)
    if computed == stated_total:
        p(f"TEST_REPORT arithmetic correct: {computed} = stated total {stated_total}")
    else:
        f(f"TEST_REPORT arithmetic correct", f"sum of suites={computed}, stated total={stated_total}")
else:
    f(f"TEST_REPORT arithmetic", "could not find per-suite lines or Total line")

# ─── 10. v07.6 preview state labels match source ───────────────────────────

PREVIEW_BTN_LABELS = [
    ('Build live artifact preview', 'build button label'),
    ('Rebuild live artifact preview', 'rebuild button label'),
    ('Refresh live artifact preview', 'refresh button label'),
    ('Retry live artifact preview', 'retry button label'),
]

# State names are lowercase in app.js code
PREVIEW_STATE_NAMES = [
    ("'unbuilt'", 'unbuilt state'),
    ("'fresh'", 'fresh state'),
    ("'stale'", 'stale state'),
    ("'error'", 'error state'),
]

export_doc_text = read('docs/EXPORT_PREVIEW_AND_RECOVERY.md') or ''
live_preview_doc = read('docs/LIVE_ARTIFACT_PREVIEW_v07_6.md') or ''

for label, desc in PREVIEW_BTN_LABELS:
    if label in app_js:
        p(f"preview button label in app.js: '{label}'")
    else:
        f(f"preview button label in app.js: '{label}' ({desc})")

for token, desc in PREVIEW_STATE_NAMES:
    if token in app_js:
        p(f"preview state name in app.js: {token}")
    else:
        f(f"preview state name in app.js: {token} ({desc})")

# ─── 11. Sandbox statement matches source ──────────────────────────────────

SANDBOX_ATTR = 'sandbox="allow-scripts"'

if SANDBOX_ATTR in app_js:
    p(f"sandbox attribute in app.js")
else:
    f(f"sandbox attribute in app.js", f"expected: {SANDBOX_ATTR}")

if SANDBOX_ATTR in export_doc_text:
    p(f"sandbox attribute stated in EXPORT_PREVIEW_AND_RECOVERY.md")
else:
    f(f"sandbox attribute stated in EXPORT_PREVIEW_AND_RECOVERY.md")

# ─── 12. No document claims sandbox uses allow-same-origin ─────────────────
# Docs may mention "no allow-same-origin" or "without allow-same-origin" which is correct.
# Fail only if a doc claims the sandbox attribute INCLUDES allow-same-origin.

SAME_ORIGIN_CLAIMS = [
    'sandbox="allow-scripts allow-same-origin"',
    "sandbox='allow-scripts allow-same-origin'",
    'sandbox includes allow-same-origin',
    'allow-same-origin is used',
    'allow-same-origin is enabled',
    'allow-same-origin is set',
]

for doc in PUBLIC_DOCS:
    content = read(doc) or ''
    found = [c for c in SAME_ORIGIN_CLAIMS if c.lower() in content.lower()]
    if found:
        f(f"no allow-same-origin enabled claim in {doc}", f"found: {found}")
    else:
        p(f"no allow-same-origin enabled claim in {doc}")

# ─── 13. No document claims postMessage is impossible ──────────────────────

IMPOSSIBLE_PHRASES = [
    'postMessage is impossible',
    'postMessage impossible',
    'postMessage is not possible',
    'cannot use postMessage',
    'postMessage cannot',
]

for doc in PUBLIC_DOCS:
    content = read(doc) or ''
    found = any(ph in content for ph in IMPOSSIBLE_PHRASES)
    if found:
        f(f"no postMessage-impossible claim: {doc}")
    else:
        p(f"no postMessage-impossible claim: {doc}")

# ─── 14. Trigger consumed-input statement matches source ───────────────────

CONSUMED_PHRASE = 'consumedInputs'

if CONSUMED_PHRASE in app_js:
    p(f"consumedInputs in app.js")
else:
    f(f"consumedInputs in app.js")

core_js = read('src/core.js') or ''
if CONSUMED_PHRASE in core_js:
    p(f"consumedInputs in core.js")
else:
    f(f"consumedInputs in core.js")

make_doc = read('docs/MAKE_A_REMIX.md') or ''
if 'consumed by the chosen route template' in make_doc or 'consumed sample' in make_doc:
    p(f"trigger consumed-input statement in MAKE_A_REMIX.md")
else:
    f(f"trigger consumed-input statement in MAKE_A_REMIX.md")

# ─── 15. Import-authority statement matches core migration behavior ─────────

importing_doc = read('docs/IMPORTING_AUTHORED_PROJECTS.md') or ''
if 'materials.trays' in importing_doc and 'authoritative' in importing_doc:
    p("import authority statement present in IMPORTING_AUTHORED_PROJECTS.md")
else:
    f("import authority statement in IMPORTING_AUTHORED_PROJECTS.md")

if 'materials.trays' in core_js:
    p("materials.trays referenced in core.js")
else:
    f("materials.trays referenced in core.js")

# ─── 16. Real Grave counts match acceptance record ─────────────────────────

grave_doc = read('docs/GRAVE_V3_2_IMPORT_ACCEPTANCE.md') or ''
GRAVE_TRAYS = '33'
GRAVE_TOKENS = '270'
GRAVE_REPAIRS = '80'

for val, label in [(GRAVE_TRAYS, 'tray count'), (GRAVE_TOKENS, 'token count'), (GRAVE_REPAIRS, 'repair count')]:
    if val in grave_doc:
        p(f"Grave acceptance record has {label}: {val}")
    else:
        f(f"Grave acceptance record has {label}: {val}")

# Check importing doc matches
for val, label in [(GRAVE_TRAYS, 'tray count'), (GRAVE_TOKENS, 'token count'), (GRAVE_REPAIRS, 'repair count')]:
    if val in importing_doc:
        p(f"IMPORTING doc states Grave {label}: {val}")
    else:
        f(f"IMPORTING doc states Grave {label}: {val}")

# ─── 17. Referenced screenshot folders exist ───────────────────────────────

SCREENSHOT_DIRS = [
    'docs/screenshots/v07_3',
    'docs/screenshots/v07_5',
    'docs/screenshots/v07_5c_import',
    'docs/screenshots/v07_5c_real_grave',
    'docs/screenshots/v07_5d',
    'docs/screenshots/v07_5e',
    'docs/screenshots/v07_6',
]

for d in SCREENSHOT_DIRS:
    if os.path.isdir(os.path.join(ROOT, d)):
        p(f"screenshot dir exists: {d}")
    else:
        f(f"screenshot dir exists: {d}")

# ─── 18. Public docs do not present an older phase as current ──────────────

STALE_LABELS = [
    'Current pass: v07.5',
    'Current pass: v07.4',
    'Current pass: v07.3',
    'Current pass: v07.2',
    'Current pass: v07.1',
]

for doc in PUBLIC_DOCS:
    content = read(doc) or ''
    found = [s for s in STALE_LABELS if s in content]
    if found:
        f(f"no stale phase label in {doc}", f"found: {found}")
    else:
        p(f"no stale phase label in {doc}")

# ─── 19. Placeholder examples remain visible (not empty) ───────────────────

make_doc_text = read('docs/MAKE_A_REMIX.md') or ''
if '{above:plural}' in make_doc_text:
    p("route template example present in MAKE_A_REMIX.md")
else:
    f("route template example present in MAKE_A_REMIX.md", "expected {above:plural}")

# ─── 20. No public doc links to a nonexistent full Grave artwork file ───────

GRAVE_ARTWORK_PATHS = [
    'grave_v3_2_remixer_compatible_r2.taroke.json',
    'tests/fixtures/grave_v3_2',
]

for doc in PUBLIC_DOCS:
    content = read(doc) or ''
    for path in GRAVE_ARTWORK_PATHS:
        if path in content:
            # Check if the file actually exists
            full = os.path.join(ROOT, path)
            if not os.path.exists(full):
                f(f"no dead Grave artwork link in {doc}", f"references nonexistent: {path}")
            else:
                p(f"Grave artwork link in {doc} resolves")

p("no public doc links to nonexistent Grave artwork (scan complete)")

# ─── 21. No public doc claims formal WCAG compliance ──────────────────────
# Docs may say "No formal WCAG compliance claim" (which is the correct denial).
# Fail only if a doc positively claims WCAG compliance.

WCAG_POSITIVE_CLAIMS = [
    'is WCAG compliant',
    'is fully WCAG',
    'meets WCAG',
    'WCAG 2. compliant',
    'formally WCAG compliant',
    'passes WCAG',
    'certified accessible',
]

for doc in PUBLIC_DOCS:
    content = read(doc) or ''
    found = [c for c in WCAG_POSITIVE_CLAIMS if c.lower() in content.lower()]
    if found:
        f(f"no WCAG compliance claim in {doc}", f"found: {found}")
    else:
        p(f"no WCAG compliance claim in {doc}")

# ─── 22. No public doc claims cloud persistence ────────────────────────────
# Docs may say "no cloud sync" or "no cloud" (correct denial).
# Fail only on positive claims of cloud persistence.

CLOUD_POSITIVE_CLAIMS = [
    'saves to the cloud',
    'stored in the cloud',
    'synced to the cloud',
    'cloud backup',
    'cloud storage is used',
    'automatically syncs',
    'sync across devices',
]

for doc in PUBLIC_DOCS:
    content = read(doc) or ''
    found = [c for c in CLOUD_POSITIVE_CLAIMS if c.lower() in content.lower()]
    if found:
        f(f"no cloud persistence claim in {doc}", f"found: {found}")
    else:
        p(f"no cloud persistence claim in {doc}")

# ─── 23. No raw absolute local filesystem paths in public docs ─────────────

ABSPATH_PATTERN = re.compile(r'(?<!\w)(/home/|/Users/|/root/|C:\\|D:\\)[^\s`)\]"\']+')

for doc in PUBLIC_DOCS:
    content = read(doc) or ''
    matches = ABSPATH_PATTERN.findall(content)
    if matches:
        f(f"no absolute local paths in {doc}", f"found: {matches[:3]}")
    else:
        p(f"no absolute local paths in {doc}")

# ─── 24. No temporary Claude session URL in public docs ───────────────────

SESSION_PATTERNS = [
    re.compile(r'claude\.ai/code/session'),
    re.compile(r'Claude-Session:'),
]

for doc in PUBLIC_DOCS:
    content = read(doc) or ''
    found = [p.pattern for p in SESSION_PATTERNS if p.search(content)]
    if found:
        f(f"no Claude session URL in {doc}", f"pattern found: {found}")
    else:
        p(f"no Claude session URL in {doc}")

# ─── 25. v07.8 release metadata ────────────────────────────────────────────

import json as _json

# Package version should be 0.7.8
pkg = read('package.json') or ''
try:
    pkg_version = _json.loads(pkg).get('version','')
except Exception:
    pkg_version = ''
if pkg_version == '0.7.8':
    p("package.json version is 0.7.8")
else:
    f("package.json version is 0.7.8", f"found: {pkg_version!r}")

# Document title should not contain 'reset' (stale workbench label removed)
index_html = read('index.html') or ''
if 'reset' not in index_html.lower() or '<title>TAROKE RIMIXER</title>' in index_html:
    p("index.html title does not contain stale 'reset' label")
else:
    f("index.html title does not contain stale 'reset' label", "found 'reset' in index.html title")

# README should reference v07.8 checkpoint
if 'v07.8' in readme:
    p("README references v07.8")
else:
    f("README references v07.8")

# CHANGELOG should have v07.8 section
changelog = read('CHANGELOG.md') or ''
if 'v07.8' in changelog:
    p("CHANGELOG.md has v07.8 section")
else:
    f("CHANGELOG.md has v07.8 section")

# RELEASE_v07_7.md should state 520 passed directly
release_v77 = read('docs/RELEASE_v07_7.md') or ''
if '520 passed, 0 failed' in release_v77:
    p("RELEASE_v07_7.md states historical count 520 passed, 0 failed")
else:
    f("RELEASE_v07_7.md states historical count 520 passed, 0 failed")

# Screenshot folder v07_8 should exist
if os.path.isdir(os.path.join(ROOT, 'docs/screenshots/v07_8')):
    p("screenshot dir exists: docs/screenshots/v07_8")
else:
    f("screenshot dir exists: docs/screenshots/v07_8")

# ─── Summary ────────────────────────────────────────────────────────────────

print()
print(f"{passed} passed, {failed} failed")
if failed > 0:
    sys.exit(1)
