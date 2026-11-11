package com.bisangoding.web;

import java.io.*;
import java.lang.reflect.*;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.*;

import jakarta.servlet.*;
import jakarta.servlet.annotation.WebFilter;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;

/**
 * Server servlet kecil untuk latihan di editor (tanpa jaringan), mirip MockMvc/MockHttpServletRequest.
 * Servlet dan filter dijalankan sungguhan; request dan response dibuat di memori.
 *
 * <pre>
 * ServerUji server = new ServerUji();
 * server.tambah(new HaloServlet());                 // membaca @WebServlet("/halo")
 * server.cetak("GET", "/halo?nama=Sari");           // mencetak status, header, dan isi
 * Respons r = server.kirim("POST", "/todo", "judul=Belajar");
 * </pre>
 *
 * Server mengingat cookie seperti browser, sehingga session bertahan antar permintaan.
 * Id session dibuat berurutan (SESI1, SESI2, ...) supaya hasil latihan selalu sama.
 */
public class ServerUji {
    private final Map<String, HttpServlet> servlet = new LinkedHashMap<>();
    private final List<String[]> polaFilter = new ArrayList<>();
    private final List<Filter> filter = new ArrayList<>();
    private final Set<Object> sudahInit = new HashSet<>();
    private final Map<String, String> cookieBrowser = new TreeMap<>();
    private final Map<String, Sesi> sesi = new HashMap<>();
    private final Map<String, Object> atributKonteks = new TreeMap<>();
    private final Map<String, String> parameterKonteks = new TreeMap<>();
    private final ServletContext konteks;
    private int nomorSesi;

    public ServerUji() {
        konteks = proxy(ServletContext.class, (m, a) -> {
            switch (m.getName()) {
                case "getAttribute": return atributKonteks.get(a[0]);
                case "setAttribute": atributKonteks.put((String) a[0], a[1]); return null;
                case "removeAttribute": atributKonteks.remove(a[0]); return null;
                case "getAttributeNames": return Collections.enumeration(atributKonteks.keySet());
                case "getInitParameter": return parameterKonteks.get(a[0]);
                case "getInitParameterNames": return Collections.enumeration(parameterKonteks.keySet());
                case "getContextPath": return "";
                case "getServerInfo": return "ServerUji/1.0";
                case "getMajorVersion": return 5;
                case "getMinorVersion": return 0;
                case "log": System.out.println("[log] " + a[0]); return null;
                default: return belumDidukung("ServletContext", m);
            }
        });
    }

    /** Daftarkan servlet atau filter yang punya anotasi @WebServlet atau @WebFilter. */
    public ServerUji tambah(Object komponen) {
        WebServlet ws = komponen.getClass().getAnnotation(WebServlet.class);
        WebFilter wf = komponen.getClass().getAnnotation(WebFilter.class);
        if (ws != null && komponen instanceof HttpServlet) {
            String[] pola = ws.value().length > 0 ? ws.value() : ws.urlPatterns();
            for (String p : pola) {
                tambahServlet(p, (HttpServlet) komponen);
            }
        } else if (wf != null && komponen instanceof Filter) {
            String[] pola = wf.value().length > 0 ? wf.value() : wf.urlPatterns();
            tambahFilter(pola.length > 0 ? pola[0] : "/*", (Filter) komponen);
        } else {
            throw new IllegalArgumentException(komponen.getClass().getSimpleName() + " tidak punya @WebServlet atau @WebFilter");
        }
        return this;
    }

    /** Daftarkan servlet pada pola URL: "/halo" (tepat), "/api/todo/*" (awalan), atau "/" (sisanya). */
    public ServerUji tambahServlet(String pola, HttpServlet s) {
        servlet.put(pola, s);
        return this;
    }

    /** Daftarkan filter pada pola URL, misalnya "/*" atau "/admin/*". Urutan pendaftaran = urutan jalan. */
    public ServerUji tambahFilter(String pola, Filter f) {
        polaFilter.add(new String[] {pola});
        filter.add(f);
        return this;
    }

