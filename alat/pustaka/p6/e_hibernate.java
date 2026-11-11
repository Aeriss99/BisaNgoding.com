//cp:hibernate-,jakarta.,jboss-logging,byte-buddy,antlr,jandex,classmate,istack,jaxb,txw2,h2,FastInfoset,stax,angus
import java.util.*;
import jakarta.persistence.*;
import org.hibernate.cfg.Configuration;

public class Main {
    public static void main(String[] args) {
        long t0 = System.currentTimeMillis();
        EntityManagerFactory emf = new Configuration()
            .addAnnotatedClass(Todo.class)
            .addAnnotatedClass(Kategori.class)
            .setProperty("hibernate.connection.url", "jdbc:h2:mem:todo;DB_CLOSE_DELAY=-1")
            .setProperty("hibernate.connection.username", "sa")
            .setProperty("hibernate.hbm2ddl.auto", "create")
            .setProperty("hibernate.show_sql", "true")
            .setProperty("hibernate.format_sql", "false")
            .buildSessionFactory();
        System.out.println("boot ms " + (System.currentTimeMillis() - t0));
        EntityManager em = emf.createEntityManager();
        em.getTransaction().begin();
        Kategori k = new Kategori("Kantor");
        em.persist(k);
        Todo t = new Todo("Belajar JPA", k);
        em.persist(t);
        em.persist(new Todo("Rapat tim", k));
        em.getTransaction().commit();
        System.out.println("id " + t.getId());
        em.clear();
        List<Todo> semua = em.createQuery("select t from Todo t where t.judul like :kata order by t.id", Todo.class).setParameter("kata", "%a%").getResultList();
        for (Todo x : semua) System.out.println(x.getId() + " " + x.getJudul() + " " + x.getKategori().getNama());
        Todo cari = em.find(Todo.class, 1L);
        em.getTransaction().begin(); cari.setSelesai(true); em.getTransaction().commit();
        System.out.println(em.createQuery("select count(t) from Todo t where t.selesai = true", Long.class).getSingleResult());
        em.close(); emf.close();
        System.out.println("ms " + (System.currentTimeMillis() - t0));
    }
}
@Entity
class Kategori {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) Long id;
    String nama;
    @OneToMany(mappedBy = "kategori") List<Todo> todos = new ArrayList<>();
    protected Kategori() {}
    Kategori(String nama) { this.nama = nama; }
    String getNama() { return nama; }
}
@Entity
@Table(name = "todo")
class Todo {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(nullable = false, length = 100) private String judul;
    private boolean selesai;
    @ManyToOne(fetch = FetchType.LAZY) private Kategori kategori;
    protected Todo() {}
    Todo(String judul, Kategori k) { this.judul = judul; this.kategori = k; }
    Long getId() { return id; }
    String getJudul() { return judul; }
    Kategori getKategori() { return kategori; }
    void setSelesai(boolean s) { selesai = s; }
}
