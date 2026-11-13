#!/usr/bin/env python3
"""내부 링크·앵커(목차) 검사. 사용: python3 link_check.py <dist폴더> [무시목록파일]
- href/src 의 내부 경로가 dist 안의 파일로 존재하는지 (Pages 규칙: /a → a.html 또는 a/index.html)
- #앵커가 대상 페이지에 같은 id로 존재하는지 (목차 링크 포함)
종료 코드 0 PASS, 1 FAIL"""
import sys, os
from html.parser import HTMLParser
from urllib.parse import urlparse, unquote

class P(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True); self.links = []; self.ids = set()
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if a.get("id"): self.ids.add(a["id"])
        if tag == "a" and a.get("name"): self.ids.add(a["name"])
        for k in ("href", "src"):
            if a.get(k) and tag in ("a", "link", "img", "script", "source", "iframe"):
                self.links.append((tag, a[k].strip()))

def resolve(root, cur_rel, url):
    u = urlparse(url)
    path = unquote(u.path)
    if not path:
        return os.path.join(root, cur_rel), u.fragment
    base = "/" + os.path.dirname(cur_rel).replace(os.sep, "/")
    absp = path if path.startswith("/") else os.path.normpath(os.path.join(base, path)).replace(os.sep, "/")
    cand = []
    fs = os.path.join(root, absp.lstrip("/"))
    if absp.endswith("/"): cand.append(os.path.join(fs, "index.html"))
    else:
        cand += [fs, fs + ".html", os.path.join(fs, "index.html")]
    for c in cand:
        if os.path.isfile(c): return c, u.fragment
    return None, u.fragment

def main(root, ignore_file):
    if not os.path.isdir(root):
        print("  [SKIP] dist 없음"); return 2
    ignores = []
    if ignore_file and os.path.isfile(ignore_file):
        ignores = [l.split("#")[0].strip() for l in open(ignore_file, encoding="utf-8")]
        ignores = [i for i in ignores if i]
    pages = {}
    for dp, _, fs in os.walk(root):
        for f in fs:
            if f.endswith(".html"):
                path = os.path.join(dp, f); p = P()
                with open(path, encoding="utf-8", errors="replace") as fh: p.feed(fh.read())
                pages[os.path.abspath(path)] = p
    fails = 0; checked = 0
    for path, p in pages.items():
        rel = os.path.relpath(path, root)
        for tag, url in p.links:
            low = url.lower()
            if low.startswith(("http://", "https://", "//", "mailto:", "tel:", "data:", "javascript:", "sms:")): continue
            if any(urlparse(url).path.startswith(i) for i in ignores): continue
            checked += 1
            target, frag = resolve(root, rel, url)
            if target is None:
                fails += 1; print(f"  [FAIL] {rel}: 대상 없음 → {url}"); continue
            if frag and tag == "a" and target.endswith(".html"):
                tp = pages.get(os.path.abspath(target))
                if tp is not None and unquote(frag) not in tp.ids:
                    fails += 1; print(f"  [FAIL] {rel}: 앵커 없음 → {url}")
    print(f"  페이지 {len(pages)}개, 내부 링크 {checked}개 검사, 문제 {fails}건")
    if not pages: print("  [SKIP] 검사할 HTML 없음"); return 2
    if fails == 0: print("  [PASS] 링크·앵커 이상 없음")
    return 1 if fails else 0

if __name__ == "__main__":
    sys.exit(main(sys.argv[1] if len(sys.argv) > 1 else "dist", sys.argv[2] if len(sys.argv) > 2 else None))
