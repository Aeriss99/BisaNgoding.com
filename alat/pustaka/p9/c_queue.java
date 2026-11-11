//cp:
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;
import java.util.concurrent.locks.*;

public class Main {
    public static void main(String[] args) throws Exception {
        long t0 = System.currentTimeMillis();
        BlockingQueue<Integer> q = new ArrayBlockingQueue<>(2);
        Thread prod = new Thread(() -> { try { for (int i = 1; i <= 6; i++) q.put(i); q.put(-1); } catch (InterruptedException e) {} });
        prod.start();
        int sum = 0; int x;
        while ((x = q.take()) != -1) { sum += x; Thread.sleep(5); }
        prod.join();
        System.out.println("queue " + sum);
        System.out.println("ms " + (System.currentTimeMillis() - t0));
    }
}
