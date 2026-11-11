//cp:
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;
import java.util.concurrent.locks.*;

public class Main {
    public static void main(String[] args) throws Exception {
        long t0 = System.currentTimeMillis();
        Object kunci = new Object();
        boolean[] siap = {false};
        Thread t = new Thread(() -> { synchronized (kunci) { while (!siap[0]) { try { kunci.wait(); } catch (InterruptedException e) {} } System.out.println("dibangunkan"); } });
        t.start();
        Thread.sleep(50);
        synchronized (kunci) { siap[0] = true; kunci.notifyAll(); }
        t.join();
        ReadWriteLock rw = new ReentrantReadWriteLock();
        rw.readLock().lock(); rw.readLock().unlock(); rw.writeLock().lock(); rw.writeLock().unlock();
        System.out.println("rw ok");
        ExecutorService pool = Executors.newFixedThreadPool(2);
        CompletionService<String> cs = new ExecutorCompletionService<>(pool);
        cs.submit(() -> { Thread.sleep(100); return "lambat"; });
        cs.submit(() -> "cepat");
        System.out.println("cs " + cs.take().get() + " " + cs.take().get());
        ScheduledExecutorService sch = Executors.newSingleThreadScheduledExecutor();
        ScheduledFuture<String> sf = sch.schedule(() -> "tunda", 50, TimeUnit.MILLISECONDS);
        System.out.println(sf.get());
        sch.shutdown(); pool.shutdown();
        Thread th = new Thread(() -> { throw new IllegalStateException("boom"); }, "pekerja");
        th.setUncaughtExceptionHandler((x, e) -> System.out.println("tangkap " + x.getName() + " " + e.getMessage()));
        th.start(); th.join();
        System.out.println("state " + new Thread(() -> {}).getState());
        System.out.println("ms " + (System.currentTimeMillis() - t0));
    }
}
