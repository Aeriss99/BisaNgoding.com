//cp:
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;
import java.util.concurrent.locks.*;

public class Main {
    static int biasa = 0;
    public static void main(String[] args) throws Exception {
        long t0 = System.currentTimeMillis();
        System.out.println("cpu=" + Runtime.getRuntime().availableProcessors() + " main=" + Thread.currentThread().getName());
        Thread a = new Thread(() -> System.out.println("di " + Thread.currentThread().getName()), "pekerja-1");
        a.start(); a.join();
        Runnable tambah = () -> { for (int i = 0; i < 100000; i++) biasa++; };
        Thread x = new Thread(tambah), y = new Thread(tambah); x.start(); y.start(); x.join(); y.join();
        System.out.println("tanpa sync " + biasa);
        AtomicInteger at = new AtomicInteger();
        ExecutorService pool = Executors.newFixedThreadPool(4);
        List<Future<Integer>> hasil = new ArrayList<>();
        for (int i = 1; i <= 4; i++) { final int n = i; hasil.add(pool.submit(() -> { for (int j = 0; j < 10000; j++) at.incrementAndGet(); Thread.sleep(50 * n); return n * n; })); }
        int total = 0; for (Future<Integer> f : hasil) total += f.get();
        System.out.println("atomic " + at.get() + " total " + total);
        List<Callable<String>> tugas = Arrays.asList(() -> "A", () -> "B", () -> "C");
        for (Future<String> f : pool.invokeAll(tugas)) System.out.print(f.get());
        System.out.println();
        CountDownLatch latch = new CountDownLatch(3);
        ConcurrentHashMap<String, Integer> peta = new ConcurrentHashMap<>();
        for (int i = 0; i < 3; i++) pool.execute(() -> { for (int j = 0; j < 1000; j++) peta.merge("x", 1, Integer::sum); latch.countDown(); });
        System.out.println("latch " + latch.await(5, TimeUnit.SECONDS) + " " + peta);
        CompletableFuture<String> cf = CompletableFuture.supplyAsync(() -> "Halo", pool).thenApply(s -> s + " Sari").thenCombine(CompletableFuture.supplyAsync(() -> 3, pool), (s, n) -> s + " x" + n);
        System.out.println(cf.get(5, TimeUnit.SECONDS));
        CompletableFuture<Integer> gagal = CompletableFuture.supplyAsync(() -> 10 / 0, pool).exceptionally(e -> { System.out.println("tangkap " + e.getClass().getSimpleName() + " / " + e.getCause()); return -1; });
        System.out.println(gagal.join());
        ScheduledExecutorService jadwal = Executors.newScheduledThreadPool(1);
        ScheduledFuture<String> sf = jadwal.schedule(() -> "terjadwal", 100, TimeUnit.MILLISECONDS);
        System.out.println(sf.get());
        jadwal.shutdown();
        ReentrantLock lock = new ReentrantLock();
        int[] k = {0};
        List<Thread> ts = new ArrayList<>();
        for (int i = 0; i < 4; i++) { Thread th = new Thread(() -> { for (int j = 0; j < 10000; j++) { lock.lock(); try { k[0]++; } finally { lock.unlock(); } } }); ts.add(th); th.start(); }
        for (Thread th : ts) th.join();
        System.out.println("lock " + k[0]);
        Thread tidur = new Thread(() -> { try { Thread.sleep(10000); System.out.println("tidak"); } catch (InterruptedException e) { System.out.println("diinterupsi " + Thread.currentThread().isInterrupted()); } });
        tidur.start(); Thread.sleep(50); tidur.interrupt(); tidur.join();
        pool.shutdown();
        System.out.println("term " + pool.awaitTermination(5, TimeUnit.SECONDS) + " " + pool.isShutdown());
        BlockingQueue<Integer> q = new ArrayBlockingQueue<>(2);
        Thread prod = new Thread(() -> { try { for (int i = 1; i <= 5; i++) q.put(i); q.put(-1); } catch (InterruptedException e) {} });
        prod.start(); int sum = 0; while (true) { int v = q.take(); if (v < 0) break; sum += v; } System.out.println("antrian " + sum);
        Object kunci = new Object(); final boolean[] siap = {false};
        Thread tunggu = new Thread(() -> { synchronized (kunci) { while (!siap[0]) { try { kunci.wait(); } catch (InterruptedException e) {} } System.out.println("bangun"); } });
        tunggu.start(); Thread.sleep(20); synchronized (kunci) { siap[0] = true; kunci.notifyAll(); } tunggu.join();
        Thread d = new Thread(() -> {}); System.out.println(d.getState() + " daemon=" + d.isDaemon());
        ThreadLocal<String> tl = ThreadLocal.withInitial(() -> "awal"); tl.set("main"); Thread o = new Thread(() -> System.out.println("tl " + tl.get())); o.start(); o.join(); System.out.println("tl " + tl.get());
        System.out.println("ms " + (System.currentTimeMillis() - t0));
    }
}
