public class Main {
    public static void main(String[] args) {
        Segitiga s = new Segitiga();
        s.alas = 10;
        s.tinggi = 6;
        System.out.println("Luas: " + s.luas());
    }
}

class Segitiga {
    int alas;
    int tinggi;

    int luas() {
        return alas * tinggi / 2;
    }
}