public class Main {
    public static void main(String[] args) {
        Persegi p = new Persegi();
        p.sisi = 5;
        System.out.println(p.luas());
        p.info();

        Persegi q = new Persegi();
        q.sisi = 3;
        System.out.println(q.luas());
    }
}

class Persegi {
    int sisi;

    int luas() {
        return sisi * sisi;
    }

    void info() {
        System.out.println("Persegi dengan sisi " + sisi);
    }
}