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
        Thread a = new Thread(() -> System.out.println("di " + Thread.currentThread().getName()), "pekerja-1");
        a.start(); a.join();
        ExecutorService pool = Executors.newFixedThreadPool(3);
        List<Future<Integer>> hasil = new ArrayList<>();
        for (int i = 1; i <= 3; i++) { final int n = i; hasil.add(pool.submit(() -> { Thread.sleep(50 * n); return n * n; })); }
        int total = 0; for (Future<Integer> f : hasil) total += f.get();
        System.out.println("total " + total);
        for (Future<String> f : pool.invokeAll(Arrays.asList(() -> "A", () -> "B", () -> "C"))) System.out.print(f.get());
        System.out.println();
        pool.shutdown();
        System.out.println("term " + pool.awaitTermination(5, TimeUnit.SECONDS));
        System.out.println("ms " + (System.currentTimeMillis() - t0));
    }
}