    /** Parameter konteks, seperti context-param di web.xml. */
    public ServerUji parameterKonteks(String nama, String nilai) {
        parameterKonteks.put(nama, nilai);
        return this;
    }

    public ServletContext konteks() {
        return konteks;
    }

    public Respons kirim(String metode, String alamat) {
        return kirim(metode, alamat, null, null, Collections.<String, String>emptyMap());
    }

    /** Kirim dengan isi form (application/x-www-form-urlencoded), misalnya "judul=Belajar&amp;prioritas=2". */
    public Respons kirim(String metode, String alamat, String form) {
        return kirim(metode, alamat, form, "application/x-www-form-urlencoded", Collections.<String, String>emptyMap());
    }

    /** Kirim dengan isi JSON (application/json). */
    public Respons kirimJson(String metode, String alamat, String json) {
        return kirim(metode, alamat, json, "application/json", Collections.<String, String>emptyMap());
    }

    /** Kirim dengan header tambahan, misalnya Authorization. */
    public Respons kirim(String metode, String alamat, String isi, String tipeIsi, Map<String, String> header) {
        Permintaan p = new Permintaan(metode.toUpperCase(), alamat, isi, tipeIsi, header);
        Jawaban j = new Jawaban();
        jalankan(p, j);
        Respons r = j.selesai();
        for (Map.Entry<String, List<String>> e : r.header.entrySet()) {
            if (e.getKey().equalsIgnoreCase("Set-Cookie")) {
                for (String c : e.getValue()) {
                    String[] nv = c.split(";")[0].split("=", 2);
                    if (c.contains("Max-Age=0")) {
                        cookieBrowser.remove(nv[0]);
                    } else {
                        cookieBrowser.put(nv[0], nv.length > 1 ? nv[1] : "");
                    }
                }
            }
        }
        return r;
    }

    /** Kirim lalu cetak hasilnya seperti curl -i. */
    public void cetak(String metode, String alamat) {
        System.out.println(metode + " " + alamat);
        System.out.println(kirim(metode, alamat));
    }

    public void cetak(String metode, String alamat, String form) {
        System.out.println(metode + " " + alamat + "  [" + form + "]");
        System.out.println(kirim(metode, alamat, form));
    }

    public void cetakJson(String metode, String alamat, String json) {
        System.out.println(metode + " " + alamat + "  " + json);
        System.out.println(kirimJson(metode, alamat, json));
    }

    /** Hapus cookie yang disimpan, seperti membuka browser baru. */
    public void lupakanCookie() {
        cookieBrowser.clear();
    }

    /** Matikan server: panggil destroy() pada semua servlet dan filter yang sudah dijalankan. */
    public void matikan() {
        for (Filter f : filter) {
            if (sudahInit.contains(f)) {
                f.destroy();
            }
        }
        for (HttpServlet s : new LinkedHashSet<>(servlet.values())) {
            if (sudahInit.contains(s)) {
                s.destroy();
            }
        }
        sudahInit.clear();
    }

    // ------------------------------------------------------------------ inti

    private void jalankan(Permintaan p, Jawaban j) {
        String path = p.path;
        String cocok = null;
        String pathInfo = null;
        if (servlet.containsKey(path)) {
            cocok = path;
        } else {
            int terpanjang = -1;
            for (String pola : servlet.keySet()) {
                if (pola.endsWith("/*")) {
                    String awal = pola.substring(0, pola.length() - 2);
                    if ((path.equals(awal) || path.startsWith(awal + "/")) && awal.length() > terpanjang) {
                        terpanjang = awal.length();
                        cocok = pola;
                        pathInfo = path.length() > awal.length() ? path.substring(awal.length()) : null;
                    }
                }
            }
            if (cocok == null && servlet.containsKey("/")) {
                cocok = "/";
            }
        }
        p.servletPath = cocok == null ? path : (cocok.endsWith("/*") ? cocok.substring(0, cocok.length() - 2) : path);
        p.pathInfo = pathInfo;
        HttpServletRequest req = p.buat();
        HttpServletResponse res = j.buat();
        final HttpServlet tujuan = cocok == null ? null : servlet.get(cocok);
        List<Filter> rantai = new ArrayList<>();
        for (int i = 0; i < filter.size(); i++) {
            if (cocokPola(polaFilter.get(i)[0], path)) {
                rantai.add(filter.get(i));
            }
        }
        try {
            for (Filter f : rantai) {
                if (sudahInit.add(f)) {
                    f.init(konfigFilter(f));
                }
            }
            if (tujuan != null && sudahInit.add(tujuan)) {
                tujuan.init(konfigServlet(tujuan));
            }
            new Rantai(rantai, tujuan).doFilter(req, res);
        } catch (Throwable e) {
            Throwable asli = e instanceof ServletException && e.getCause() != null ? e.getCause() : e;
            j.galat(500, asli.getClass().getSimpleName() + (asli.getMessage() == null ? "" : ": " + asli.getMessage()));
        }
    }

