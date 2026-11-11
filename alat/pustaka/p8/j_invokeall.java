//cp:
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;

public class Main {
    public static void main(String[] args) throws Exception {
        long t0 = System.currentTimeMillis();
        ExecutorService pool = Executors.newFixedThreadPool(2);
        List<Callable<String>> tugas = Arrays.asList(() -> "A", () -> "B", () -> "C");
        StringBuilder sb = new StringBuilder();
        for (Future<String> f : pool.invokeAll(tugas)) sb.append(f.get());
        System.out.println(sb + " " + pool.invokeAny(tugas).length());
        pool.shutdown();
        System.out.println("term " + pool.awaitTermination(2, TimeUnit.SECONDS));
        System.out.println("ms " + (System.currentTimeMillis() - t0));
    }
}
