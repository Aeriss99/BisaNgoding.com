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
        CompletionService<String> cs = new ExecutorCompletionService<>(pool);
        cs.submit(() -> { Thread.sleep(200); return "lambat"; }); cs.submit(() -> "cepat");
        System.out.println("cs " + cs.take().get() + " " + cs.take().get());
        pool.shutdown();
        System.out.println("ms " + (System.currentTimeMillis() - t0));
    }
}
