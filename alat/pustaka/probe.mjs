import { chromium } from 'playwright';
import fs from 'fs';
const lib = fs.readdirSync('www/lib').filter((f) => f.endsWith('.jar'));
const cpDari = (...awal) => lib.filter((f) => awal.some((a) => f.startsWith(a))).map((f) => '/app/lib/' + f).join(':');
const P = {
  junit: { cp: cpDari('junit-', 'opentest4j', 'apiguardian'), code: `
import org.junit.jupiter.api.*;
import static org.junit.jupiter.api.Assertions.*;
import org.junit.platform.launcher.*;
import org.junit.platform.launcher.core.*;
import org.junit.platform.launcher.listeners.*;
import static org.junit.platform.engine.discovery.DiscoverySelectors.selectClass;
class KalkulatorTest {
  @Test @DisplayName("2 + 3 = 5") void tambah() { assertEquals(5, 2 + 3); }
  @Test void gagal() { assertEquals(6, 2 + 3, "harusnya 6"); }
  @Test void error() { assertThrows(IllegalArgumentException.class, () -> { throw new IllegalArgumentException("x"); }); }
}
public class Main {
  public static void main(String[] a) {
    LauncherDiscoveryRequest r = LauncherDiscoveryRequestBuilder.request().selectors(selectClass(KalkulatorTest.class)).build();
    Launcher l = LauncherFactory.create();
    SummaryGeneratingListener s = new SummaryGeneratingListener();
    l.execute(r, s);
    System.out.println("found=" + s.getSummary().getTestsFoundCount() + " ok=" + s.getSummary().getTestsSucceededCount() + " fail=" + s.getSummary().getTestsFailedCount());
    s.getSummary().getFailures().forEach(f -> System.out.println(f.getTestIdentifier().getDisplayName() + ": " + f.getException().getMessage()));
  }
}` },
  junitParam: { cp: cpDari('junit-', 'opentest4j', 'apiguardian'), code: `
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.*;
import static org.junit.jupiter.api.Assertions.*;
import org.junit.platform.launcher.*;
import org.junit.platform.launcher.core.*;
import org.junit.platform.launcher.listeners.*;
import static org.junit.platform.engine.discovery.DiscoverySelectors.selectClass;
class GenapTest {
  @ParameterizedTest @ValueSource(ints = {2, 4, 7}) void genap(int n) { assertEquals(0, n % 2); }
  @ParameterizedTest @CsvSource({"1,2,3", "2,2,4"}) void tambah(int a, int b, int c) { assertEquals(c, a + b); }
}
public class Main {
  public static void main(String[] a) {
    SummaryGeneratingListener s = new SummaryGeneratingListener();
    LauncherFactory.create().execute(LauncherDiscoveryRequestBuilder.request().selectors(selectClass(GenapTest.class)).build(), s);
    System.out.println("found=" + s.getSummary().getTestsFoundCount() + " fail=" + s.getSummary().getTestsFailedCount());
  }
}` },
  mockito: { cp: cpDari('mockito-core', 'byte-buddy', 'objenesis'), code: `
import java.util.*;
import static org.mockito.Mockito.*;
interface Repo { String cari(int id); void simpan(String s); }
public class Main {
  public static void main(String[] a) {
    Repo r = mock(Repo.class);
    when(r.cari(1)).thenReturn("Belajar");
    System.out.println(r.cari(1) + " " + r.cari(2));
    r.simpan("x");
    verify(r).simpan("x");
    try { verify(r, times(2)).simpan("x"); } catch (Throwable t) { System.out.println("verify gagal: " + t.getClass().getSimpleName()); }
    List<String> spy = spy(new ArrayList<String>()); spy.add("a"); System.out.println(spy.size());
  }
}` },
  mockitoJunit: { cp: cpDari('junit-', 'opentest4j', 'apiguardian', 'mockito-', 'byte-buddy', 'objenesis'), code: `
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;
import org.junit.platform.launcher.core.*;
import org.junit.platform.launcher.listeners.*;
import static org.junit.platform.engine.discovery.DiscoverySelectors.selectClass;
interface Repo { String cari(int id); }
class Layanan { Repo r; Layanan(Repo r) { this.r = r; } String judul(int id) { String s = r.cari(id); return s == null ? "-" : s.toUpperCase(); } }
@ExtendWith(MockitoExtension.class)
class LayananTest {
  @Mock Repo repo;
  @InjectMocks Layanan layanan;
  @Test void besar() { when(repo.cari(1)).thenReturn("abc"); assertEquals("ABC", layanan.judul(1)); verify(repo).cari(1); }
  @Test void kosong() { assertEquals("-", layanan.judul(9)); }
}
public class Main {
  public static void main(String[] a) {
    SummaryGeneratingListener s = new SummaryGeneratingListener();
    LauncherFactory.create().execute(LauncherDiscoveryRequestBuilder.request().selectors(selectClass(LayananTest.class)).build(), s);
    System.out.println("found=" + s.getSummary().getTestsFoundCount() + " fail=" + s.getSummary().getTestsFailedCount());
    s.getSummary().getFailures().forEach(f -> f.getException().printStackTrace(System.out));
  }
}` },
  logback: { cp: cpDari('slf4j-api', 'logback-'), code: `
import org.slf4j.*;
public class Main {
  static final Logger log = LoggerFactory.getLogger(Main.class);
  public static void main(String[] a) {
    log.info("Aplikasi mulai, versi {}", "1.0");
    log.debug("debug {}", 1);
    log.warn("Stok tinggal {}", 2);
    try { Integer.parseInt("x"); } catch (Exception e) { log.error("Gagal parse", e); }
  }
}` },
  lombok: { cp: cpDari('lombok'), code: `
import lombok.*;
@Data @AllArgsConstructor @NoArgsConstructor @Builder
class Todo { private int id; private String judul; private boolean selesai; }
@Value class Titik { int x; int y; }
public class Main {
  public static void main(String[] a) {
    Todo t = new Todo(1, "Belajar", false);
    t.setSelesai(true);
    System.out.println(t);
    System.out.println(t.getJudul() + " " + t.isSelesai());
    System.out.println(Todo.builder().id(2).judul("Ngoding").build());
    System.out.println(new Titik(1, 2).equals(new Titik(1, 2)));
  }
}` },
  h2: { cp: cpDari('h2-'), code: `
import java.sql.*;
public class Main {
  public static void main(String[] a) throws Exception {
    try (Connection c = DriverManager.getConnection("jdbc:h2:mem:todolist;MODE=MySQL;DB_CLOSE_DELAY=-1", "root", "")) {
      Statement s = c.createStatement();
      s.execute("CREATE TABLE IF NOT EXISTS todo (id INT AUTO_INCREMENT PRIMARY KEY, judul VARCHAR(100) NOT NULL, selesai BOOLEAN DEFAULT FALSE)");
      PreparedStatement p = c.prepareStatement("INSERT INTO todo (judul) VALUES (?)", Statement.RETURN_GENERATED_KEYS);
      p.setString(1, "Belajar JDBC"); p.executeUpdate();
      ResultSet k = p.getGeneratedKeys(); k.next(); System.out.println("id baru " + k.getInt(1));
      ResultSet r = s.executeQuery("SELECT id, judul, selesai FROM todo");
      while (r.next()) System.out.println(r.getInt("id") + " " + r.getString("judul") + " " + r.getBoolean("selesai"));
    }
  }
}` },
  jackson: { cp: cpDari('jackson-'), code: `
import com.fasterxml.jackson.databind.*;
import com.fasterxml.jackson.annotation.*;
import java.util.*;
class Todo { public int id; public String judul; public boolean selesai; public Todo() {} public Todo(int i, String j) { id = i; judul = j; } }
public class Main {
  public static void main(String[] a) throws Exception {
    ObjectMapper m = new ObjectMapper();
    System.out.println(m.writeValueAsString(new Todo(1, "Belajar")));
    Todo t = m.readValue("{\\"id\\":2,\\"judul\\":\\"JSON\\",\\"selesai\\":true}", Todo.class);
    System.out.println(t.id + " " + t.judul + " " + t.selesai);
    System.out.println(m.writerWithDefaultPrettyPrinter().writeValueAsString(Arrays.asList(new Todo(3, "A"))));
    JsonNode n = m.readTree("{\\"a\\":{\\"b\\":[1,2]}}"); System.out.println(n.get("a").get("b").get(1).asInt());
    try { m.readValue("{\\"id\\":1,\\"x\\":2}", Todo.class); } catch (Exception e) { System.out.println(e.getClass().getSimpleName()); }
  }
}` },
  jsr310: { cp: cpDari('jackson-'), code: `
import com.fasterxml.jackson.databind.*;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import java.time.LocalDate;
class E { public LocalDate tanggal = LocalDate.of(2026, 11, 11); }
public class Main {
  public static void main(String[] a) throws Exception {
    ObjectMapper m = new ObjectMapper().registerModule(new JavaTimeModule()).disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
    System.out.println(m.writeValueAsString(new E()));
  }
}` },
  validator: { cp: cpDari('hibernate-validator', 'jakarta.', 'jboss-logging', 'classmate'), code: `
import jakarta.validation.*;
import jakarta.validation.constraints.*;
import java.util.*;
class Daftar { @NotBlank String nama = " "; @Email String email = "salah"; @Min(17) int umur = 15; @Size(min = 8) String sandi = "123"; }
public class Main {
  public static void main(String[] a) {
    Validator v = Validation.buildDefaultValidatorFactory().getValidator();
    Set<ConstraintViolation<Daftar>> s = v.validate(new Daftar());
    List<String> l = new ArrayList<>();
    for (ConstraintViolation<Daftar> c : s) l.add(c.getPropertyPath() + ": " + c.getMessage());
    Collections.sort(l); l.forEach(System.out::println);
  }
}` },
};
const browser = await chromium.launch();
const page = await browser.newPage();
page.on('console', (m) => { if (m.type() === 'error') console.log('  [console]', m.text().slice(0, 200)); });
await page.goto('http://localhost:8080/index.html');
await page.evaluate(() => window.siap);
const urutan = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(P);
for (const k of [...urutan, 'h2', 'junit', 'logback']) {
  const p = P[k];
  const t = Date.now();
  let r;
  try { r = await Promise.race([page.evaluate(({ code, cp }) => window.jalankan(code, cp), p), new Promise((_, j) => setTimeout(() => j(new Error('timeout 180s')), 180000))]); }
  catch (e) { r = { galat: String(e) }; }
  console.log(`===== ${k} (${Date.now() - t} ms)\n` + JSON.stringify(r, null, 1).slice(0, 3000));
}
await browser.close();
