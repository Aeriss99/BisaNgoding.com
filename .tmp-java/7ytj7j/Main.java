public class Main {
    public static void main(String[] args) {
        Kucing a = new Kucing();
        a.nama = "Mimi";
        a.umur = 2;

        Kucing b = new Kucing();
        b.nama = "Oyen";
        b.umur = 4;

        System.out.println(a.nama + " - " + a.umur);
        System.out.println(b.nama + " - " + b.umur);

        Kucing c = a;
        c.nama = "Bulan";
        System.out.println(a.nama);
    }
}

class Kucing {
    String nama;
    int umur;
}