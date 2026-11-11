//cp:
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;
import java.util.concurrent.locks.*;

public class Main {
    public static void main(String[] args) throws Exception {
        long t0 = System.currentTimeMillis();
        ExecutorService pool = Executors.newFixedThreadPool(3);
        CompletableFuture<Integer> a = CompletableFuture.supplyAsync(() -> { sleep(50); return 2; }, pool);
        CompletableFuture<Integer> b = CompletableFuture.supplyAsync(() -> { sleep(30); return 3; }, pool);
        System.out.println("combine " + a.thenCombine(b, Integer::sum).join());
        List<CompletableFuture<String>> fs = new ArrayList<>();
        for (String s : List.of("x", "y", "z")) fs.add(CompletableFuture.supplyAsync(() -> s.toUpperCase(), pool));
        CompletableFuture.allOf(fs.toArray(new CompletableFuture[0])).join();
        System.out.println("allOf " + fs.stream().map(CompletableFuture::join).toList());
        System.out.println("exc " + CompletableFuture.supplyAsync(() -> { throw new IllegalStateException("x"); }, pool).exceptionally(e -> "pulih " + e.getCause().getClass().getSimpleName()).join());
        System.out.println("anyOf " + CompletableFuture.anyOf(CompletableFuture.supplyAsync(() -> { sleep(200); return "lambat"; }, pool), CompletableFuture.supplyAsync(() -> "cepat", pool)).join());
        System.out.println("timeout " + CompletableFuture.supplyAsync(() -> { sleep(500); return "x"; }, pool).completeOnTimeout("cadangan", 100, TimeUnit.MILLISECONDS).join());
        pool.shutdown();
        System.out.println("term " + pool.awaitTermination(3, TimeUnit.SECONDS));
        System.out.println("ms " + (System.currentTimeMillis() - t0));
    }

    static void sleep(long ms) {
        try { Thread.sleep(ms); } catch (InterruptedException e) { throw new RuntimeException(e); }
    }
}
