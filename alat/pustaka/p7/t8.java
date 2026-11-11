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
        ThreadLocal<String> tl = ThreadLocal.withInitial(() -> "awal"); tl.set("main"); Thread o = new Thread(() -> System.out.println("tl " + tl.get())); o.start(); o.join(); System.out.println("tl " + tl.get());
        System.out.println("par " + java.util.stream.IntStream.rangeClosed(1, 1000).parallel().sum());
        ExecutorService ex = Executors.newSingleThreadExecutor();
        Future<String> lama = ex.submit(() -> { Thread.sleep(3000); return "selesai"; });
        try { lama.get(200, TimeUnit.MILLISECONDS); } catch (TimeoutException e) { System.out.println("timeout"); }
        System.out.println("batal " + lama.cancel(true));
        ex.shutdownNow();
        System.out.println("ms " + (System.currentTimeMillis() - t0));
    }
}
