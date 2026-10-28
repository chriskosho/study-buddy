"""Run every Study Buddy check with one command, from the repository root:

    python3 study-buddy/_dev/tests/run_all.py            # build, then every test (3 at a time), then the math check
    python3 study-buddy/_dev/tests/run_all.py -j 1       # one at a time
    python3 study-buddy/_dev/tests/run_all.py hub shell  # only these tests (names without _test.py)

Each test picks its own free port, so several can run side by side. A test that fails is run once more on its own:
if it passes the second time it is reported as FLAKY (worth a look, but not a real failure). The exit code is 0 only
when everything passed (flaky counts as passed)."""
import subprocess, sys, os, time, glob
from concurrent.futures import ThreadPoolExecutor

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
args = sys.argv[1:]
jobs = 3
if '-j' in args:
    i = args.index('-j'); jobs = int(args[i + 1]); del args[i:i + 2]
names = sorted(os.path.basename(f)[:-3] for f in glob.glob(os.path.join(HERE, '*_test.py'))) + ['atlas_test3']
if args: names = [n for n in names if n in args or n.replace('_test', '') in args]

def run(name):
    t = time.time()
    p = subprocess.run([sys.executable, os.path.join(HERE, name + '.py')], cwd=ROOT, capture_output=True, text=True, timeout=1200)
    out = p.stdout + p.stderr
    fails = [l for l in out.splitlines() if l.startswith('FAIL') or 'Traceback' in l or 'Error:' in l]
    return name, p.returncode == 0 and 'ALL PASSED' in out or (p.returncode == 0 and not fails and name == 'atlas_test3'), fails, time.time() - t

print('build:', subprocess.run(['node', 'study-buddy/_dev/build.mjs'], cwd=ROOT, capture_output=True, text=True).stdout.strip().splitlines()[-1:] or 'done')
start = time.time()
with ThreadPoolExecutor(max_workers=jobs) as ex:
    results = list(ex.map(run, names))
report = []
for name, ok, fails, secs in results:
    status = 'PASS'
    if not ok:
        _, ok2, fails2, _ = run(name)              # once more on its own
        status = 'FLAKY' if ok2 else 'FAIL'
        if not ok2: fails = fails2
    report.append((name, status, fails, secs))
    print(f'{status:5} {name} ({secs:.0f}s)' + ('' if status == 'PASS' else '\n      ' + '\n      '.join(fails[:6])))
m = subprocess.run(['node', 'study-buddy/_dev/tests/math_gen_check.mjs'], cwd=ROOT, capture_output=True, text=True)
mok = m.returncode == 0 and 'ALL PASSED' in m.stdout
print(('PASS ' if mok else 'FAIL ') + 'math_gen_check' + ('' if mok else '\n' + (m.stdout + m.stderr)[-1500:]))
bad = [r for r in report if r[1] == 'FAIL'] + ([('math_gen_check',)] if not mok else [])
flaky = [r[0] for r in report if r[1] == 'FLAKY']
print(f'\n{len(report) + 1 - len(bad)} of {len(report) + 1} passed in {(time.time() - start) / 60:.1f} min' + (f'; flaky: {", ".join(flaky)}' if flaky else ''))
print('ALL PASSED' if not bad else 'FAILED: ' + ', '.join(r[0] for r in bad))
sys.exit(1 if bad else 0)
