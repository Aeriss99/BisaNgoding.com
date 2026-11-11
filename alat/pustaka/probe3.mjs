import { chromium } from 'playwright';
import fs from 'fs';
const lib = fs.readdirSync('www/lib').filter((f) => f.endsWith('.jar'));
const cpDari = (...awal) => lib.filter((f) => awal.some((a) => f.startsWith(a))).map((f) => '/app/lib/' + f).join(':');
const JEJAK = `
  static StringBuilder j = new StringBuilder();
  static synchronized void jejak(String s) { j.append(s).append(" ").append(System.currentTimeMillis() - T0).append("ms\\n"); try { java.io.FileOutputStream f = new java.io.FileOutputStream("/files/jejak.txt"); f.write(j.toString().getBytes()); f.close(); } catch (Exception e) {} }
  static long T0 = System.currentTimeMillis();
  static void pengawas() {
    final Thread utama = Thread.currentThread();
    Thread w = new Thread(() -> { for (int i = 0; i < 8; i++) { try { Thread.sleep(6000); } catch (Exception e) {} StringBuilder b = new StringBuilder(); for (StackTraceElement s : utama.getStackTrace()) b.append("  ").append(s).append('\\n'); jejak("dump " + utama.getState() + "\\n" + b); } });
    w.setDaemon(true); w.start();
  }`;
const P = {
  mockitoJunit: { cp: cpDari('junit-', 'opentest4j', 'apiguardian', 'mockito-', 'byte-buddy', 'objenesis', 'bisangoding'), code: fs.readFileSync('/dev/stdin', 'utf-8') },
  logback: { cp: cpDari('slf4j-api', 'logback-', 'bisangoding'), code: `
import org.slf4j.*;
public class Main {
  static final Logger log = LoggerFactory.getLogger(Main.class);
  public static void main(String[] a) {
    MDC.put("requestId", "A1");
    log.info("Aplikasi mulai, versi {}", "1.0");
    MDC.clear();
    log.debug("debug {}", 1);
    log.warn("Stok tinggal {}", 2);
    try { Integer.parseInt("x"); } catch (Exception e) { log.error("Gagal parse", e); }
  }
}` },
  hvDump: { cp: cpDari('hibernate-validator', 'jakarta.', 'jboss-logging', 'classmate'), code: `
import jakarta.validation.*;
import jakarta.validation.constraints.*;
import java.util.*;
class Daftar { @NotBlank String nama = " "; @Min(17) int umur = 15; }
public class Main {${JEJAK}
  public static void main(String[] a) {
    pengawas();
    jejak("mulai");
    ValidatorFactory f = Validation.buildDefaultValidatorFactory();
    jejak("factory");
    Validator v = f.getValidator();
    jejak("validator");
    Set<ConstraintViolation<Daftar>> s = v.validate(new Daftar());
    jejak("validate");
    for (ConstraintViolation<Daftar> x : s) System.out.println(x.getPropertyPath() + ": " + x.getMessage());
  }
}` },
};
const browser = await chromium.launch();
for (const k of Object.keys(P)) {
  const page = await browser.newPage();
  page.on('console', (m) => { if (m.type() === 'error') console.log('  [console]', m.text().slice(0, 200)); });
  await page.goto('http://localhost:8080/index.html');
  await page.evaluate(() => window.siap);
  const t = Date.now();
  let r;
  try { r = await Promise.race([page.evaluate(({ code, cp }) => window.jalankan(code, cp), P[k]), new Promise((_, j) => setTimeout(() => j(new Error('timeout 70s')), 70000))]); }
  catch (e) {
    let jj = '(tidak terbaca)';
    try { jj = await Promise.race([page.evaluate(async () => { try { return await (await cjFileBlob('/files/jejak.txt')).text(); } catch (e) { return 'galat ' + e; } }), new Promise((s) => setTimeout(() => s('(halaman macet)'), 10000))]); } catch (_) {}
    r = { galat: String(e), jejak: jj };
  }
  console.log(`===== ${k} (${Date.now() - t} ms)\n` + JSON.stringify(r, null, 1).slice(0, 6000));
  await page.close();
}
await browser.close();
