//cp:
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;
import java.util.concurrent.locks.*;

public class Main {
    static void tidur(long ms) { try { Thread.sleep(ms); } catch (InterruptedException e) { throw new RuntimeException(e); } }
    public static void main(String[] args) throws Exception {
        long t0 = System.currentTimeMillis();
        ScheduledExecutorService sch = Executors.newSingleThreadScheduledExecutor();
        System.out.println(sch.schedule(() -> "tunda", 50, TimeUnit.MILLISECONDS).get());
        sch.shutdown();
        System.out.println("ms " + (System.currentTimeMillis() - t0));
    }
}
