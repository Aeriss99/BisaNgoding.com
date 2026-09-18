public class Main {
    public static void main(String[] args) {
        Kucing k = new Kucing();
        k.nama = "Mimi";
        k.makan();
        k.mengeong();
    }
}

class Hewan {
    String nama;

    void makan() {
        System.out.println(nama + " sedang makan");
    }
}

class Kucing extends Hewan {
    void mengeong() {
        System.out.println(nama + " berkata: Meong!");
    }
}