//cp:
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;
import java.util.concurrent.locks.*;

public class Main {
    static void tidur(long ms) { try { Thread.sleep(ms); } catch (InterruptedException e) { throw new RuntimeException(e); } }
    public static void main(String[] args) throws Exception {
        long t0 = System.currentTimeMillis();
        Thread t = new Thread(() -> { int n = 0; while (!Thread.currentThread().isInterrupted()) { n++; try { Thread.sleep(20); } catch (InterruptedException e) { Thread.currentThread().interrupt(); } } System.out.println("berhenti " + (n > 0)); });
        t.start(); Thread.sleep(200); t.interrupt(); t.join();
        System.out.println("ms " + (System.currentTimeMillis() - t0));
    }
}