    private static boolean cocokPola(String pola, String path) {
        if (pola.equals("/*") || pola.equals("/")) {
            return true;
        }
        if (pola.endsWith("/*")) {
            String awal = pola.substring(0, pola.length() - 2);
            return path.equals(awal) || path.startsWith(awal + "/");
        }
        if (pola.startsWith("*.")) {
            return path.endsWith(pola.substring(1));
        }
        return pola.equals(path);
    }

    private final class Rantai implements FilterChain {
        private final List<Filter> sisa;
        private final HttpServlet tujuan;
        private int ke;

        Rantai(List<Filter> sisa, HttpServlet tujuan) {
            this.sisa = sisa;
            this.tujuan = tujuan;
        }

        @Override
        public void doFilter(ServletRequest req, ServletResponse res) throws IOException, ServletException {
            if (ke < sisa.size()) {
                sisa.get(ke++).doFilter(req, res, this);
            } else if (tujuan != null) {
                tujuan.service(req, res);
            } else {
                ((HttpServletResponse) res).sendError(404);
            }
        }
    }

    private ServletConfig konfigServlet(HttpServlet s) {
        WebServlet ws = s.getClass().getAnnotation(WebServlet.class);
        Map<String, String> param = new TreeMap<>();
        if (ws != null) {
            for (jakarta.servlet.annotation.WebInitParam ip : ws.initParams()) {
                param.put(ip.name(), ip.value());
            }
        }
        String nama = ws != null && !ws.name().isEmpty() ? ws.name() : s.getClass().getSimpleName();
        return proxy(ServletConfig.class, (m, a) -> {
            switch (m.getName()) {
                case "getServletName": return nama;
                case "getServletContext": return konteks;
                case "getInitParameter": return param.get(a[0]);
                case "getInitParameterNames": return Collections.enumeration(param.keySet());
                default: return belumDidukung("ServletConfig", m);
            }
        });
    }

    private FilterConfig konfigFilter(Filter f) {
        return proxy(FilterConfig.class, (m, a) -> {
            switch (m.getName()) {
                case "getFilterName": return f.getClass().getSimpleName();
                case "getServletContext": return konteks;
                case "getInitParameter": return null;
                case "getInitParameterNames": return Collections.emptyEnumeration();
                default: return belumDidukung("FilterConfig", m);
            }
        });
    }

    // ------------------------------------------------------------------ request

    private final class Permintaan {
        final String metode;
        final String path;
        final String query;
        final String isi;
        final String tipeIsi;
        final Map<String, List<String>> header = new TreeMap<>(String.CASE_INSENSITIVE_ORDER);
        final Map<String, List<String>> param = new LinkedHashMap<>();
        final Map<String, Object> atribut = new TreeMap<>();
        String servletPath;
        String pathInfo;
        String charset = "UTF-8";
        Sesi sesiIni;
        boolean isiDibaca;

