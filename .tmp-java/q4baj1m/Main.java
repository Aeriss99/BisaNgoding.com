public class Main {
    public static void main(String[] args) {
        Suhu s = new Suhu();
        s.set(-500);
        s.set(30);
        System.out.println(s.get());
    }
}

class Suhu {
    private int celcius;

    void set(int nilai) {
        if (nilai >= -273) {
            celcius = nilai;
        }
    }

    int get() {
        return celcius;
    }
}