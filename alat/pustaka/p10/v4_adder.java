//cp:
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;
import java.util.concurrent.locks.*;

public class Main {
    static void tidur(long ms) { try { Thread.sleep(ms); } catch (InterruptedException e) { throw new RuntimeException(e); } }
    public static void main(String[] args) throws Exception {
        long t0 = System.currentTimeMillis();
        LongAdder la = new LongAdder();
        Thread[] ts = new Thread[3];
        for (int i = 0; i < 3; i++) ts[i] = Thread.ofPlatform().start(() -> { for (int j = 0; j < 1000; j++) la.increment(); });
        for (Thread t : ts) t.join();
        System.out.println("adder " + la.sum());
        System.out.println("ms " + (System.currentTimeMillis() - t0));
    }
}
