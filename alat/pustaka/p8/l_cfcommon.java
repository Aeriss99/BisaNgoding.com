//cp:
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;

public class Main {
    public static void main(String[] args) throws Exception {
        long t0 = System.currentTimeMillis();
        CompletableFuture<Void> a = CompletableFuture.runAsync(() -> System.out.println("async jalan"));
        a.join();
        System.out.println(CompletableFuture.supplyAsync(() -> 21).thenApply(x -> x * 2).join());
        System.out.println(CompletableFuture.supplyAsync(() -> { try { Thread.sleep(200); } catch (InterruptedException e) {} return "lambat"; }).thenApply(x -> x).join());
        System.out.println("ms " + (System.currentTimeMillis() - t0));
    }
}
