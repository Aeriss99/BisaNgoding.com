//cp:
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;
import java.util.concurrent.locks.*;

public class Main {
    static void tidur(long ms) { try { Thread.sleep(ms); } catch (InterruptedException e) { throw new RuntimeException(e); } }
    public static void main(String[] args) throws Exception {
        long t0 = System.currentTimeMillis();
        ThreadLocal<String> tl = ThreadLocal.withInitial(() -> "kosong");
        tl.set("main");
        Thread t = new Thread(() -> System.out.println("tl " + tl.get())); t.start(); t.join();
        System.out.println("tl " + tl.get()); tl.remove(); System.out.println("tl " + tl.get());
        System.out.println("ms " + (System.currentTimeMillis() - t0));
    }
}
