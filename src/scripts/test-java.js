import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync, execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const contentDir = path.join(__dirname, '../../content');
const tmpDir = path.join(__dirname, '../../.tmp-java');

if (!fs.existsSync(tmpDir)) {
  fs.mkdirSync(tmpDir, { recursive: true });
}

const JDK17_JAVAC = 'javac';
const JDK17_JAVA = 'java';
const JDK21_JAVAC = '/usr/lib/jvm/java-21-openjdk-amd64/bin/javac';
const JDK21_JAVA = '/usr/lib/jvm/java-21-openjdk-amd64/bin/java';

let errors = 0;
let report = '# Laporan Test Java\n\n| File | Kartu | Pesan Error |\n|---|---|---|\n';

function runJava(code, stdin, javaVersion) {
  const is21 = javaVersion === 21;
  const javacCmd = is21 ? JDK21_JAVAC : JDK17_JAVAC;
  const javaCmd = is21 ? JDK21_JAVA : JDK17_JAVA;

  // Find class name
  let className = 'Main';
  const classMatch = code.match(/public\s+class\s+(\w+)/);
  if (classMatch) {
    className = classMatch[1];
  }

  const runId = Math.random().toString(36).substring(7);
  const runDir = path.join(tmpDir, runId);
  fs.mkdirSync(runDir);

  const file = path.join(runDir, `${className}.java`);
  fs.writeFileSync(file, code);

  try {
    execSync(`${javacCmd} ${file}`, { stdio: 'pipe' });
  } catch (e) {
    return { success: false, error: e.stderr?.toString() || e.message };
  }

  let out;
  try {
    out = spawnSync(javaCmd, ['-cp', runDir, className], {
      input: stdin,
      timeout: 5000,
      encoding: 'utf-8'
    });
  } catch (e) {
    return { success: false, error: e.message };
  }

  if (out.error) {
    return { success: false, error: out.error.message };
  }

  if (out.status !== 0) {
    return { success: false, error: out.stderr };
  }

  return { success: true, output: out.stdout };
}

function processLesson(lessonFile) {
  const data = JSON.parse(fs.readFileSync(lessonFile, 'utf8'));
  if (data.runnable === false) return; // Skip non-runnable lessons completely if marked

  const v = data.javaVersion || 17;

  data.cards.forEach((c, index) => {
    if (c.runnable === false) return;

    if (c.type === 'runnable' && c.code) {
      const res = runJava(c.code, '', v);
      if (!res.success) {
        errors++;
        report += `| ${data.id} | ${index} (runnable) | Kompilasi gagal: ${res.error.replace(/\n/g, '<br>')} |\n`;
      }
    }

    if (c.type === 'code_challenge' && c.solution) {
      for (let i = 0; i < c.tests.length; i++) {
        const t = c.tests[i];
        const res = runJava(c.solution, t.input, v);
        if (!res.success) {
          errors++;
          report += `| ${data.id} | ${index} (challenge) | Eksekusi test ${i+1} gagal: ${res.error.replace(/\n/g, '<br>')} |\n`;
        } else if (res.output.trim() !== t.expectedOutput.trim()) {
          errors++;
          report += `| ${data.id} | ${index} (challenge) | Test ${i+1} output beda. Harapan: ${t.expectedOutput.trim()} Aktual: ${res.output.trim()} |\n`;
        }
      }
    }

    // predict_output
    if (c.type === 'predict_output' && c.code) {
      const res = runJava(c.code, '', v);
      if (!res.success) {
        errors++;
        report += `| ${data.id} | ${index} (predict) | Eksekusi gagal: ${res.error.replace(/\n/g, '<br>')} |\n`;
      } else {
        const expectedOption = c.options[c.answer].trim();
        if (res.output.trim() !== expectedOption) {
          errors++;
          report += `| ${data.id} | ${index} (predict) | Output asli (${res.output.trim()}) tidak sama dengan jawaban benar (${expectedOption}) |\n`;
        }
      }
    }

    // reorder (if valid program)
    if (c.type === 'reorder' && c.lines) {
      const orderedLines = c.correctOrder.map(i => c.lines[i]).join('\n');
      if (orderedLines.includes('public class') && orderedLines.includes('main')) {
        const res = runJava(orderedLines, '', v);
        if (!res.success) {
          errors++;
          report += `| ${data.id} | ${index} (reorder) | Kompilasi/Eksekusi gagal: ${res.error.replace(/\n/g, '<br>')} |\n`;
        }
      }
    }

    // fill_blank
    if (c.type === 'fill_blank' && c.code && c.answers) {
      let filled = c.code;
      c.answers.forEach(a => {
        filled = filled.replace('___', a);
      });
      if (filled.includes('public class') && filled.includes('main')) {
        const res = runJava(filled, '', v);
        if (!res.success) {
          errors++;
          report += `| ${data.id} | ${index} (fill_blank) | Kompilasi/Eksekusi gagal: ${res.error.replace(/\n/g, '<br>')} |\n`;
        }
      }
    }

  });
}

function runAll() {
  const folders = fs.readdirSync(contentDir).filter(f => f.startsWith('module-'));
  for (const folder of folders) {
    const files = fs.readdirSync(path.join(contentDir, folder)).filter(f => f.endsWith('.json'));
    for (const file of files) {
      processLesson(path.join(contentDir, folder, file));
    }
  }

  fs.writeFileSync(path.join(__dirname, '../../reports/java.md'), report);

  // cleanup tmp
  fs.rmSync(tmpDir, { recursive: true, force: true });

  if (errors > 0) {
    console.error(`Ada ${errors} error di test Java!`);
    process.exit(1);
  } else {
    console.log('Test Java lolos.');
  }
}

runAll();
