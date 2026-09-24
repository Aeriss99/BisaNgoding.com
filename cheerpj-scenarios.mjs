import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:4173';
const LESSON_URL = `${BASE_URL}/#/lesson/dasar-01`;

const HELLO_CODE = `public class Main {\n  public static void main(String[] args) {\n    System.out.println("Hello, World!");\n  }\n}`;

const scenarios = [
  {
    name: '1. Hello World',
    code: HELLO_CODE,
    expectContains: ['Hello, World!'],
    expectError: false,
  },
  {
    name: '2. println(5 + 3)',
    code: `public class Main {\n  public static void main(String[] args) {\n    System.out.println(5 + 3);\n  }\n}`,
    expectContains: ['8'],
    expectError: false,
  },
  {
    name: '3. Loop (for i=1..5)',
    code: `public class Main {\n  public static void main(String[] args) {\n    for (int i = 1; i <= 5; i++) {\n      System.out.println("i=" + i);\n    }\n  }\n}`,
    expectContains: ['i=1', 'i=2', 'i=3', 'i=4', 'i=5'],
    expectError: false,
  },
  {
    name: '4. If-Else',
    code: `public class Main {\n  public static void main(String[] args) {\n    int x = 10;\n    if (x > 5) {\n      System.out.println("besar");\n    } else {\n      System.out.println("kecil");\n    }\n  }\n}`,
    expectContains: ['besar'],
    expectError: false,
  },
  {
    name: '5. Scanner (input statis dalam kode)',
    code: `import java.io.ByteArrayInputStream;\nimport java.util.Scanner;\npublic class Main {\n  public static void main(String[] args) {\n    System.setIn(new ByteArrayInputStream("Budi\\n".getBytes()));\n    Scanner sc = new Scanner(System.in);\n    String name = sc.nextLine();\n    System.out.println("Halo, " + name);\n  }\n}`,
    expectContains: ['Halo, Budi'],
    expectError: false,
  },
  {
    name: '6. Error Kompilasi (syntax error)',
    code: `public class Main {\n  public static void main(String[] args) {\n    System.out.println("belum ditutup"\n  }\n}`,
    expectContains: ['Error'],
    expectError: true,
  },
  {
    name: '7. Exception Runtime (divide by zero)',
    code: `public class Main {\n  public static void main(String[] args) {\n    int a = 10;\n    int b = 0;\n    System.out.println(a / b);\n  }\n}`,
    expectContains: ['Error'],
    expectError: true,
  },
  {
    name: '8. 5 run berturut-turut (run 1–5)',
    code: `public class Main {\n  public static void main(String[] args) {\n    System.out.println("BerturutOK");\n  }\n}`,
    expectContains: ['BerturutOK'],
    expectError: false,
    runTimes: 5,
  },
  {
    name: '9. Run ke-2 output berbeda',
    code: `public class Main {\n  public static void main(String[] args) {\n    System.out.println("RunKedua");\n  }\n}`,
    expectContains: ['RunKedua'],
    expectError: false,
    runTwice: true,
  },
  {
    name: '10. Exception dengan pesan stack trace',
    code: `public class Main {\n  public static void main(String[] args) {\n    String s = null;\n    System.out.println(s.length());\n  }\n}`,
    expectContains: ['Error'],
    expectError: true,
  },
];

async function setCodeMirrorContent(page, code) {
  const cm = page.locator('.cm-content');
  await cm.click();
  await page.keyboard.press('Control+A');
  await page.keyboard.press('Delete');
  await page.keyboard.insertText(code);
}

async function clickRun(page) {
  await page.locator('button:has-text("Jalankan Kode")').click();
}

async function waitOutputSettled(page, timeoutMs) {
  await page
    .locator('button:has-text("Jalankan Kode")')
    .waitFor({ state: 'visible', timeout: timeoutMs });
}

async function getOutputText(page) {
  const box = page.locator('.overflow-x-auto.bg-gray-900');
  if ((await box.count()) === 0) return '';
  return (await box.first().innerText()).trim();
}

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.setDefaultTimeout(60000);

  console.log(`Membuka lesson dasar-01: ${LESSON_URL}`);
  await page.goto(LESSON_URL, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('main');

  const firstBtn = page
    .locator('button:has-text("Lanjut"), button:has-text("Selesai")')
    .last();
  if ((await firstBtn.count()) > 0) {
    await firstBtn.click();
  }
  await page.waitForSelector('.cm-content', { timeout: 30000 });
  console.log('Runnable card (Kode Playground) ditemukan.\n');

  const results = [];

  for (const sc of scenarios) {
    console.log(`=== ${sc.name} ===`);
    try {
      const runOnce = async () => {
        await setCodeMirrorContent(page, sc.code);
        const start = Date.now();
        await clickRun(page);
        await waitOutputSettled(page, 90000);
        const ms = Date.now() - start;
        const output = await getOutputText(page);
        return { output, ms };
      };

      let passed = true;

      if (sc.runTimes && sc.runTimes > 1) {
        for (let i = 0; i < sc.runTimes; i++) {
          const r = await runOnce();
          console.log(
            `  run ${i + 1} (${r.ms}ms): ${JSON.stringify(r.output).slice(0, 200)}`
          );
          const ok = sc.expectContains.every((s) => r.output.includes(s));
          if (!ok) {
            passed = false;
            console.log(`  >> GAGAL pada run ${i + 1}`);
            break;
          }
        }
      } else {
        const r1 = await runOnce();
        let r2 = null;
        if (sc.runTwice) r2 = await runOnce();

        passed = sc.expectContains.every((s) => r1.output.includes(s));
        if (sc.expectError) passed = passed && r1.output.startsWith('Error');
        if (sc.runTwice)
          passed =
            passed && sc.expectContains.every((s) => r2.output.includes(s));

        console.log(
          `output1 (${r1.ms}ms): ${JSON.stringify(r1.output).slice(0, 300)}`
        );
        if (r2)
          console.log(
            `output2 (${r2.ms}ms): ${JSON.stringify(r2.output).slice(0, 300)}`
          );
      }

      console.log(passed ? '>>> LULUS' : '>>> GAGAL');
      results.push({ name: sc.name, passed });
    } catch (err) {
      console.log(`ERROR: ${err.message}`);
      results.push({ name: sc.name, passed: false });
    }
    console.log('');
  }

  console.log('========== RINGKASAN 10 SKENARIO CHEERPJ ==========');
  let passCount = 0;
  for (const r of results) {
    console.log(`${r.passed ? 'LULUS' : 'GAGAL'} - ${r.name}`);
    if (r.passed) passCount++;
  }
  console.log(`\nTOTAL: ${passCount}/${results.length} LULUS`);

  await browser.close();
  process.exit(passCount === results.length ? 0 : 1);
}

main().catch((e) => {
  console.error('FATAL:', e);
  process.exit(1);
});