        Permintaan(String metode, String alamat, String isi, String tipeIsi, Map<String, String> tambahan) {
            this.metode = metode;
            int t = alamat.indexOf('?');
            this.path = t < 0 ? alamat : alamat.substring(0, t);
            this.query = t < 0 ? null : alamat.substring(t + 1);
            this.isi = isi;
            this.tipeIsi = tipeIsi;
            if (query != null) {
                uraikan(query);
            }
            if (isi != null && "application/x-www-form-urlencoded".equals(tipeIsi)) {
                uraikan(isi);
            }
            header.put("Host", Collections.singletonList("localhost:8080"));
            if (tipeIsi != null) {
                header.put("Content-Type", Collections.singletonList(tipeIsi + ";charset=UTF-8"));
            }
            if (!cookieBrowser.isEmpty()) {
                StringBuilder sb = new StringBuilder();
                for (Map.Entry<String, String> c : cookieBrowser.entrySet()) {
                    if (sb.length() > 0) {
                        sb.append("; ");
                    }
                    sb.append(c.getKey()).append('=').append(c.getValue());
                }
                header.put("Cookie", Collections.singletonList(sb.toString()));
            }
            for (Map.Entry<String, String> h : tambahan.entrySet()) {
                header.put(h.getKey(), Collections.singletonList(h.getValue()));
            }
            String id = cookieBrowser.get("JSESSIONID");
            if (id != null && sesi.containsKey(id) && sesi.get(id).aktif) {
                sesiIni = sesi.get(id);
                sesiIni.baru = false;
            }
        }

        private void uraikan(String teks) {
            for (String bagian : teks.split("&")) {
                if (bagian.isEmpty()) {
                    continue;
                }
                String[] nv = bagian.split("=", 2);
                try {
                    String n = URLDecoder.decode(nv[0], "UTF-8");
                    String v = nv.length > 1 ? URLDecoder.decode(nv[1], "UTF-8") : "";
                    param.computeIfAbsent(n, k -> new ArrayList<>()).add(v);
                } catch (UnsupportedEncodingException e) {
                    throw new IllegalStateException(e);
                }
            }
        }

