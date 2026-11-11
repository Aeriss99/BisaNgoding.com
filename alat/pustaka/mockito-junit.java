import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;
import java.util.*;
interface Repo { String cari(int id); void simpan(String s); }
class Layanan { private final Repo r; Layanan(Repo r) { this.r = r; } String judul(int id) { String s = r.cari(id); return s == null ? "-" : s.toUpperCase(); } void tambah(String s) { r.simpan(s.trim()); } }
@ExtendWith(MockitoExtension.class)
class LayananTest {
  @Mock Repo repo;
  @InjectMocks Layanan layanan;
  @Captor ArgumentCaptor<String> tangkap;
  @Test void besar() { when(repo.cari(1)).thenReturn("abc"); assertEquals("ABC", layanan.judul(1)); verify(repo).cari(1); }
  @Test void kosong() { assertEquals("-", layanan.judul(9)); }
  @Test void simpan() { layanan.tambah("  x "); verify(repo).simpan(tangkap.capture()); assertEquals("x", tangkap.getValue()); }
  @Test void gagalVerify() { layanan.tambah("y"); verify(repo, never()).simpan("y"); }
  @Test void stubTakTerpakai() { when(repo.cari(5)).thenReturn("z"); }
}
public class Main {
  public static void main(String[] args) {
    JalankanTest.kelas(LayananTest.class);
    List<String> l = mock(List.class); when(l.size()).thenReturn(3); System.out.println(l.size());
  }
}
