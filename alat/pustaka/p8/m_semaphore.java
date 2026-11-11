//cp:
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;

public class Main {
    public static void main(String[] args) throws Exception {
        long t0 = System.currentTimeMillis();
        Semaphore s = new Semaphore(2);
        ExecutorService pool = Executors.newFixedThreadPool(4);
        AtomicInteger maks = new AtomicInteger(), aktif = new AtomicInteger();
        List<Future<?>> fs = new ArrayList<>();
        for (int i = 0; i < 6; i++) fs.add(pool.submit(() -> { try { s.acquire(); int a = aktif.incrementAndGet(); maks.accumulateAndGet(a, Math::max); Thread.sleep(30); aktif.decrementAndGet(); s.release(); } catch (InterruptedException e) {} }));
        for (Future<?> f : fs) f.get();
        System.out.println("maks " + maks.get());
        pool.shutdown();
        System.out.println("ms " + (System.currentTimeMillis() - t0));
    }
}
