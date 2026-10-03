const BASE_STYLE = `
html { color-scheme: light; }
body {
  margin: 0;
  padding: 20px;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  line-height: 1.6;
  color: #1d1d1b;
  background: #ffffff;
}
img { max-width: 100%; height: auto; }
table { border-collapse: collapse; max-width: 100%; }
th, td { padding: 8px 10px; }
a { color: #5b43d6; }
`;

export function buildHtmlPreviewDocument(html: string): string {
  const styleTag = `<style>${BASE_STYLE}</style>`;
  const lower = html.toLowerCase();

  if (/<html(?:\s|>)/i.test(html)) {
    const headClose = lower.indexOf('</head>');
    if (headClose !== -1) {
      return html.slice(0, headClose) + styleTag + html.slice(headClose);
    }

    const htmlOpen = lower.indexOf('<html');
    const htmlOpenEnd = html.indexOf('>', htmlOpen);
    if (htmlOpenEnd !== -1) {
      return html.slice(0, htmlOpenEnd + 1) + `<head>${styleTag}</head>` + html.slice(htmlOpenEnd + 1);
    }
  }

  return `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
${styleTag}
</head>
<body>
${html}
</body>
</html>`;
}
