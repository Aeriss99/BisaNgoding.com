//cp:
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;
import java.util.concurrent.locks.*;

public class Main {
    static void tidur(long ms) { try { Thread.sleep(ms); } catch (InterruptedException e) { throw new RuntimeException(e); } }
    public static void main(String[] args) throws Exception {
        long t0 = System.currentTimeMillis();
        ExecutorService pool = Executors.newFixedThreadPool(3);
        List<CompletableFuture<String>> fs = new ArrayList<>();
        for (String s : List.of("x", "y", "z")) fs.add(CompletableFuture.supplyAsync(() -> s.toUpperCase(), pool));
        CompletableFuture.allOf(fs.toArray(new CompletableFuture[0])).join();
        System.out.println("allOf " + fs.stream().map(CompletableFuture::join).toList());
        pool.shutdown();
        System.out.println("ms " + (System.currentTimeMillis() - t0));
    }
}
