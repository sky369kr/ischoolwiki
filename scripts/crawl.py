#!/usr/bin/env python3
"""로컬 Worker를 처음부터 링크를 따라가며 읽고, 페이지를 파일로 저장한다 (scripts/snapshot.sh가 실행).
사용: python3 crawl.py <기본주소> <저장폴더> <access-matrix.txt> <접근결과파일>
- 같은 사이트 안의 링크(/로 시작)만 따라간다. /admin/, /cdn-cgi/ 는 따라가지 않는다.
- HTML은 <경로>/index.html 로 저장한다 (/ → index.html). html_check.py, link_check.py가 그대로 읽는다.
- 없는 주소 하나를 열어 404 응답을 404.html로 저장한다.
- access-matrix.txt의 각 줄(방법 경로 기대코드)을 요청해 결과를 접근결과파일에 쓴다.
종료 코드 0: 모든 페이지 200, 1: 열리지 않는 내부 링크 있음"""
import os, sys, urllib.request, urllib.error
from html.parser import HTMLParser
from urllib.parse import urlparse

class Links(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True); self.hrefs = []
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "a" and a.get("href"): self.hrefs.append(a["href"].strip())

opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))  # 로컬 주소는 프록시를 거치지 않는다

def get(base, path, method="GET"):
    req = urllib.request.Request(base + path, method=method, data=b"{}" if method == "POST" else None)
    try:
        with opener.open(req, timeout=30) as r:
            return r.status, r.headers.get("content-type", ""), r.read()
    except urllib.error.HTTPError as e:
        return e.code, e.headers.get("content-type", ""), e.read()

def save(out, path, body, name=None):
    if name is None:
        clean = path.split("?")[0].split("#")[0]
        rel = clean.strip("/")
        name = os.path.join(rel, "index.html") if rel else "index.html"
    dest = os.path.join(out, name)
    os.makedirs(os.path.dirname(dest) or out, exist_ok=True)
    with open(dest, "wb") as f: f.write(body)

def main(base, out, matrix, access_out):
    base = base.rstrip("/")
    queue, seen, bad = ["/", "/about", "/ko/about", "/blog/", "/ko/blog/"], set(), 0
    while queue:
        path = queue.pop(0)
        key = path.split("#")[0]
        if key in seen: continue
        seen.add(key)
        status, ctype, body = get(base, key)
        if status != 200:
            bad += 1; print(f"  [FAIL] {key} → {status}"); continue
        if "text/html" not in ctype: continue
        save(out, key, body)
        p = Links(); p.feed(body.decode("utf-8", "replace"))
        for h in p.hrefs:
            u = urlparse(h)
            if u.scheme or u.netloc or not u.path.startswith("/"): continue
            if u.path.startswith(("/admin/", "/cdn-cgi/")): continue
            if u.path not in seen: queue.append(u.path)
    status, _, body = get(base, "/harness-check-missing-page")
    if status != 404:
        bad += 1; print(f"  [FAIL] 없는 주소가 404가 아님 → {status}")
    save(out, "", body, "404.html")
    print(f"  페이지 {len(seen)}개 읽음, 열리지 않은 페이지 {bad}개")

    lines = []
    if os.path.isfile(matrix):
        for raw in open(matrix, encoding="utf-8"):
            row = raw.split("#")[0].split()
            if len(row) != 3: continue
            method, path, want = row
            got, _, _ = get(base, path, method)
            lines.append(f"{'OK' if str(got) == want else 'BAD'} {method} {path} 기대 {want} 실제 {got}")
    with open(access_out, "w", encoding="utf-8") as f: f.write("\n".join(lines) + ("\n" if lines else ""))
    return 1 if bad else 0

if __name__ == "__main__":
    sys.exit(main(*sys.argv[1:5]))
