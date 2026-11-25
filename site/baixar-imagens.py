#!/usr/bin/env python3
"""Baixa todas as imagens/logo hospedadas em dreamsplasticos.com.br para a pasta assets/
e reescreve os HTML para usá-las localmente. Rode UMA vez, no seu computador, com internet,
ANTES de trocar o domínio para o site novo:   python3 baixar-imagens.py"""
import re, os, glob, urllib.request, urllib.parse, hashlib

HOST = "https://dreamsplasticos.com.br"
pat = re.compile(r'https://dreamsplasticos\.com\.br/[^"\')\s]+?\.(?:jpg|jpeg|png|ico|gif|webp)(?:\?[^"\')\s]*)?', re.I)
os.makedirs("assets", exist_ok=True)
cache = {}

def local_name(url):
    p = urllib.parse.urlparse(url)
    base = os.path.basename(urllib.parse.unquote(p.path))
    h = hashlib.md5(url.encode()).hexdigest()[:6]
    name, ext = os.path.splitext(base)
    name = re.sub(r"[^A-Za-z0-9_-]+", "-", name).strip("-") or "img"
    return f"assets/{name}-{h}{ext.lower()}"

def get(url):
    if url in cache: return cache[url]
    dest = local_name(url)
    if not os.path.exists(dest):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=30) as r, open(dest, "wb") as f: f.write(r.read())
            print("ok  ", dest)
        except Exception as e:
            print("FALHOU", url, e); cache[url] = url; return url
    cache[url] = dest
    return dest

for path in glob.glob("*.html"):
    html = open(path, encoding="utf-8").read()
    new = pat.sub(lambda m: get(m.group(0).replace("&amp;", "&")), html)
    if new != html: open(path, "w", encoding="utf-8").write(new)
print("Pronto. Confira a pasta assets/ e abra index.html.")
