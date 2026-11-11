//cp:
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;

public class Main {
    public static void main(String[] args) throws Exception {
        long t0 = System.currentTimeMillis();
        Thread tidur = new Thread(() -> { try { Thread.sleep(3000); System.out.println("tidak diinterupsi"); } catch (InterruptedException e) { System.out.println("diinterupsi"); } });
        tidur.start(); Thread.sleep(100); tidur.interrupt(); tidur.join();
        System.out.println("ms " + (System.currentTimeMillis() - t0));
    }
}
