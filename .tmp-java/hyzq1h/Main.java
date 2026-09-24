public class Main {
    public static void main(String[] args) {
        Hewan[] daftar = { new Kucing(), new Anjing(), new Hewan() };

        for (Hewan h : daftar) {
            h.suara();
        }
    }
}

class Hewan {
    void suara() {
        System.out.println("Hewan bersuara");
    }
}

class Kucing extends Hewan {
    @Override
    void suara() {
        System.out.println("Meong!");
    }
}

class Anjing extends Hewan {
    @Override
    void suara() {
        System.out.println("Guk!");
    }
}