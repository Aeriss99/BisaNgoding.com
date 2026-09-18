public class Main {
    public static void main(String[] args) {
        int hari = 6;

        String jenis = switch (hari) {
            case 1, 2, 3, 4, 5 -> "Hari kerja";
            case 6, 7 -> "Akhir pekan";
            default -> "Tidak valid";
        };

        System.out.println(jenis);
    }
}