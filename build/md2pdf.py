#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Converte um .md do projeto em HTML estilizado (para virar PDF pelo Chromium).
Markdown-lite proposital: cobre o que os documentos daqui usam (títulos, listas,
tabelas, blockquote, negrito, itálico, código e regra horizontal)."""
import sys, re, html, os

def inline(s):
    s = html.escape(s)
    s = re.sub(r'`([^`]+)`', r'<code>\1</code>', s)
    s = re.sub(r'\*\*([^*]+)\*\*', r'<strong>\1</strong>', s)
    s = re.sub(r'(?<!\*)\*([^*]+)\*(?!\*)', r'<em>\1</em>', s)
    s = re.sub(r'\[([^\]]+)\]\(([^)]+)\)', r'<a href="\2">\1</a>', s)
    return s

def convert(md):
    out, i = [], 0
    lines = md.split("\n")
    is_row = lambda l: l.strip().startswith("|") and l.strip().endswith("|")
    while i < len(lines):
        l = lines[i]
        if is_row(l) and i + 1 < len(lines) and re.match(r'^\s*\|[\s|:-]+\|\s*$', lines[i+1]):
            rows = []
            while i < len(lines) and is_row(lines[i]):
                rows.append(lines[i]); i += 1
            cells = lambda r: [c.strip() for c in r.strip().strip("|").split("|")]
            head, body = cells(rows[0]), [cells(r) for r in rows[2:]]
            out.append("<table><thead><tr>" + "".join(f"<th>{inline(h)}</th>" for h in head) +
                       "</tr></thead><tbody>" +
                       "".join("<tr>" + "".join(f"<td>{inline(c)}</td>" for c in r) + "</tr>" for r in body) +
                       "</tbody></table>")
            continue
        m = re.match(r'^(#{1,4})\s+(.*)$', l)
        if m:
            lvl = len(m.group(1)); out.append(f"<h{lvl}>{inline(m.group(2))}</h{lvl}>"); i += 1; continue
        if re.match(r'^\s*(---|___)\s*$', l):
            out.append("<hr/>"); i += 1; continue
        if l.strip().startswith(">"):
            buf = []
            while i < len(lines) and lines[i].strip().startswith(">"):
                buf.append(lines[i].strip().lstrip(">").strip()); i += 1
            out.append("<blockquote>" + inline(" ".join(buf)) + "</blockquote>"); continue
        # listas: uma linha seguinte indentada/solta é CONTINUAÇÃO do mesmo item,
        # não um parágrafo novo (senão o texto quebra fora da bolinha).
        def take_list(marker, tag):
            out.append(f"<{tag}>")
            j = i
            while j < len(lines) and re.match(marker, lines[j]):
                item = [re.sub(marker, '', lines[j])]; j += 1
                while (j < len(lines) and lines[j].strip()
                       and not re.match(marker, lines[j])
                       and not re.match(r'^\s*(#{1,4}\s|\d+\.\s|[-*]\s|>|(---|___)\s*$)', lines[j])
                       and not is_row(lines[j])):
                    item.append(lines[j].strip()); j += 1
                out.append("<li>" + inline(" ".join(item)) + "</li>")
            out.append(f"</{tag}>")
            return j
        if re.match(r'^\s*[-*]\s+', l):
            i = take_list(r'^\s*[-*]\s+', "ul"); continue
        if re.match(r'^\s*\d+\.\s+', l):
            i = take_list(r'^\s*\d+\.\s+', "ol"); continue
        if not l.strip():
            i += 1; continue
        buf = []
        while i < len(lines) and lines[i].strip() and not re.match(r'^(#{1,4}\s|\s*[-*]\s|\s*\d+\.\s|>|\s*(---|___)\s*$)', lines[i]) and not is_row(lines[i]):
            buf.append(lines[i]); i += 1
        out.append("<p>" + inline(" ".join(buf)) + "</p>")
    return "\n".join(out)

CSS = """
@page { size: A4; margin: 18mm 16mm; }
body { font-family: "Charter","Georgia",serif; font-size: 10.4pt; line-height: 1.5; color: #14171c; margin: 0; }
h1 { font-size: 20pt; margin: 0 0 4px; letter-spacing: -.2px; }
h2 { font-size: 14pt; margin: 20px 0 6px; padding-bottom: 4px; border-bottom: 1px solid #d8dde5; }
h3 { font-size: 11.6pt; margin: 14px 0 4px; }
h4 { font-size: 10.6pt; margin: 11px 0 3px; color: #333; }
p { margin: 0 0 8px; }
ul, ol { margin: 4px 0 10px; padding-left: 20px; }
li { margin: 3px 0; }
code { font-family: "SFMono-Regular",Consolas,monospace; font-size: 9pt; background: #f1f3f6; border: 1px solid #e3e7ee; border-radius: 3px; padding: 0 3px; }
strong { font-weight: 700; }
blockquote { margin: 8px 0; padding: 8px 12px; background: #f6f8fb; border-left: 3px solid #5b8cff; color: #2b3444; }
table { border-collapse: collapse; width: 100%; margin: 8px 0 12px; font-size: 9.2pt; }
th, td { border: 1px solid #cfd6e0; padding: 5px 8px; text-align: left; vertical-align: top; }
th { background: #eef1f6; font-weight: 700; }
hr { border: none; border-top: 1px solid #dfe3e9; margin: 16px 0; }
a { color: #2b5fd0; text-decoration: none; }
h2, h3 { break-after: avoid; }
table, blockquote { break-inside: avoid; }
"""

src, dst = sys.argv[1], sys.argv[2]
title = os.path.splitext(os.path.basename(src))[0]
md = open(src, encoding="utf-8").read()
open(dst, "w", encoding="utf-8").write(
    f'<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>{title}</title>'
    f"<style>{CSS}</style></head><body>{convert(md)}</body></html>")
print("wrote", dst)
