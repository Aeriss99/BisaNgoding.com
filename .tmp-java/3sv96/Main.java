public class Main {
    public static void main(String[] args) {
        Laptop l = new Laptop();
        l.merek = "Asus";
        l.ram = 8;
        System.out.println(l.merek + " " + l.ram + "GB");
    }
}

class Laptop {
    String merek;
    int ram;
}