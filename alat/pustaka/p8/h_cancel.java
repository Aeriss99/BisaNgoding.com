//cp:
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;

public class Main {
    public static void main(String[] args) throws Exception {
        long t0 = System.currentTimeMillis();
        ExecutorService ex = Executors.newSingleThreadExecutor();
        Future<String> lama = ex.submit(() -> { Thread.sleep(3000); return "selesai"; });
        Thread.sleep(100);
        System.out.println("batal " + lama.cancel(true) + " " + lama.isCancelled());
        ex.shutdownNow();
        System.out.println("term " + ex.awaitTermination(2, TimeUnit.SECONDS));
        System.out.println("ms " + (System.currentTimeMillis() - t0));
    }
}
