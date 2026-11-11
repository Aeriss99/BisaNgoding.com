//cp:
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;

public class Main {
    public static void main(String[] args) throws Exception {
        long t0 = System.currentTimeMillis();
        int[] k = {0}; Object kunci = new Object();
        List<Thread> ts = new ArrayList<>();
        for (int i = 0; i < 4; i++) { Thread t = new Thread(() -> { for (int j = 0; j < 10000; j++) synchronized (kunci) { k[0]++; } }); ts.add(t); t.start(); }
        for (Thread t : ts) t.join();
        System.out.println("sync " + k[0]);
        AtomicLong al = new AtomicLong(); LongAdder la = new LongAdder();
        Thread x = new Thread(() -> { for (int i = 0; i < 1000; i++) { al.incrementAndGet(); la.increment(); } }); x.start(); x.join();
        System.out.println(al.get() + " " + la.sum());
        System.out.println("ms " + (System.currentTimeMillis() - t0));
    }
}
