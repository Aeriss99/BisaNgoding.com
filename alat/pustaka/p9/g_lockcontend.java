//cp:
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;
import java.util.concurrent.locks.*;

public class Main {
    public static void main(String[] args) throws Exception {
        long t0 = System.currentTimeMillis();
        ReentrantLock lock = new ReentrantLock();
        Condition ada = lock.newCondition();
        List<Integer> buf = new ArrayList<>();
        Thread c = new Thread(() -> { lock.lock(); try { while (buf.isEmpty()) ada.await(); System.out.println("cond " + buf.get(0)); } catch (InterruptedException e) {} finally { lock.unlock(); } });
        c.start();
        Thread.sleep(50);
        lock.lock(); try { buf.add(7); ada.signal(); } finally { lock.unlock(); }
        c.join();
        System.out.println("try " + lock.tryLock(10, TimeUnit.MILLISECONDS));
        System.out.println("ms " + (System.currentTimeMillis() - t0));
    }
}