        HttpServletRequest buat() {
            final Object[] diri = new Object[1];
            HttpServletRequest r = proxy(HttpServletRequest.class, (m, a) -> {
                switch (m.getName()) {
                    case "getMethod": return metode;
                    case "getRequestURI": return path;
                    case "getRequestURL": return new StringBuffer("http://localhost:8080" + path);
                    case "getServletPath": return servletPath;
                    case "getPathInfo": return pathInfo;
                    case "getContextPath": return "";
                    case "getQueryString": return query;
                    case "getProtocol": return "HTTP/1.1";
                    case "getScheme": return "http";
                    case "getServerName": return "localhost";
                    case "getServerPort": return 8080;
                    case "getRemoteAddr": return "127.0.0.1";
                    case "getRemoteHost": return "127.0.0.1";
                    case "isSecure": return false;
                    case "getLocale": return Locale.US;
                    case "getDispatcherType": return DispatcherType.REQUEST;
                    case "getServletContext": return konteks;
                    case "getParameter": {
                        List<String> v = param.get(a[0]);
                        return v == null ? null : v.get(0);
                    }
                    case "getParameterValues": {
                        List<String> v = param.get(a[0]);
                        return v == null ? null : v.toArray(new String[0]);
                    }
                    case "getParameterNames": return Collections.enumeration(param.keySet());
                    case "getParameterMap": {
                        Map<String, String[]> hasil = new LinkedHashMap<>();
                        for (Map.Entry<String, List<String>> e : param.entrySet()) {
                            hasil.put(e.getKey(), e.getValue().toArray(new String[0]));
                        }
                        return Collections.unmodifiableMap(hasil);
                    }
                    case "getHeader": {
                        List<String> v = header.get(a[0]);
                        return v == null ? null : v.get(0);
                    }
                    case "getHeaders": {
                        List<String> v = header.get(a[0]);
                        return Collections.enumeration(v == null ? Collections.<String>emptyList() : v);
                    }
                    case "getHeaderNames": return Collections.enumeration(header.keySet());
                    case "getIntHeader": {
                        List<String> v = header.get(a[0]);
                        return v == null ? -1 : Integer.parseInt(v.get(0));
                    }
                    case "getContentType": return tipeIsi == null ? null : tipeIsi + ";charset=UTF-8";
                    case "getContentLength": return isi == null ? -1 : isi.getBytes(StandardCharsets.UTF_8).length;
                    case "getContentLengthLong": return isi == null ? -1L : (long) isi.getBytes(StandardCharsets.UTF_8).length;
                    case "getCharacterEncoding": return charset;
                    case "setCharacterEncoding": charset = (String) a[0]; return null;
                    case "getReader": return new BufferedReader(new StringReader(bacaIsi()));
                    case "getInputStream": return masukan(bacaIsi());
                    case "getAttribute": return atribut.get(a[0]);
                    case "setAttribute": atribut.put((String) a[0], a[1]); return null;
                    case "removeAttribute": atribut.remove(a[0]); return null;
                    case "getAttributeNames": return Collections.enumeration(atribut.keySet());
                    case "getCookies": {
                        if (cookieBrowser.isEmpty()) {
                            return null;
                        }
                        List<Cookie> c = new ArrayList<>();
                        for (Map.Entry<String, String> e : cookieBrowser.entrySet()) {
                            c.add(new Cookie(e.getKey(), e.getValue()));
                        }
                        return c.toArray(new Cookie[0]);
                    }
                    case "getSession":
                        if (a == null || a.length == 0 || (Boolean) a[0]) {
                            if (sesiIni == null || !sesiIni.aktif) {
                                nomorSesi++;
                                sesiIni = new Sesi("SESI" + nomorSesi);
                                sesi.put(sesiIni.id, sesiIni);
                                sesiIni.cookieBaru = true;
                            }
                            return sesiIni.http;
                        }
                        return sesiIni == null || !sesiIni.aktif ? null : sesiIni.http;
                    case "getRequestedSessionId": return cookieBrowser.get("JSESSIONID");
                    case "isRequestedSessionIdValid": return sesiIni != null && sesiIni.aktif;
                    case "changeSessionId": return sesiIni == null ? null : sesiIni.id;
                    case "getUserPrincipal": return null;
                    case "getRemoteUser": return null;
                    case "isUserInRole": return false;
                    case "getAuthType": return null;
                    default: return belumDidukung("HttpServletRequest", m);
                }
            });
            diri[0] = r;
            return r;
        }

        private String bacaIsi() {
            if (isiDibaca) {
                throw new IllegalStateException("isi request hanya bisa dibaca sekali");
            }
            isiDibaca = true;
            return isi == null ? "" : isi;
        }
    }

    private static ServletInputStream masukan(String isi) {
        final ByteArrayInputStream in = new ByteArrayInputStream(isi.getBytes(StandardCharsets.UTF_8));
        return new ServletInputStream() {
            @Override
            public int read() {
                return in.read();
            }

            @Override
            public boolean isFinished() {
                return in.available() == 0;
            }

            @Override
            public boolean isReady() {
                return true;
            }

            @Override
            public void setReadListener(ReadListener l) {
                throw new UnsupportedOperationException("ServerUji tidak mendukung I/O asinkron");
            }
        };
    }

    // ------------------------------------------------------------------ session

    private final class Sesi {
        final String id;
        final Map<String, Object> atribut = new TreeMap<>();
        final HttpSession http;
        boolean aktif = true;
        boolean baru = true;
        boolean cookieBaru;
        int maksimalDiam = 1800;

        Sesi(String id) {
            this.id = id;
            this.http = proxy(HttpSession.class, (m, a) -> {
                if (!aktif && !m.getName().equals("getId")) {
                    throw new IllegalStateException("session sudah di-invalidate");
                }
                switch (m.getName()) {
                    case "getId": return this.id;
                    case "getAttribute": return atribut.get(a[0]);
                    case "setAttribute":
                        if (a[1] == null) {
                            atribut.remove(a[0]);
                        } else {
                            atribut.put((String) a[0], a[1]);
                        }
                        return null;
                    case "removeAttribute": atribut.remove(a[0]); return null;
                    case "getAttributeNames": return Collections.enumeration(new ArrayList<>(atribut.keySet()));
                    case "invalidate": aktif = false; atribut.clear(); return null;
                    case "isNew": return baru;
                    case "getMaxInactiveInterval": return maksimalDiam;
                    case "setMaxInactiveInterval": maksimalDiam = (Integer) a[0]; return null;
                    case "getServletContext": return konteks;
                    case "getCreationTime": return 0L;
                    case "getLastAccessedTime": return 0L;
                    default: return belumDidukung("HttpSession", m);
                }
            });
        }
    }

