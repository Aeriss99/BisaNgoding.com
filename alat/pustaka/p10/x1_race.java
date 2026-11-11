//cp:
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;
import java.util.concurrent.locks.*;

public class Main {
    static void tidur(long ms) { try { Thread.sleep(ms); } catch (InterruptedException e) { throw new RuntimeException(e); } }
    public static void main(String[] args) throws Exception {
        long t0 = System.currentTimeMillis();
        int[] saldo = {0};
        Runnable setor = () -> { int lama = saldo[0]; tidur(100); saldo[0] = lama + 100; };
        Thread a = new Thread(setor); Thread b = new Thread(setor); a.start(); b.start(); a.join(); b.join();
        System.out.println("race " + saldo[0]);
        Object k = new Object();
        Runnable aman = () -> { synchronized (k) { int lama = saldo[0]; tidur(100); saldo[0] = lama + 100; } };
        Thread c = new Thread(aman); Thread d = new Thread(aman); c.start(); d.start(); c.join(); d.join();
        System.out.println("aman " + saldo[0]);
        System.out.println("ms " + (System.currentTimeMillis() - t0));
    }
}
