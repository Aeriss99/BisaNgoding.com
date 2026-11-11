//cp:
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;
import java.util.concurrent.locks.*;

public class Main {
    public static void main(String[] args) throws Exception {
        long t0 = System.currentTimeMillis();
        AtomicInteger n = new AtomicInteger();
        try (ExecutorService ex = Executors.newVirtualThreadPerTaskExecutor()) {
            for (int i = 0; i < 100; i++) ex.submit(() -> { Thread.sleep(20); return n.incrementAndGet(); });
        }
        System.out.println("virtual " + n.get());
        Thread v = Thread.ofVirtual().name("kurir-1").start(() -> System.out.println("di " + Thread.currentThread().getName() + " virtual=" + Thread.currentThread().isVirtual()));
        v.join();
        try (ExecutorService ex = Executors.newFixedThreadPool(2)) {
            Future<String> f = ex.submit(() -> "close ok");
            System.out.println(f.get());
        }
        LongAdder la = new LongAdder();
        Thread[] ts = new Thread[3];
        for (int i = 0; i < 3; i++) { ts[i] = Thread.ofPlatform().start(() -> { for (int j = 0; j < 1000; j++) la.increment(); }); }
        for (Thread t : ts) t.join();
        System.out.println("adder " + la.sum());
        System.out.println("ms " + (System.currentTimeMillis() - t0));
    }
}
