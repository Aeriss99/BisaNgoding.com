public class Main {
    public static void main(String[] args) {
        Mobil m1 = new Mobil();
        m1.merek = "Toyota";

        Mobil m2 = new Mobil();
        m2.merek = "Honda";

        System.out.println(m1.merek);
        System.out.println(m2.merek);
    }
}

class Mobil {
    String merek;
}