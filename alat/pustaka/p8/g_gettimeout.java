//cp:
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;

public class Main {
    public static void main(String[] args) throws Exception {
        long t0 = System.currentTimeMillis();
        ExecutorService ex = Executors.newSingleThreadExecutor();
        Future<String> lama = ex.submit(() -> { Thread.sleep(1000); return "selesai"; });
        try { lama.get(200, TimeUnit.MILLISECONDS); } catch (TimeoutException e) { System.out.println("timeout"); }
        System.out.println(lama.get());
        ex.shutdown();
        System.out.println("ms " + (System.currentTimeMillis() - t0));
    }
}
