//cp:
import java.time.Duration;
import java.util.*;
import java.util.concurrent.*;

public class Main {
    public static void main(String[] args) throws Exception {
        long t0 = System.currentTimeMillis();
        try (ExecutorService ex = Executors.newVirtualThreadPerTaskExecutor()) {
            List<Future<Integer>> fs = new ArrayList<>();
            for (int i = 0; i < 100; i++) { int n = i; fs.add(ex.submit(() -> { Thread.sleep(Duration.ofMillis(100)); return n; })); }
            long sum = 0; for (Future<Integer> f : fs) sum += f.get();
            System.out.println("sum " + sum);
        }
        try (ExecutorService ex = Executors.newFixedThreadPool(2)) { System.out.println(ex.submit(() -> "tutup otomatis").get()); }
        Thread t = Thread.startVirtualThread(() -> System.out.println("virtual " + Thread.currentThread().isVirtual()));
        t.join();
        System.out.println("ms " + (System.currentTimeMillis() - t0));
    }
}
