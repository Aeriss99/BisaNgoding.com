//cp:
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;
import java.util.concurrent.locks.*;

public class Main {
    static void tidur(long ms) { try { Thread.sleep(ms); } catch (InterruptedException e) { throw new RuntimeException(e); } }
    public static void main(String[] args) throws Exception {
        long t0 = System.currentTimeMillis();
        BlockingQueue<String> q = new LinkedBlockingQueue<>(2);
        ExecutorService pool = Executors.newFixedThreadPool(3);
        pool.submit(() -> { for (int i = 1; i <= 5; i++) q.put("P" + i); q.put("STOP"); q.put("STOP"); return null; });
        ConcurrentHashMap<String, Integer> m = new ConcurrentHashMap<>();
        for (int k = 0; k < 2; k++) pool.submit(() -> { String s; while (!(s = q.take()).equals("STOP")) { tidur(30); m.merge("n", 1, Integer::sum); } return null; });
        pool.shutdown(); System.out.println("pc " + pool.awaitTermination(5, TimeUnit.SECONDS) + " " + m);
        System.out.println("ms " + (System.currentTimeMillis() - t0));
    }
}
