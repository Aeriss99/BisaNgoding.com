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
        CompletableFuture<String> cf = CompletableFuture.supplyAsync(() -> "Halo").thenApply(s -> s + " Sari").thenCombine(CompletableFuture.supplyAsync(() -> 3), (s, n) -> s + " x" + n);
        System.out.println(cf.join());
        System.out.println(CompletableFuture.supplyAsync(() -> 10 / 0).exceptionally(e -> -1).join());
        ExecutorService pool = Executors.newFixedThreadPool(2);
        System.out.println(CompletableFuture.supplyAsync(() -> "pool", pool).thenApplyAsync(String::toUpperCase, pool).get(3, TimeUnit.SECONDS));
        List<CompletableFuture<Integer>> l = new ArrayList<>();
        for (int i = 1; i <= 3; i++) { int n = i; l.add(CompletableFuture.supplyAsync(() -> n * 10, pool)); }
        CompletableFuture.allOf(l.toArray(new CompletableFuture[0])).join();
        int s = 0; for (CompletableFuture<Integer> c : l) s += c.join(); System.out.println("allOf " + s);
        pool.shutdown();
        System.out.println("ms " + (System.currentTimeMillis() - t0));
    }
}
