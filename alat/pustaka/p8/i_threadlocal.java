//cp:
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;

public class Main {
    public static void main(String[] args) throws Exception {
        long t0 = System.currentTimeMillis();
        ThreadLocal<String> tl = ThreadLocal.withInitial(() -> "awal"); tl.set("main"); Thread o = new Thread(() -> System.out.println("tl " + tl.get())); o.start(); o.join(); System.out.println("tl " + tl.get());
        System.out.println("ms " + (System.currentTimeMillis() - t0));
    }
}
