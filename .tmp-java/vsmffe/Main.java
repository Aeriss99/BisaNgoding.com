public class Main {
    public static void main(String[] args) {
        int hari = 6;
        String jenis;

        switch (hari) {
            case 1:
            case 2:
            case 3:
            case 4:
            case 5:
                jenis = "Hari kerja";
                break;
            case 6:
            case 7:
                jenis = "Akhir pekan";
                break;
            default:
                jenis = "Tidak valid";
        }

        System.out.println(jenis);
    }
}