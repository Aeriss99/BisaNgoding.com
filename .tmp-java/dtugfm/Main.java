public class Main {
    public static void main(String[] args) {
        Bentuk[] daftar = { new Persegi(), new PersegiPanjang() };
        for (Bentuk b : daftar) {
            System.out.println(b.luas());
        }
    }
}

class Bentuk {
    int luas() {
        return 0;
    }
}

class Persegi extends Bentuk {
    @Override
    int luas() {
        return 4 * 4;
    }
}

class PersegiPanjang extends Bentuk {
    @Override
    int luas() {
        return 5 * 3;
    }
}