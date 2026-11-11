//cp:
import java.lang.annotation.*;
import java.lang.reflect.*;
import java.util.*;

public class Main {
    public static void main(String[] args) throws Exception {
        Class<?> k = Todo.class;
        System.out.println(k.getName() + " " + k.getSimpleName() + " " + Modifier.toString(k.getModifiers()) + " super=" + k.getSuperclass().getSimpleName());
        for (Field f : k.getDeclaredFields()) System.out.print(f.getName() + ":" + f.getType().getSimpleName() + " ");
        System.out.println();
        for (Method m : k.getDeclaredMethods()) System.out.print(m.getName() + " ");
        System.out.println();
        for (Constructor<?> c : k.getDeclaredConstructors()) System.out.print(c.getParameterCount() + " ");
        System.out.println(Arrays.toString(k.getInterfaces()));
        Todo t = (Todo) k.getDeclaredConstructor(int.class, String.class).newInstance(1, "Belajar");
        Field f = k.getDeclaredField("judul"); f.setAccessible(true); f.set(t, "Diubah");
        System.out.println(f.get(t) + " " + k.getMethod("getJudul").invoke(t));
        Method m = k.getDeclaredMethod("rahasia"); m.setAccessible(true); System.out.println(m.invoke(t));
        Wajib w = k.getDeclaredField("judul").getAnnotation(Wajib.class);
        System.out.println(w + " | " + (w == null ? "" : w.pesan()) + " | " + k.isAnnotationPresent(Tabel.class) + " " + k.getAnnotation(Tabel.class).value());
        Layanan asli = new LayananAsli();
        Layanan p = (Layanan) Proxy.newProxyInstance(Layanan.class.getClassLoader(), new Class<?>[]{Layanan.class}, (o, mm, a) -> {
            System.out.println("sebelum " + mm.getName() + Arrays.toString(a));
            Object r = mm.invoke(asli, a);
            System.out.println("sesudah " + r);
            return r;
        });
        System.out.println(p.sapa("Sari"));
        System.out.println(Class.forName("Todo").getSimpleName() + " " + int.class + " " + String[].class.getName() + " " + k.getPackage());
        try { k.getDeclaredMethod("tidakAda"); } catch (NoSuchMethodException e) { System.out.println("NSM " + e.getMessage()); }
        try { m.setAccessible(false); m.invoke(t); } catch (IllegalAccessException e) { System.out.println("IAE " + e.getMessage()); }
        try { k.getMethod("gagal").invoke(t); } catch (InvocationTargetException e) { System.out.println("ITE " + e.getCause()); }
        for (Method x : Contoh.class.getDeclaredMethods()) System.out.print(x.getName() + " ");
        System.out.println();
        System.out.println(Arrays.toString(Status.class.getEnumConstants()) + " " + Status.class.isEnum() + " " + new int[0].getClass().isArray());
        Type gt = Gudang.class.getDeclaredField("isi").getGenericType(); System.out.println(gt);
        Method pm = k.getDeclaredMethod("setJudul", String.class); System.out.println(pm.getParameters()[0].getName() + " " + pm.toGenericString());
    }
}
@Retention(RetentionPolicy.RUNTIME) @Target(ElementType.FIELD) @interface Wajib { String pesan() default "wajib diisi"; }
@Retention(RetentionPolicy.RUNTIME) @Target(ElementType.TYPE) @interface Tabel { String value(); }
interface Layanan { String sapa(String nama); }
class LayananAsli implements Layanan { public String sapa(String n) { return "Halo " + n; } }
enum Status { BARU, SELESAI }
class Gudang { List<Map<String, Integer>> isi; }
@Tabel("todo")
class Todo implements Comparable<Todo> {
    private final int id;
    @Wajib(pesan = "judul kosong") private String judul;
    private boolean selesai;
    public static int jumlah;
    Todo(int id, String judul) { this.id = id; this.judul = judul; }
    public Todo() { this(0, ""); }
    public int getId() { return id; }
    public String getJudul() { return judul; }
    public void setJudul(String judul) { this.judul = judul; }
    public boolean isSelesai() { return selesai; }
    private String rahasia() { return "rahasia " + id; }
    public void gagal() { throw new IllegalStateException("sengaja"); }
    public int compareTo(Todo o) { return id - o.id; }
}
class Contoh { void a() {} void b() {} void c() {} void d() {} void e() {} void f() {} }
