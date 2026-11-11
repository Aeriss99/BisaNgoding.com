//cp:
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;
import java.util.concurrent.locks.*;

public class Main {
    static int biasa = 0;
    static synchronized void tambahAman() { biasa++; }
    public static void main(String[] args) throws Exception {
        long t0 = System.currentTimeMillis();
        ScheduledExecutorService jadwal = Executors.newScheduledThreadPool(1);
        ScheduledFuture<String> sf = jadwal.schedule(() -> "terjadwal", 100, TimeUnit.MILLISECONDS);
        System.out.println(sf.get());
        AtomicInteger n = new AtomicInteger();
        ScheduledFuture<?> ulang = jadwal.scheduleAtFixedRate(n::incrementAndGet, 0, 50, TimeUnit.MILLISECONDS);
        Thread.sleep(320); ulang.cancel(false);
        System.out.println("ulang>=5 " + (n.get() >= 5));
        jadwal.shutdown();
        System.out.println("ms " + (System.currentTimeMillis() - t0));
    }
}
