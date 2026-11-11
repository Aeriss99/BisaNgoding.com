//cp:resilience4j-,vavr,slf4j-api
import java.time.Duration;
import java.util.*;
import java.util.function.*;
import io.github.resilience4j.circuitbreaker.*;
import io.github.resilience4j.retry.*;
import io.github.resilience4j.ratelimiter.*;
import io.github.resilience4j.bulkhead.*;

public class Main {
    static int panggilan = 0;
    public static void main(String[] args) {
        long t0 = System.currentTimeMillis();
        CircuitBreakerConfig cfg = CircuitBreakerConfig.custom().slidingWindowSize(4).minimumNumberOfCalls(4).failureRateThreshold(50).waitDurationInOpenState(Duration.ofMillis(200)).permittedNumberOfCallsInHalfOpenState(1).build();
        CircuitBreaker cb = CircuitBreaker.of("pembayaran", cfg);
        cb.getEventPublisher().onStateTransition(e -> System.out.println("transisi " + e.getStateTransition()));
        Supplier<String> rusak = CircuitBreaker.decorateSupplier(cb, () -> { panggilan++; throw new IllegalStateException("server mati"); });
        for (int i = 0; i < 6; i++) {
            try { rusak.get(); } catch (CallNotPermittedException e) { System.out.println("ditolak: " + e.getMessage()); } catch (IllegalStateException e) { System.out.println("gagal: " + e.getMessage()); }
        }
        System.out.println(cb.getState() + " " + panggilan + " " + cb.getMetrics().getFailureRate());
        try { Thread.sleep(300); } catch (InterruptedException e) {}
        System.out.println(cb.tryAcquirePermission() + " " + cb.getState());
        cb.onSuccess(0, java.util.concurrent.TimeUnit.MILLISECONDS);
        System.out.println(cb.getState());
        RetryConfig rc = RetryConfig.custom().maxAttempts(3).waitDuration(Duration.ofMillis(10)).build();
        Retry r = Retry.of("stok", rc);
        r.getEventPublisher().onRetry(e -> System.out.println("ulang ke-" + e.getNumberOfRetryAttempts() + " karena " + e.getLastThrowable().getMessage()));
        int[] n = {0};
        Supplier<String> kadang = Retry.decorateSupplier(r, () -> { n[0]++; if (n[0] < 3) throw new RuntimeException("timeout " + n[0]); return "berhasil di percobaan " + n[0]; });
        System.out.println(kadang.get());
        RateLimiter rl = RateLimiter.of("api", RateLimiterConfig.custom().limitForPeriod(2).limitRefreshPeriod(Duration.ofSeconds(10)).timeoutDuration(Duration.ZERO).build());
        for (int i = 0; i < 3; i++) System.out.println("izin " + rl.acquirePermission());
        Bulkhead b = Bulkhead.of("laporan", BulkheadConfig.custom().maxConcurrentCalls(1).maxWaitDuration(Duration.ZERO).build());
        System.out.println(b.tryAcquirePermission() + " " + b.tryAcquirePermission()); b.onComplete();
        Supplier<String> cadangan = () -> { try { return rusak.get(); } catch (Exception e) { return "cadangan: " + e.getClass().getSimpleName(); } };
        System.out.println(cadangan.get());
        System.out.println("ms " + (System.currentTimeMillis() - t0));
    }
}
