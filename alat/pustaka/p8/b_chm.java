//cp:
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;

public class Main {
    public static void main(String[] args) throws Exception {
        long t0 = System.currentTimeMillis();
        ConcurrentHashMap<String, Integer> peta = new ConcurrentHashMap<>();
        List<Thread> ts = new ArrayList<>();
        for (int i = 0; i < 3; i++) { Thread t = new Thread(() -> { for (int j = 0; j < 1000; j++) peta.merge("x", 1, Integer::sum); }); ts.add(t); t.start(); }
        for (Thread t : ts) t.join();
        System.out.println("chm " + peta);
        System.out.println("ms " + (System.currentTimeMillis() - t0));
    }
}
