public class Main {
    public static void main(String[] args) {
        Rekening r1 = new Rekening();
        r1.saldo = 1000;
        Rekening r2 = new Rekening();
        r2.saldo = 2500;
        System.out.println("Total: " + (r1.saldo + r2.saldo));
    }
}

class Rekening {
    int saldo;
}