    // ------------------------------------------------------------------ response

    private final class Jawaban {
        int status = 200;
        String tipe;
        String charset;
        final Map<String, List<String>> header = new TreeMap<>(String.CASE_INSENSITIVE_ORDER);
        final StringWriter tulisan = new StringWriter();
        final ByteArrayOutputStream bita = new ByteArrayOutputStream();
        PrintWriter writer;
        boolean pakaiStream;
        String pesanGalat;
        Sesi sesiDipakai;

        HttpServletResponse buat() {
            return proxy(HttpServletResponse.class, (m, a) -> {
                switch (m.getName()) {
                    case "setStatus": status = (Integer) a[0]; return null;
                    case "getStatus": return status;
                    case "sendError":
                        status = (Integer) a[0];
                        pesanGalat = a.length > 1 ? (String) a[1] : null;
                        return null;
                    case "sendRedirect":
                        status = 302;
                        header.put("Location", new ArrayList<>(Collections.singletonList((String) a[0])));
                        return null;
                    case "setContentType": {
                        String t = (String) a[0];
                        int i = t == null ? -1 : t.toLowerCase().indexOf(";charset=");
                        if (i >= 0) {
                            charset = t.substring(i + 9).trim();
                            tipe = t.substring(0, i).trim();
                        } else {
                            tipe = t;
                        }
                        return null;
                    }
                    case "getContentType": return tipe == null ? null : tipe + (charset == null ? "" : ";charset=" + charset);
                    case "setCharacterEncoding": charset = (String) a[0]; return null;
                    case "getCharacterEncoding": return charset == null ? "ISO-8859-1" : charset;
                    case "setHeader": header.put((String) a[0], new ArrayList<>(Collections.singletonList((String) a[1]))); return null;
                    case "addHeader": header.computeIfAbsent((String) a[0], k -> new ArrayList<>()).add((String) a[1]); return null;
                    case "setIntHeader": header.put((String) a[0], new ArrayList<>(Collections.singletonList(String.valueOf(a[1])))); return null;
                    case "addIntHeader": header.computeIfAbsent((String) a[0], k -> new ArrayList<>()).add(String.valueOf(a[1])); return null;
                    case "getHeader": {
                        List<String> v = header.get(a[0]);
                        return v == null ? null : v.get(0);
                    }
                    case "getHeaders": {
                        List<String> v = header.get(a[0]);
                        return v == null ? Collections.<String>emptyList() : new ArrayList<>(v);
                    }
                    case "getHeaderNames": return new ArrayList<>(header.keySet());
                    case "containsHeader": return header.containsKey(a[0]);
                    case "addCookie": {
                        Cookie c = (Cookie) a[0];
                        StringBuilder sb = new StringBuilder(c.getName() + "=" + c.getValue());
                        if (c.getMaxAge() >= 0) {
                            sb.append("; Max-Age=").append(c.getMaxAge());
                        }
                        if (c.getPath() != null) {
                            sb.append("; Path=").append(c.getPath());
                        }
                        if (c.isHttpOnly()) {
                            sb.append("; HttpOnly");
                        }
                        if (c.getSecure()) {
                            sb.append("; Secure");
                        }
                        header.computeIfAbsent("Set-Cookie", k -> new ArrayList<>()).add(sb.toString());
                        return null;
                    }
                    case "getWriter":
                        if (pakaiStream) {
                            throw new IllegalStateException("getOutputStream() sudah dipanggil");
                        }
                        if (charset == null) {
                            charset = "ISO-8859-1";
                        }
                        if (writer == null) {
                            writer = new PrintWriter(tulisan);
                        }
                        return writer;
                    case "getOutputStream":
                        if (writer != null) {
                            throw new IllegalStateException("getWriter() sudah dipanggil");
                        }
                        pakaiStream = true;
                        return new ServletOutputStream() {
                            @Override
                            public void write(int b) {
                                bita.write(b);
                            }

                            @Override
                            public boolean isReady() {
                                return true;
                            }

                            @Override
                            public void setWriteListener(WriteListener l) {
                                throw new UnsupportedOperationException("ServerUji tidak mendukung I/O asinkron");
                            }
                        };
                    case "setContentLength": return null;
                    case "setContentLengthLong": return null;
                    case "isCommitted": return false;
                    case "flushBuffer": return null;
                    case "resetBuffer": tulisan.getBuffer().setLength(0); bita.reset(); return null;
                    case "reset": tulisan.getBuffer().setLength(0); bita.reset(); header.clear(); status = 200; return null;
                    case "setLocale": return null;
                    case "getLocale": return Locale.US;
                    case "setBufferSize": return null;
                    case "getBufferSize": return 8192;
                    default: return belumDidukung("HttpServletResponse", m);
                }
            });
        }

