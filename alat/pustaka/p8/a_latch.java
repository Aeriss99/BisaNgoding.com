//cp:
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;

public class Main {
    public static void main(String[] args) throws Exception {
        long t0 = System.currentTimeMillis();
        ExecutorService pool = Executors.newFixedThreadPool(3);
        CountDownLatch latch = new CountDownLatch(3);
        AtomicInteger n = new AtomicInteger();
        for (int i = 0; i < 3; i++) pool.execute(() -> { n.incrementAndGet(); latch.countDown(); });
        latch.await();
        System.out.println("latch " + n.get());
        pool.shutdown();
        System.out.println("ms " + (System.currentTimeMillis() - t0));
    }
}
