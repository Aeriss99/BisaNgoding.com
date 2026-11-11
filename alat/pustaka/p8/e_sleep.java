//cp:
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;

public class Main {
    public static void main(String[] args) throws Exception {
        long t0 = System.currentTimeMillis();
        Thread.sleep(320);
        System.out.println("tidur selesai");
        System.out.println("ms " + (System.currentTimeMillis() - t0));
    }
}
