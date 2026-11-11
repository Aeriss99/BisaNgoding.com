import { chromium } from 'playwright';
import fs from 'fs';
const lib = fs.readdirSync('www/lib').filter((f) => f.endsWith('.jar'));
const cpDari = (...awal) => lib.filter((f) => awal.some((a) => f.startsWith(a))).map((f) => '/app/lib/' + f).join(':');
const KODE = `
import java.util.*;
import org.junit.jupiter.api.*;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.*;
import org.junit.platform.launcher.*;
import org.junit.platform.launcher.core.*;
import org.junit.platform.engine.*;
import static org.junit.platform.engine.discovery.DiscoverySelectors.selectClass;
import static org.junit.jupiter.api.Assertions.*;
class PTest {
  @ParameterizedTest @ValueSource(ints = {1, 25, 50}) void angka(int n) { assertTrue(n > 0); }
  @ParameterizedTest @ValueSource(strings = {"", " ", "  "}) void teks(String s) { assertTrue(s.trim().isEmpty()); }
  @ParameterizedTest(name = "x {0}") @ValueSource(strings = {"a", "b", "c"}) void bernama(String s) { assertNotNull(s); }
  @ParameterizedTest @CsvSource({"1,2", "3,4", "5,6"}) void csv(int a, int b) { assertTrue(b > a); }
}
public class Main {
  public static void main(String[] a) {
    LauncherFactory.create().execute(LauncherDiscoveryRequestBuilder.request().selectors(selectClass(PTest.class)).build(), new TestExecutionListener() {
      public void executionFinished(TestIdentifier id, TestExecutionResult r) {
        System.out.println(id.getDisplayName() + " " + r.getStatus());
        r.getThrowable().ifPresent(t -> { t.printStackTrace(System.out); });
      }
    });
  }
}`;
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto('http://localhost:8080/index.html');
await page.evaluate(() => window.siap);
const r = await page.evaluate(({ code, cp }) => window.jalankan(code, cp), { code: KODE, cp: cpDari('bisangoding', 'junit-', 'opentest4j', 'apiguardian') });
console.log('===== param dengan pengganti\n' + r.out + '\nERR ' + r.err);
const KODE2 = `
import java.lang.reflect.*;
import java.lang.annotation.*;
import org.junit.jupiter.params.provider.ValueSource;
@Retention(RetentionPolicy.RUNTIME) @interface Milik { int[] angka() default {}; short[] pendek() default {}; String[] teks() default {}; Class<?>[] kelas() default {}; boolean[] b() default {}; }
class X {
  @ValueSource(ints = {1, 25, 50}) void a(int n) {}
  @ValueSource(strings = {"", " "}) void b(String s) {}
  @Milik(angka = {7}) void c() {}
}
public class Main {
  static void coba(String nama, java.util.concurrent.Callable<Object> f) {
    try { Object o = f.call(); System.out.println(nama + " ok " + o.getClass().getSimpleName() + " " + Array.getLength(o)); } catch (Throwable t) { System.out.println(nama + " GAGAL " + t); }
  }
  public static void main(String[] args) throws Exception {
    ValueSource a = X.class.getDeclaredMethod("a", int.class).getAnnotation(ValueSource.class);
    ValueSource b = X.class.getDeclaredMethod("b", String.class).getAnnotation(ValueSource.class);
    Milik c = X.class.getDeclaredMethod("c").getAnnotation(Milik.class);
    for (ValueSource v : new ValueSource[] {a, b}) {
      coba("shorts", v::shorts); coba("bytes", v::bytes); coba("ints", v::ints); coba("longs", v::longs); coba("floats", v::floats);
      coba("doubles", v::doubles); coba("chars", v::chars); coba("booleans", v::booleans); coba("strings", v::strings); coba("classes", v::classes);
      System.out.println("--");
    }
    coba("angka", c::angka); coba("pendek", c::pendek); coba("teks", c::teks); coba("kelas", c::kelas); coba("b", c::b);
  }
}`;
const r2 = await page.evaluate(({ code, cp }) => window.jalankan(code, cp), { code: KODE2, cp: cpDari('junit-jupiter-params') });
console.log('===== anotasi\n' + r2.out + '\nERR ' + r2.err);
await browser.close();
