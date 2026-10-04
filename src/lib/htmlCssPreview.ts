export function buildPreviewDocument(html: string, css: string): string {
  const hasHtmlTag = /<html/i.test(html);
  
  if (hasHtmlTag) {
    const headEndIndex = html.toLowerCase().indexOf('</head>');
    if (headEndIndex !== -1) {
      return html.slice(0, headEndIndex) + `<style>${css}</style>` + html.slice(headEndIndex);
    } else {
      const htmlStartIndex = html.toLowerCase().indexOf('<html');
      const htmlEndIndex = html.indexOf('>', htmlStartIndex) + 1;
      return html.slice(0, htmlEndIndex) + `<head><style>${css}</style></head>` + html.slice(htmlEndIndex);
    }
  }

  return `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>${css}</style>
</head>
<body>
${html}
</body>
</html>`;
}
