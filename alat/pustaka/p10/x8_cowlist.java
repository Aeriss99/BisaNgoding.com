//cp:
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;
import java.util.concurrent.locks.*;

public class Main {
    static void tidur(long ms) { try { Thread.sleep(ms); } catch (InterruptedException e) { throw new RuntimeException(e); } }
    public static void main(String[] args) throws Exception {
        long t0 = System.currentTimeMillis();
        List<String> log = new CopyOnWriteArrayList<>(); Set<Integer> s = ConcurrentHashMap.newKeySet();
        Thread[] ts = new Thread[3]; for (int i = 0; i < 3; i++) { int k = i; ts[i] = new Thread(() -> { log.add("k" + k); s.add(k); }); ts[i].start(); }
        for (Thread t : ts) t.join(); System.out.println("cow " + log.size() + " " + new TreeSet<>(s));
        System.out.println("ms " + (System.currentTimeMillis() - t0));
    }
}
