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
        BlockingQueue<Integer> q = new ArrayBlockingQueue<>(2);
        Thread prod = new Thread(() -> { try { for (int i = 1; i <= 5; i++) q.put(i); q.put(-1); } catch (InterruptedException e) {} });
        prod.start(); int sum = 0; while (true) { int v = q.take(); if (v < 0) break; sum += v; } System.out.println("antrian " + sum);
        Object kunci = new Object(); final boolean[] siap = {false};
        Thread tunggu = new Thread(() -> { synchronized (kunci) { while (!siap[0]) { try { kunci.wait(); } catch (InterruptedException e) {} } System.out.println("bangun"); } });
        tunggu.start(); Thread.sleep(20); synchronized (kunci) { siap[0] = true; kunci.notifyAll(); } tunggu.join();
        System.out.println(Thread.currentThread().getName() + " " + new Thread(() -> {}).getState());
        System.out.println("ms " + (System.currentTimeMillis() - t0));
    }
}
