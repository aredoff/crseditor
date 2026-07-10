# CRSEditor

A browser editor for [OWASP CRS](https://coreruleset.org/) rules — SecLang and CRSLang. No install, no server.

**Demo:** https://aredoff.github.io/crseditor/

## What it does

If you write or tweak CRS rules, this gives you a form instead of editing raw text. It reads both CRSLang YAML and SecLang, and shows a live code preview as you work.

Parsing, validation, and compilation run in the browser via [crslang](https://github.com/coreruleset/crslang) WASM. To test rules, Coraza WASM runs your loaded rules against an HTTP request/response pair and shows what matched.

## How to use it

1. Open the demo or run locally (`npm install && npm run dev`).
2. **New rule** — blank template with a CRS-style rule id.
3. **Import** — paste CRSLang YAML or SecLang (file or text).
4. Fill in metadata, variables, operator, transformations, actions, ctl.
5. Live SecLang and CRSLang preview on the right.
6. **Export** — download or copy all rules in the format you need.
7. **Test** — run loaded rules against a request/response.

Language switcher in the header (EN / RU / ES).

## Heads up

Rules live only in the tab’s memory. Reload the page and they’re gone — export when you want to keep them.

This is a CRS / SecLang / CRSLang editor, not a ModSecurity admin panel.

## Development

```bash
npm install
npm run dev      # http://localhost:5173/crseditor/
npm run build
npm run lint
```

Rebuild WASM:

```bash
make wasm          # crslang
make coraza-wasm   # coraza (for Test)
```

Code details: [AGENTS.md](AGENTS.md), [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## License

See the repository. WASM builds use upstream [coreruleset/crslang](https://github.com/coreruleset/crslang) and [corazawaf/coraza](https://github.com/corazawaf/coraza).
