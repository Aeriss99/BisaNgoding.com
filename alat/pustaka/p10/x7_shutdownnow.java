//cp:
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;
import java.util.concurrent.locks.*;

public class Main {
    static void tidur(long ms) { try { Thread.sleep(ms); } catch (InterruptedException e) { throw new RuntimeException(e); } }
    public static void main(String[] args) throws Exception {
        long t0 = System.currentTimeMillis();
        ExecutorService ex = Executors.newFixedThreadPool(2);
        ex.submit(() -> { try { Thread.sleep(5000); } catch (InterruptedException e) { System.out.println("dihentikan"); } });
        Thread.sleep(100);
        List<Runnable> sisa = ex.shutdownNow();
        System.out.println("sisa " + sisa.size() + " term " + ex.awaitTermination(2, TimeUnit.SECONDS));
        System.out.println("ms " + (System.currentTimeMillis() - t0));
    }
}
