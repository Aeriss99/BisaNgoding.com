public class Main {
    public static void main(String[] args) {
        int bulan = 2;
        String musim = switch (bulan) {
            case 12, 1, 2 -> "Hujan";
            case 6, 7, 8 -> "Kemarau";
            default -> "Peralihan";
        };
        System.out.println(musim);
    }
}