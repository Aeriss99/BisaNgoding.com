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
        Thread tidur = new Thread(() -> { try { Thread.sleep(5000); System.out.println("tidak diinterupsi"); } catch (InterruptedException e) { System.out.println("diinterupsi"); } });
        tidur.start(); Thread.sleep(100); tidur.interrupt(); tidur.join();
        AtomicBoolean jalan = new AtomicBoolean(true); AtomicInteger putaran = new AtomicInteger();
        Thread p = new Thread(() -> { while (jalan.get()) { putaran.incrementAndGet(); try { Thread.sleep(10); } catch (InterruptedException e) { return; } } System.out.println("berhenti"); });
        p.start(); Thread.sleep(100); jalan.set(false); p.join();
        System.out.println("putaran>0 " + (putaran.get() > 0));
        System.out.println("ms " + (System.currentTimeMillis() - t0));
    }
}
