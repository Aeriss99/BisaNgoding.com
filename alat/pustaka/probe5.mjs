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
const r = await page.evaluate(({ code, cp }) => window.jalankan(code, cp), { code: KODE, cp: cpDari('junit-', 'opentest4j', 'apiguardian') });
console.log('===== param\n' + r.out + '\nERR ' + r.err);
await browser.close();