        void galat(int kode, String pesan) {
            status = kode;
            pesanGalat = pesan;
        }

        Respons selesai() {
            if (writer != null) {
                writer.flush();
            }
            String isi = pakaiStream ? new String(bita.toByteArray(), StandardCharsets.UTF_8) : tulisan.toString();
            if (pesanGalat != null || (status >= 400 && isi.isEmpty())) {
                isi = pesanGalat != null ? pesanGalat : alasan(status);
                tipe = "text/plain";
                charset = "UTF-8";
            }
            Map<String, List<String>> h = new TreeMap<>(header);
            if (tipe != null) {
                h.put("Content-Type", Collections.singletonList(tipe + (charset == null ? "" : ";charset=" + charset)));
            }
            for (Sesi s : sesi.values()) {
                if (s.cookieBaru) {
                    h.computeIfAbsent("Set-Cookie", k -> new ArrayList<>()).add("JSESSIONID=" + s.id + "; Path=/; HttpOnly");
                    s.cookieBaru = false;
                }
            }
            return new Respons(status, h, isi);
        }
    }

    static String alasan(int status) {
        switch (status) {
            case 200: return "OK";
            case 201: return "Created";
            case 204: return "No Content";
            case 302: return "Found";
            case 400: return "Bad Request";
            case 401: return "Unauthorized";
            case 403: return "Forbidden";
            case 404: return "Not Found";
            case 405: return "Method Not Allowed";
            case 409: return "Conflict";
            case 422: return "Unprocessable Content";
            case 500: return "Internal Server Error";
            default: return "";
        }
    }

    // ------------------------------------------------------------------ bantuan

    private interface Isi {
        Object jalankan(Method m, Object[] a) throws Throwable;
    }

    @SuppressWarnings("unchecked")
    private static <T> T proxy(Class<T> jenis, Isi isi) {
        return (T) Proxy.newProxyInstance(ServerUji.class.getClassLoader(), new Class<?>[] {jenis}, (p, m, a) -> {
            switch (m.getName()) {
                case "toString": return jenis.getSimpleName() + " (ServerUji)";
                case "hashCode": return System.identityHashCode(p);
                case "equals": return p == a[0];
                default: return isi.jalankan(m, a);
            }
        });
    }

    private static Object belumDidukung(String jenis, Method m) {
        if (m.isDefault()) {
            throw new UnsupportedOperationException(jenis + "." + m.getName() + " belum didukung ServerUji");
        }
        Class<?> r = m.getReturnType();
        if (r == boolean.class) {
            return false;
        }
        if (r == int.class || r == long.class) {
            return r == int.class ? (Object) 0 : (Object) 0L;
        }
        if (r == void.class) {
            return null;
        }
        throw new UnsupportedOperationException(jenis + "." + m.getName() + " belum didukung ServerUji");
    }
}
