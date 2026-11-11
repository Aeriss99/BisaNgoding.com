import { chromium } from 'playwright';
import fs from 'fs';
const lib = fs.readdirSync('www/lib').filter((f) => f.endsWith('.jar'));
const cpDari = (...awal) => lib.filter((f) => awal.some((a) => f.startsWith(a))).map((f) => '/app/lib/' + f).join(':');
const JEJAK = `
  static StringBuilder j = new StringBuilder();
  static void jejak(String s) { j.append(s).append(" ").append(System.currentTimeMillis() - T0).append("ms\\n"); try { java.io.FileOutputStream f = new java.io.FileOutputStream("/files/jejak.txt"); f.write(j.toString().getBytes()); f.close(); } catch (Exception e) {} }
  static long T0 = System.currentTimeMillis();`;
const HV = cpDari('hibernate-validator', 'jakarta.', 'jboss-logging', 'classmate');
const MO = cpDari('mockito-core', 'byte-buddy', 'objenesis');
const P = {
  hvParam: { cp: HV, code: `
import jakarta.validation.*;
import jakarta.validation.constraints.*;
import org.hibernate.validator.messageinterpolation.ParameterMessageInterpolator;
import java.util.*;
class Daftar { @NotBlank String nama = " "; @Min(17) int umur = 15; }
public class Main {${JEJAK}
  public static void main(String[] a) {
    jejak("mulai");
    Configuration<?> c = Validation.byDefaultProvider().configure();
    jejak("configure");
    c.messageInterpolator(new ParameterMessageInterpolator());
    ValidatorFactory f = c.buildValidatorFactory();
    jejak("factory");
    Validator v = f.getValidator();
    jejak("validator");
    Set<ConstraintViolation<Daftar>> s = v.validate(new Daftar());
    jejak("validate");
    List<String> l = new ArrayList<>();
    for (ConstraintViolation<Daftar> x : s) l.add(x.getPropertyPath() + ": " + x.getMessage());
    Collections.sort(l); l.forEach(System.out::println);
  }
}` },
  hvDefault: { cp: HV, code: `
import jakarta.validation.*;
import jakarta.validation.constraints.*;
import java.util.*;
class Daftar { @NotBlank String nama = " "; @Min(17) int umur = 15; }
public class Main {${JEJAK}
  public static void main(String[] a) {
    jejak("mulai " + Locale.getDefault());
    Configuration<?> c = Validation.byDefaultProvider().configure();
    jejak("configure");
    ValidatorFactory f = c.buildValidatorFactory();
    jejak("factory");
    Validator v = f.getValidator();
    jejak("validator");
    Set<ConstraintViolation<Daftar>> s = v.validate(new Daftar());
    jejak("validate");
    List<String> l = new ArrayList<>();
    for (ConstraintViolation<Daftar> x : s) l.add(x.getPropertyPath() + ": " + x.getMessage());
    Collections.sort(l); l.forEach(System.out::println);
  }
}` },
  mockProxy: { cp: MO, code: `
import static org.mockito.Mockito.*;
import org.mockito.MockMakers;
interface Repo { String cari(int id); void simpan(String s); }
public class Main {${JEJAK}
  public static void main(String[] a) {
    jejak("mulai");
    Repo r = mock(Repo.class, withSettings().mockMaker(MockMakers.PROXY));
    jejak("mock");
    when(r.cari(1)).thenReturn("Belajar");
    jejak("when");
    System.out.println(r.cari(1) + " " + r.cari(2));
    r.simpan("x");
    verify(r).simpan("x");
    jejak("verify");
    try { verify(r, times(2)).simpan("x"); } catch (Throwable t) { System.out.println("verify gagal: " + t.getClass().getSimpleName()); }
    jejak("selesai");
  }
}` },
  mockDefault: { cp: MO, code: `
import static org.mockito.Mockito.*;
interface Repo { String cari(int id); }
public class Main {${JEJAK}
  public static void main(String[] a) {
    jejak("mulai");
    org.mockito.Mockito.framework();
    jejak("framework");
    Repo r = mock(Repo.class);
    jejak("mock");
    when(r.cari(1)).thenReturn("Belajar");
    System.out.println(r.cari(1));
    jejak("selesai");
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
  try { r = await Promise.race([page.evaluate(({ code, cp }) => window.jalankan(code, cp), P[k]), new Promise((_, j) => setTimeout(() => j(new Error('timeout 120s')), 120000))]); }
  catch (e) {
    let jj = '(tidak terbaca)';
    try { jj = await Promise.race([page.evaluate(async () => { try { return await (await cjFileBlob('/files/jejak.txt')).text(); } catch (e) { return 'galat ' + e; } }), new Promise((s) => setTimeout(() => s('(halaman macet)'), 10000))]); } catch (_) {}
    r = { galat: String(e), jejak: jj };
  }
  console.log(`===== ${k} (${Date.now() - t} ms)\n` + JSON.stringify(r, null, 1).slice(0, 3000));
  await page.close();
}
await browser.close();
