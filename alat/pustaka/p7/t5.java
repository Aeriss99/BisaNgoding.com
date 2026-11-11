//cp:
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;
import java.util.concurrent.locks.*;

public class Main {
    static int biasa = 0;
    static synchronized void tambahAman() { biasa++; }
    public static void main(String[] args) throws Exception {
        long t0 = System.currentTimeMillis();
        ReentrantLock lock = new ReentrantLock();
        int[] k = {0};
        List<Thread> ts = new ArrayList<>();
        for (int i = 0; i < 4; i++) { Thread th = new Thread(() -> { for (int j = 0; j < 10000; j++) { lock.lock(); try { k[0]++; } finally { lock.unlock(); } tambahAman(); } }); ts.add(th); th.start(); }
        for (Thread th : ts) th.join();
        System.out.println("lock " + k[0] + " sync " + biasa);
        int[] r = {0};
        Runnable tambah = () -> { for (int i = 0; i < 100000; i++) r[0]++; };
        Thread x = new Thread(tambah), y = new Thread(tambah); x.start(); y.start(); x.join(); y.join();
        System.out.println("race " + r[0]);
        System.out.println("ms " + (System.currentTimeMillis() - t0));
    }
}
