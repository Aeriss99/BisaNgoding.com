import java.util.ArrayList;
import java.util.List;

import org.junit.platform.engine.DiscoverySelector;
import org.junit.platform.engine.TestExecutionResult;
import org.junit.platform.engine.discovery.DiscoverySelectors;
import org.junit.platform.launcher.LauncherDiscoveryRequest;
import org.junit.platform.launcher.TestExecutionListener;
import org.junit.platform.launcher.TestIdentifier;
import org.junit.platform.launcher.TestPlan;
import org.junit.platform.launcher.core.LauncherDiscoveryRequestBuilder;
import org.junit.platform.launcher.core.LauncherFactory;

/**
 * Menjalankan test JUnit 5 dari method main (pengganti tombol Run test di IDE atau "mvn test").
 * Keluarannya dibuat tetap (tanpa waktu dan nomor baris) supaya bisa dicek di praktik BisaNgoding.
 *
 *   public static void main(String[] args) {
 *       JalankanTest.kelas(KalkulatorTest.class);
 *   }
 */
public final class JalankanTest {
    private JalankanTest() {
    }

    public static void kelas(Class<?>... kelas) {
        List<DiscoverySelector> pilih = new ArrayList<>();
        for (Class<?> k : kelas) {
            pilih.add(DiscoverySelectors.selectClass(k));
        }
        LauncherDiscoveryRequest permintaan = LauncherDiscoveryRequestBuilder.request()
                .selectors(pilih)
                // Urutan tetap (abjad nama yang tampil) supaya keluaran sama di setiap JVM.
                .configurationParameter("junit.jupiter.testmethod.order.default", "org.junit.jupiter.api.MethodOrderer$DisplayName")
                .configurationParameter("junit.jupiter.testclass.order.default", "org.junit.jupiter.api.ClassOrderer$DisplayName")
                .build();
        Pencatat p = new Pencatat();
        LauncherFactory.create().execute(permintaan, p);
        System.out.println();
        System.out.println("Tests run: " + (p.jalan + p.lewat) + ", Failures: " + p.gagal + ", Errors: " + p.error + ", Skipped: " + p.lewat);
    }

    private static final class Pencatat implements TestExecutionListener {
        private TestPlan rencana;
        int jalan, gagal, error, lewat;

        @Override
        public void testPlanExecutionStarted(TestPlan testPlan) {
            rencana = testPlan;
        }

        private String jarak(TestIdentifier id) {
            int n = -1;
            TestIdentifier t = id;
            while (t != null) {
                n++;
                t = rencana.getParent(t).orElse(null);
            }
            StringBuilder b = new StringBuilder();
            for (int i = 1; i < n; i++) {
                b.append("  ");
            }
            return b.toString();
        }

        @Override
        public void executionStarted(TestIdentifier id) {
            if (id.isContainer() && rencana.getParent(id).isPresent()) {
                System.out.println(jarak(id) + id.getDisplayName());
            }
        }

        @Override
        public void executionSkipped(TestIdentifier id, String alasan) {
            if (id.isTest()) {
                lewat++;
            } else {
                lewat += rencana.getDescendants(id).stream().filter(TestIdentifier::isTest).count();
            }
            System.out.println(jarak(id) + "↷ " + id.getDisplayName() + " (dilewati" + (alasan == null || alasan.isEmpty() ? "" : ": " + alasan) + ")");
        }

        @Override
        public void executionFinished(TestIdentifier id, TestExecutionResult hasil) {
            boolean akar = !rencana.getParent(id).isPresent();
            if (id.isContainer() && hasil.getStatus() == TestExecutionResult.Status.SUCCESSFUL) {
                return;
            }
            if (akar && hasil.getStatus() == TestExecutionResult.Status.SUCCESSFUL) {
                return;
            }
            if (id.isTest()) {
                jalan++;
            }
            switch (hasil.getStatus()) {
                case SUCCESSFUL:
                    System.out.println(jarak(id) + "✔ " + id.getDisplayName());
                    break;
                case ABORTED:
                    if (id.isTest()) {
                        jalan--;
                        lewat++;
                    }
                    System.out.println(jarak(id) + "↷ " + id.getDisplayName() + " (dibatalkan: " + pesan(hasil.getThrowable().orElse(null)) + ")");
                    break;
                default:
                    Throwable t = hasil.getThrowable().orElse(null);
                    if (t instanceof AssertionError) {
                        gagal++;
                    } else {
                        error++;
                    }
                    System.out.println(jarak(id) + "✘ " + id.getDisplayName());
                    for (String baris : rincian(t).split("\n")) {
                        if (!baris.trim().isEmpty()) {
                            System.out.println(jarak(id) + "    " + baris.trim());
                        }
                    }
            }
        }

        private static String pesan(Throwable t) {
            if (t == null) {
                return "";
            }
            return t.getMessage() == null ? t.getClass().getSimpleName() : t.getMessage();
        }

        /** Pesan kegagalan tanpa baris lokasi kode ("-> at ..."), karena nomor baris bisa berbeda di setiap JVM. */
        private static String rincian(Throwable t) {
            if (t == null) {
                return "";
            }
            String isi = t instanceof AssertionError ? pesan(t) : t.getClass().getName() + (t.getMessage() == null ? "" : ": " + t.getMessage());
            StringBuilder b = new StringBuilder();
            for (String baris : isi.split("\n")) {
                if (!baris.contains("-> at ") && !baris.trim().startsWith("at ")) {
                    b.append(baris.replace("org.opentest4j.AssertionFailedError: ", "")).append('\n');
                }
            }
            return b.toString();
        }
    }
}
