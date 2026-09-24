public class Main {
    public static void main(String[] args) {
        Persegi p = new Persegi();
        System.out.println("Luas: " + p.luas());
    }
}

abstract class Bangun {
    abstract int luas();
}

class Persegi extends Bangun {
    @Override
    int luas() {
        return 7 * 7;
    }
}