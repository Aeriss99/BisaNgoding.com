//cp:
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;
import java.util.concurrent.locks.*;

public class Main {
    static void tidur(long ms) { try { Thread.sleep(ms); } catch (InterruptedException e) { throw new RuntimeException(e); } }
    public static void main(String[] args) throws Exception {
        long t0 = System.currentTimeMillis();
        ExecutorService pool = Executors.newFixedThreadPool(2);
        System.out.println("timeout " + CompletableFuture.supplyAsync(() -> { tidur(500); return "x"; }, pool).completeOnTimeout("cadangan", 100, TimeUnit.MILLISECONDS).join());
        pool.shutdown();
        System.out.println("ms " + (System.currentTimeMillis() - t0));
    }
}
