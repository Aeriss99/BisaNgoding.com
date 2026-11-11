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
        System.out.println("chain " + CompletableFuture.supplyAsync(() -> 21, pool).thenApply(x -> x * 2).thenCompose(x -> CompletableFuture.supplyAsync(() -> x + 1, pool)).handle((v, e) -> e == null ? "ok " + v : "gagal").join());
        pool.shutdown();
        System.out.println("term " + pool.awaitTermination(2, TimeUnit.SECONDS));
        System.out.println("ms " + (System.currentTimeMillis() - t0));
    }
}
