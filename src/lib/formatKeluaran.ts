/** Mengamankan teks supaya tampil apa adanya di dalam HTML. */
export function amankanHtml(teks: string): string {
  return teks.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export function formatKeluaranHtml(outputStr: string): string {
  const lines = outputStr.split('\n');
  let errorCount = 0;
  const resultLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('at Runner') || line.includes('at java.base/jdk.internal') || line.includes('at java.base/java.lang.reflect') || line.includes('at java.base/sun.reflect')) {
      continue;
    }

    if (line.match(/\.java:\d+: error:/)) {
      errorCount++;
      if (errorCount > 5) {
        resultLines.push(`<div class="text-[#E0B25B] mt-2 font-bold">...dan beberapa error lainnya. Perbaiki error pertama dulu, biasanya sisanya ikut hilang.</div>`);
        break;
      }
    }

    let formattedLine = amankanHtml(line);
    formattedLine = formattedLine.replace(/\/str\/Main\.java/g, 'Main.java').replace(/\/files\/Main\.java/g, 'Main.java');
    formattedLine = formattedLine.replace(/(Main\.java:\d+(:\d+)?)/g, '<span class="text-[#548AF7] underline cursor-pointer hover:text-blue-400">$1</span>');
    resultLines.push(`<div>${formattedLine}</div>`);
  }

  return resultLines.join('');
}
