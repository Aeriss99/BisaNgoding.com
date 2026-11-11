//cp:
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;
import java.util.concurrent.locks.*;

public class Main {
    static void tidur(long ms) { try { Thread.sleep(ms); } catch (InterruptedException e) { throw new RuntimeException(e); } }
    public static void main(String[] args) throws Exception {
        long t0 = System.currentTimeMillis();
        ExecutorService pool = Executors.newFixedThreadPool(3);
        CountDownLatch siap = new CountDownLatch(3); CountDownLatch mulai = new CountDownLatch(1); AtomicInteger n = new AtomicInteger();
        for (int i = 0; i < 3; i++) pool.submit(() -> { siap.countDown(); try { mulai.await(); } catch (InterruptedException e) {} n.incrementAndGet(); return null; });
        siap.await(); mulai.countDown(); pool.shutdown(); pool.awaitTermination(2, TimeUnit.SECONDS);
        System.out.println("latch2 " + n.get());
        System.out.println("ms " + (System.currentTimeMillis() - t0));
    }
}
