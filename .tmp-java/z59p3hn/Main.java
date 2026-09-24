public class Main {
    public static void main(String[] args) {
        Motor m = new Motor();
        m.jalan();
        m.klakson();
    }
}

class Kendaraan {
    void jalan() {
        System.out.println("Kendaraan berjalan");
    }
}

class Motor extends Kendaraan {
    void klakson() {
        System.out.println("Tin tin!");
    }
}