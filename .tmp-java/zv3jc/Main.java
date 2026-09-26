public class Main {
    public static void main(String[] args) {
        Akun a = new Akun();
        a.setor(500);
        a.setor(-100);
        System.out.println(a.getSaldo());
        a.tarik(200);
        System.out.println(a.getSaldo());
    }
}

class Akun {
    private int saldo;

    void setor(int jumlah) {
        if (jumlah > 0) {
            saldo += jumlah;
        }
    }

    void tarik(int jumlah) {
        if (jumlah > 0 && jumlah <= saldo) {
            saldo -= jumlah;
        }
    }

    int getSaldo() {
        return saldo;
    }
}