//cp:
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;
import java.util.concurrent.locks.*;

public class Main {
    static void tidur(long ms) { try { Thread.sleep(ms); } catch (InterruptedException e) { throw new RuntimeException(e); } }
    public static void main(String[] args) throws Exception {
        long t0 = System.currentTimeMillis();
        try (ExecutorService ex = Executors.newFixedThreadPool(2)) { ex.submit(() -> tidur(100)); ex.submit(() -> tidur(50)); }
        System.out.println("close ok");
        System.out.println("ms " + (System.currentTimeMillis() - t0));
    }
}
