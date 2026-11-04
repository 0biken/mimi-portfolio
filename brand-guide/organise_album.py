# Copy album frames into one folder per collection and write a manifest.
import json, shutil
from pathlib import Path
from themes import THEMES, MOTION

ROOT = Path(__file__).resolve().parent
ALBUM = ROOT / 'assets/album'
OUT = ROOT / 'assets/collections'

manifest = []
for i, th in enumerate(THEMES + [MOTION], 1):
    d = OUT / f'{i:02}-{th["slug"]}'
    d.mkdir(parents=True, exist_ok=True)
    files = []
    for n in th['frames']:
        tag = 'hero' if n == th.get('hero') else 'pick' if n in th.get('picks', []) else 'archive'
        name = f'{th["slug"]}-{n:02}-{tag}.jpg'
        shutil.copy2(ALBUM / f'{n:02}.jpg', d / name)
        files.append(dict(frame=n, file=f'{d.name}/{name}', role=tag))
    manifest.append(dict(collection=th['name'], folder=d.name, line=th.get('line', 'Video clips; poster frames only.'),
                         mood=th.get('mood', []), best_for=th.get('best', ''), note=th.get('note', ''), files=files))

(OUT / 'collections.json').write_text(json.dumps(manifest, indent=2), encoding='utf-8')
print(sum(len(m['files']) for m in manifest), 'frames in', len(manifest), 'collections')
