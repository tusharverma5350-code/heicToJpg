package com.heicconverter;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

@RestController
public class ConvertController {

    private static final Logger log = LoggerFactory.getLogger(ConvertController.class);

    @Autowired
    private ConvertService convertService;

    /**
     * Single-file endpoint — called once per file by the frontend (Promise.all).
     *
     * Flow:
     *  1. Tomcat receives the request on its own thread.
     *  2. convertService.convertAsync() submits the job to the
     *     "conversionExecutor" ThreadPoolTaskExecutor and returns immediately.
     *  3. .get() blocks the Tomcat thread until the conversion thread finishes.
     *
     * Because each HTTP request runs on a separate Tomcat thread AND the
     * conversion itself runs on a separate heic-convert-N thread, the two
     * pools complement each other: Tomcat handles I/O, the custom pool
     * handles CPU-bound conversion.
     */
    @PostMapping("/api/convert")
    public ResponseEntity<Map<String, Object>> convertSingle(
            @RequestParam("file") MultipartFile file) {

        try {
            ConversionResult result = convertService.convertAsync(file).get();
            return ResponseEntity
                    .status(result.success ? 200 : 422)
                    .body(result.toMap());

        } catch (Exception e) {
            log.error("[controller] Unexpected error: {}", e.getMessage());
            Map<String, Object> err = new LinkedHashMap<>();
            err.put("success", false);
            err.put("error",   "Server error");
            err.put("details", e.getMessage());
            return ResponseEntity.status(500).body(err);
        }
    }

    /**
     * Batch endpoint — accepts ALL files in one request and converts them
     * ALL in parallel using CompletableFuture.allOf().
     *
     * Flow:
     *  1. Each file is submitted to the conversionExecutor via @Async.
     *     All CompletableFutures are collected immediately (non-blocking).
     *  2. CompletableFuture.allOf(...).join() waits for EVERY conversion
     *     to finish — the thread pool runs them all at the same time.
     *  3. Results are gathered in original file order and returned as JSON.
     *
     * This is true parallel execution — N files = N jobs running
     * simultaneously on N threads (up to maxPoolSize).
     */
    @PostMapping("/api/convert-batch")
    public ResponseEntity<Map<String, Object>> convertBatch(
            @RequestParam("files") MultipartFile[] files) {

        log.info("[BATCH] {} files received — submitting all to conversionExecutor", files.length);

        // Submit every file to the thread pool at once — all start immediately
        List<CompletableFuture<ConversionResult>> futures = Arrays.stream(files)
                .map(convertService::convertAsync)   // @Async → runs on heic-convert-N thread
                .collect(Collectors.toList());

        // Wait for all conversions to complete (non-blocking between them)
        CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();

        // Collect results in original upload order
        List<Map<String, Object>> results = futures.stream()
                .map(f -> f.join().toMap())
                .collect(Collectors.toList());

        long succeeded = results.stream().filter(r -> Boolean.TRUE.equals(r.get("success"))).count();
        log.info("[BATCH] Done — {}/{} converted successfully", succeeded, files.length);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("files", results);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/api/health")
    public Map<String, Object> health() {
        return Map.of("ok", true, "server", "Java/Spring Boot + ThreadPoolTaskExecutor");
    }
}
