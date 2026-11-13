#!/usr/bin/env python3
"""HTML 구조 검사. 사용: python3 html_check.py <dist폴더>
검사: h1 정확히 1개, <title>, meta description, html lang, img alt, 제목 단계 건너뜀, 중복 id,
      title 중복(페이지 간), noindex 페이지 표시
종료 코드 0 PASS, 1 FAIL"""
import sys, os
from html.parser import HTMLParser

class P(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.h1 = 0; self.title = ""; self.in_title = False
        self.desc = None; self.lang = None; self.noindex = False
        self.img_no_alt = 0; self.headings = []; self.ids = {}; self.dup_ids = set()
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if "id" in a and a["id"]:
            if a["id"] in self.ids: self.dup_ids.add(a["id"])
            self.ids[a["id"]] = 1
        if tag == "html": self.lang = a.get("lang")
        if tag == "title": self.in_title = True
        if tag == "meta":
            n = (a.get("name") or "").lower()
            if n == "description": self.desc = a.get("content") or ""
            if n == "robots" and "noindex" in (a.get("content") or "").lower(): self.noindex = True
        if tag == "img" and "alt" not in a: self.img_no_alt += 1
        if tag in ("h1","h2","h3","h4","h5","h6"):
            lv = int(tag[1]); self.headings.append(lv)
            if lv == 1: self.h1 += 1
    def handle_endtag(self, tag):
        if tag == "title": self.in_title = False
    def handle_data(self, d):
        if self.in_title: self.title += d

def main(root):
    if not os.path.isdir(root):
        print("  [SKIP] dist 없음"); return 2
    fails = 0; titles = {}; pages = 0
    for dp, _, fs in os.walk(root):
        for f in fs:
            if not f.endswith(".html"): continue
            path = os.path.join(dp, f); rel = os.path.relpath(path, root); pages += 1
            p = P()
            with open(path, encoding="utf-8", errors="replace") as fh: p.feed(fh.read())
            probs = []
            is404 = f == "404.html"
            if p.h1 != 1: probs.append(f"h1 {p.h1}개 (1개여야 함)")
            t = p.title.strip()
            if not t: probs.append("<title> 없음")
            else: titles.setdefault(t, []).append(rel)
            if not is404 and not p.noindex and (p.desc is None or not p.desc.strip()):
                probs.append("meta description 없음")
            if not p.lang: probs.append("<html lang> 없음")
            if p.img_no_alt: probs.append(f"alt 없는 이미지 {p.img_no_alt}개")
            prev = 0
            for lv in p.headings:
                if prev and lv > prev + 1: probs.append(f"제목 단계 건너뜀 h{prev}→h{lv}"); break
                prev = lv
            if p.dup_ids: probs.append("중복 id: " + ", ".join(sorted(p.dup_ids))[:200])
            tag = " (noindex)" if p.noindex else ""
            if probs:
                fails += 1; print(f"  [FAIL] {rel}{tag}: " + " / ".join(probs))
            else:
                print(f"  [PASS] {rel}{tag}")
    for t, rels in titles.items():
        if len(rels) > 1:
            fails += 1; print(f"  [FAIL] title 중복 '{t}': {', '.join(rels)}")
    if pages == 0:
        print("  [SKIP] 검사할 HTML 없음"); return 2
    print(f"  페이지 {pages}개, 문제 {fails}건")
    return 1 if fails else 0

if __name__ == "__main__":
    sys.exit(main(sys.argv[1] if len(sys.argv) > 1 else "dist"))
