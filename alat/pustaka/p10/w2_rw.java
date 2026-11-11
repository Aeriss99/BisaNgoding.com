//cp:
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;
import java.util.concurrent.locks.*;

public class Main {
    static void tidur(long ms) { try { Thread.sleep(ms); } catch (InterruptedException e) { throw new RuntimeException(e); } }
    public static void main(String[] args) throws Exception {
        long t0 = System.currentTimeMillis();
        ReadWriteLock rw = new ReentrantReadWriteLock();
        rw.readLock().lock(); rw.readLock().unlock(); rw.writeLock().lock(); rw.writeLock().unlock();
        System.out.println("rw ok");
        System.out.println("ms " + (System.currentTimeMillis() - t0));
    }
}
