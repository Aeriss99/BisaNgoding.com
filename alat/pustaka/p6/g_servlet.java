//cp:jakarta.servlet-api
import java.io.*;
import java.lang.reflect.*;
import java.util.*;
import jakarta.servlet.*;
import jakarta.servlet.http.*;

public class Main {
    public static void main(String[] args) throws Exception {
        HttpServletRequest req = (HttpServletRequest) Proxy.newProxyInstance(Main.class.getClassLoader(), new Class<?>[]{HttpServletRequest.class}, (o, m, a) -> {
            switch (m.getName()) { case "getMethod": return "GET"; case "getParameter": return "nama".equals(a[0]) ? "Sari" : null; case "getRequestURI": return "/halo"; default: return null; }
        });
        StringWriter sw = new StringWriter(); int[] status = {200};
        HttpServletResponse res = (HttpServletResponse) Proxy.newProxyInstance(Main.class.getClassLoader(), new Class<?>[]{HttpServletResponse.class}, (o, m, a) -> {
            switch (m.getName()) { case "getWriter": return new PrintWriter(sw); case "setStatus": status[0] = (Integer) a[0]; return null; default: return null; }
        });
        new Halo().service(req, res);
        System.out.println(status[0] + " " + sw);
    }
}
class Halo extends HttpServlet {
    @Override protected void doGet(HttpServletRequest req, HttpServletResponse res) throws IOException {
        res.setContentType("text/plain");
        res.getWriter().print("Halo " + req.getParameter("nama"));
    }
}
