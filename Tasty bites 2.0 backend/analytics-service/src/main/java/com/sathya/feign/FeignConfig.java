package com.sathya.feign;

import feign.RequestInterceptor;
import io.micrometer.tracing.Tracer;
import io.micrometer.tracing.Span;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class FeignConfig {

    @Bean
    public RequestInterceptor feignTracingInterceptor(Tracer tracer) {
        return requestTemplate -> {
            Span currentSpan = tracer.currentSpan();
            if (currentSpan != null) {
                requestTemplate.header("traceparent", currentSpan.context().traceId());
                requestTemplate.header("X-B3-TraceId", currentSpan.context().traceId());
                requestTemplate.header("X-B3-SpanId", currentSpan.context().spanId());
                requestTemplate.header("X-B3-Sampled", currentSpan.context().sampled() ? "1" : "0");
            }
        };
    }
}
