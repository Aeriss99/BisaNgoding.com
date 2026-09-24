public class Main {
    public static void main(String[] args) {
        Manajer m = new Manajer();
        m.info();
    }
}

class Karyawan {
    void info() {
        System.out.println("Saya karyawan");
    }
}

class Manajer extends Karyawan {
    @Override
    void info() {
        System.out.println("Saya manajer");
    }
}