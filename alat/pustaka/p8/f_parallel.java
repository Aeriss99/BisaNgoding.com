//cp:
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;

public class Main {
    public static void main(String[] args) throws Exception {
        long t0 = System.currentTimeMillis();
        System.out.println("par " + java.util.stream.IntStream.rangeClosed(1, 1000).parallel().sum());
        System.out.println("ms " + (System.currentTimeMillis() - t0));
    }
}
