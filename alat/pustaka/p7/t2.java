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
        ExecutorService pool = Executors.newFixedThreadPool(3);
        CountDownLatch latch = new CountDownLatch(3);
        ConcurrentHashMap<String, Integer> peta = new ConcurrentHashMap<>();
        for (int i = 0; i < 3; i++) pool.execute(() -> { for (int j = 0; j < 1000; j++) peta.merge("x", 1, Integer::sum); latch.countDown(); });
        latch.await();
        System.out.println("latch " + peta);
        CountDownLatch l2 = new CountDownLatch(1);
        pool.execute(l2::countDown);
        System.out.println("timed " + l2.await(2, TimeUnit.SECONDS));
        pool.shutdown();
        System.out.println("ms " + (System.currentTimeMillis() - t0));
    }
}
