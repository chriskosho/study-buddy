"""Builds modules/english/phonograms/audio/pNN.mp3: each phonogram's sounds, said as bare sounds (not words), one after the other.
The sounds are made with eSpeak NG (GPL-3.0; the audio it makes is not covered by that license) from exact phonemes, so nothing is guessed from spelling.
Needs: espeak-ng (built from https://github.com/espeak-ng/espeak-ng) and ffmpeg.
  ESPEAK=/path/to/espeak-ng/bin/espeak-ng ESPEAK_DATA_PATH=... LD_LIBRARY_PATH=... python3 -I study-buddy/_dev/phonogram-audio/build_audio.py
The PHON table maps each /sound/ token used in modules/english/phonograms/data.js to eSpeak phonemes. Fix a sound here and re-run."""
import json, os, subprocess, tempfile, wave, re, sys
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', '..', 'modules', 'english', 'phonograms', 'audio')
ESPEAK = os.environ.get('ESPEAK', 'espeak-ng')
# token -> (eSpeak phonemes, speed)   continuous sounds are said bare (sss, fff, mmm); stops get a very short schwa ("buh")
PHON = {
 'b': ('b@', 150), 'c': ('k@', 150), 'd': ('d@', 150), 'f': ('f', 110), 'g': ('g@', 150), 'h': ('h@', 140), 'j': ('dZ@', 150), 'k': ('k@', 150),
 'l': ('l', 110), 'm': ('m', 110), 'n': ('n', 110), 'p': ('p@', 150), 'r': ('r@', 140), 's': ('s', 110), 't': ('t@', 150), 'v': ('v', 110),
 'w': ('w@', 140), 'y': ('j@', 140), 'z': ('z', 110), 'ks': ('ks', 120), 'kw': ('kw@', 140), 'hw': ('hw@', 140), 'ch': ('tS@', 150),
 'sh': ('S', 110), 'th': ('T', 110), 'TH': ('D@', 140), 'ng': ('N', 110), 'zh': ('Z', 110),
 'a': ('a', 120), 'A': ('eI', 110), 'aw': ('O:', 110), 'o': ('A:', 110), 'O': ('oU', 110), 'oo': ('u:', 110), 'OO': ('U', 120), 'e': ('E', 120),
 'E': ('i:', 110), 'i': ('I', 120), 'I': ('aI', 110), 'u': ('V', 120), 'U': ('ju:', 110), 'er': ('3:', 110), 'ar': ('A@', 110), 'or': ('O@', 110),
 'ow': ('aU', 110), 'oy': ('OI', 110), 'uff': ('Vf', 110), 'off': ('O:f', 110), 'ed': ('Ed', 110),
}
def render(tok, tmp):
    ph, speed = PHON[tok]
    raw = os.path.join(tmp, 'raw_' + tok + '.wav'); trimmed = os.path.join(tmp, 'tok_' + tok + '.wav')
    with open(raw, 'wb') as f:
        subprocess.run([ESPEAK, '-v', 'en-us', '-s', str(speed), '-p', '45', '-a', '170', '--stdout', '[[' + ph + ']]'], stdout=f, check=True)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', raw, '-af', 'silenceremove=start_periods=1:start_threshold=-42dB:stop_periods=-1:stop_threshold=-42dB:stop_duration=0.08,areverse,silenceremove=start_periods=1:start_threshold=-42dB,areverse', '-ar', '22050', '-ac', '1', trimmed], check=True)
    out = subprocess.run(['ffmpeg', '-hide_banner', '-i', trimmed, '-af', 'volumedetect', '-f', 'null', '-'], capture_output=True, text=True).stderr
    m = re.search(r'max_volume: (-?[\d.]+)', out)
    if not m or float(m.group(1)) < -30: sys.exit('the sound /' + tok + '/ came out silent: change its phonemes in PHON')   # e.g. a bare "r" is silent in eSpeak
    return trimmed
def frames(path):
    with wave.open(path) as w: return w.readframes(w.getnframes()), w.getframerate()
def main():
    js = "const vm=require('vm'),fs=require('fs');const c={};vm.createContext(c);vm.runInContext(fs.readFileSync(process.argv[1],'utf8')+';this.PH=PH',c);console.log(JSON.stringify(c.PH))"
    PH = json.loads(subprocess.run(['node', '-e', js, os.path.join(os.path.dirname(os.path.normpath(OUT)), 'data.js')], capture_output=True, text=True, check=True).stdout)   # the PH list from data.js
    os.makedirs(OUT, exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        toks = {}
        for p in PH:
            for t in re.findall(r'/([^/]+)/', p['s']):
                if t not in PHON: sys.exit('no phonemes for /' + t + '/')
                if t not in toks: toks[t] = frames(render(t, tmp))
        for p in PH:
            parts = re.findall(r'/([^/]+)/', p['s']); data = b''
            for i, t in enumerate(parts):
                d, rate = toks[t]; data += d + (b'\0\0' * int(rate * 0.5) if i < len(parts) - 1 else b'')
            data = b'\0\0' * int(rate * 0.08) + data + b'\0\0' * int(rate * 0.08)
            wav = os.path.join(tmp, 'p.wav')
            with wave.open(wav, 'wb') as w: w.setnchannels(1); w.setsampwidth(2); w.setframerate(rate); w.writeframes(data)
            subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', wav, '-af', 'loudnorm=I=-18:TP=-2:LRA=7', '-ar', '22050', '-ac', '1', '-c:a', 'libmp3lame', '-q:a', '6', os.path.join(OUT, 'p%02d.mp3' % p['n'])], check=True)
    print(len(PH), 'clips in', os.path.relpath(OUT))
main()
