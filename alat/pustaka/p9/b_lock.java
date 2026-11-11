//cp:
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;
import java.util.concurrent.locks.*;

public class Main {
    public static void main(String[] args) throws Exception {
        long t0 = System.currentTimeMillis();
        ReentrantLock lock = new ReentrantLock();
        int[] n = {0};
        List<Thread> ts = new ArrayList<>();
        for (int i = 0; i < 4; i++) { Thread t = new Thread(() -> { for (int j = 0; j < 2000; j++) { lock.lock(); try { n[0]++; } finally { lock.unlock(); } } }); ts.add(t); t.start(); }
        for (Thread t : ts) t.join();
        System.out.println("lock " + n[0]);
        System.out.println("ms " + (System.currentTimeMillis() - t0));
    }
}
