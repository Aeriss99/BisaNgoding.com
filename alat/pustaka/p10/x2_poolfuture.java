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
        List<Future<String>> fs = new ArrayList<>();
        for (int i = 1; i <= 5; i++) { String id = "P" + i; fs.add(pool.submit(() -> { tidur(200); if (id.equals("P3")) throw new IllegalStateException("x"); return id; })); }
        for (Future<String> f : fs) { try { System.out.print(f.get() + " "); } catch (ExecutionException e) { System.out.print("gagal "); } }
        pool.shutdown(); System.out.println("term " + pool.awaitTermination(5, TimeUnit.SECONDS));
        System.out.println("ms " + (System.currentTimeMillis() - t0));
    }
}
