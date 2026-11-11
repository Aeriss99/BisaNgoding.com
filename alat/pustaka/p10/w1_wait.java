//cp:
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;
import java.util.concurrent.locks.*;

public class Main {
    static void tidur(long ms) { try { Thread.sleep(ms); } catch (InterruptedException e) { throw new RuntimeException(e); } }
    public static void main(String[] args) throws Exception {
        long t0 = System.currentTimeMillis();
        Object kunci = new Object(); boolean[] siap = {false};
        Thread t = new Thread(() -> { synchronized (kunci) { while (!siap[0]) { try { kunci.wait(); } catch (InterruptedException e) {} } System.out.println("dibangunkan"); } });
        t.start(); Thread.sleep(50);
        synchronized (kunci) { siap[0] = true; kunci.notifyAll(); }
        t.join();
        System.out.println("ms " + (System.currentTimeMillis() - t0));
    }
}
