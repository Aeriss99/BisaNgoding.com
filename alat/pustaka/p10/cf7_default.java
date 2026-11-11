//cp:
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;
import java.util.concurrent.locks.*;

public class Main {
    static void tidur(long ms) { try { Thread.sleep(ms); } catch (InterruptedException e) { throw new RuntimeException(e); } }
    public static void main(String[] args) throws Exception {
        long t0 = System.currentTimeMillis();
        System.out.println("dflt " + CompletableFuture.supplyAsync(() -> 2).thenCombine(CompletableFuture.supplyAsync(() -> 3), Integer::sum).join());
        CompletableFuture<String> a = CompletableFuture.supplyAsync(() -> "a"); CompletableFuture<String> b = CompletableFuture.supplyAsync(() -> "b");
        CompletableFuture.allOf(a, b).join(); System.out.println("dflt2 " + a.join() + b.join());
        System.out.println("ms " + (System.currentTimeMillis() - t0));
    }
}
