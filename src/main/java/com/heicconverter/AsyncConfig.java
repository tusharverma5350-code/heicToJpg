package com.heicconverter;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;

@Configuration
@EnableAsync  // activates Spring's @Async proxy for the whole application
public class AsyncConfig {

    private static final Logger log = LoggerFactory.getLogger(AsyncConfig.class);

    /**
     * Dedicated thread pool for HEIC → JPEG conversions.
     *
     * corePoolSize  = always-alive threads (one per CPU core)
     * maxPoolSize   = burst ceiling (2× cores)
     * queueCapacity = jobs that wait when all threads are busy
     */
    @Bean(name = "conversionExecutor")
    public Executor conversionExecutor() {
        int cores = Runtime.getRuntime().availableProcessors();

        ThreadPoolTaskExecutor exec = new ThreadPoolTaskExecutor();
        exec.setCorePoolSize(cores);
        exec.setMaxPoolSize(cores * 2);
        exec.setQueueCapacity(500);
        exec.setThreadNamePrefix("heic-convert-");
        exec.setWaitForTasksToCompleteOnShutdown(true);
        exec.setAwaitTerminationSeconds(60);
        exec.initialize();

        log.info("[ThreadPool] conversionExecutor ready — core={} max={} queue=500",
                cores, cores * 2);
        return exec;
    }
}
