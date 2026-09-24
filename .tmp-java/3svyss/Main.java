public class Main {
    public static void main(String[] args) {
        Hewan h = new Hewan("Hewan");
        h.suara();

        Anjing a = new Anjing("Doggy");
        a.suara();
    }
}

class Hewan {
    String nama;

    Hewan(String nama) {
        this.nama = nama;
    }

    void suara() {
        System.out.println(nama + " bersuara");
    }
}

class Anjing extends Hewan {
    Anjing(String nama) {
        super(nama);
    }

    @Override
    void suara() {
        super.suara();
        System.out.println(nama + " berkata: Guk!");
    }
}