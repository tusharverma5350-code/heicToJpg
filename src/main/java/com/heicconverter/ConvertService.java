package com.heicconverter;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Paths;
import java.util.Base64;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

@Service
public class ConvertService {

    private static final Logger log = LoggerFactory.getLogger(ConvertService.class);
    private final File projectRoot = Paths.get("").toAbsolutePath().toFile();

    /**
     * Converts one HEIC file to JPEG asynchronously.
     *
     * @Async("conversionExecutor") means Spring runs this method on the
     * custom ThreadPoolTaskExecutor defined in AsyncConfig — NOT on the
     * Tomcat request thread. Multiple calls are truly parallel across
     * CPU cores.
     *
     * The CompletableFuture lets the caller (controller) collect many
     * results with CompletableFuture.allOf() without blocking each one.
     */
    @Async("conversionExecutor")
    public CompletableFuture<ConversionResult> convertAsync(MultipartFile file) {

        String originalName = file.getOriginalFilename() != null
                ? file.getOriginalFilename() : "unknown.heic";

        log.info("[IN]   {}  ({} KB)  thread={}",
                originalName, file.getSize() / 1024,
                Thread.currentThread().getName());   // will show "heic-convert-N"

        try {
            byte[] heicBytes  = file.getBytes();
            byte[] jpegBytes  = convertViaNode(heicBytes);
            String base64     = Base64.getEncoder().encodeToString(jpegBytes);
            String outputName = originalName.replaceAll("(?i)\\.(heic|heif)$", ".jpg");

            log.info("[OK]   {}  →  {}  ({} KB → {} KB)  thread={}",
                    originalName, outputName,
                    heicBytes.length / 1024, jpegBytes.length / 1024,
                    Thread.currentThread().getName());

            return CompletableFuture.completedFuture(
                    new ConversionResult(true, outputName, base64, null));

        } catch (Exception e) {
            log.error("[FAIL] {}  —  {}  thread={}",
                    originalName, e.getMessage(), Thread.currentThread().getName());

            return CompletableFuture.completedFuture(
                    new ConversionResult(false, originalName, null, e.getMessage()));
        }
    }

    /**
     * Spawns convert-helper.js as a subprocess.
     * stdin  ← raw HEIC bytes
     * stdout → raw JPEG bytes
     *
     * stdin, stdout, and stderr are all read on separate threads to
     * prevent pipe-buffer deadlocks when large files are processed.
     */
    private byte[] convertViaNode(byte[] heicBytes) throws Exception {

        ProcessBuilder pb = new ProcessBuilder("node", "convert-helper.js");
        pb.directory(projectRoot);

        Process process = pb.start();

        byte[][] outputs = new byte[2][];  // [0] = jpeg (stdout), [1] = errors (stderr)

        Thread stdinWriter = new Thread(() -> {
            try (OutputStream stdin = process.getOutputStream()) {
                stdin.write(heicBytes);
            } catch (IOException ignored) {}
        });

        Thread stderrReader = new Thread(() -> {
            try (InputStream err = process.getErrorStream()) {
                outputs[1] = err.readAllBytes();
            } catch (IOException e) {
                outputs[1] = new byte[0];
            }
        });

        stdinWriter.start();
        stderrReader.start();

        try (InputStream stdout = process.getInputStream()) {
            outputs[0] = stdout.readAllBytes();
        }

        stdinWriter.join();
        stderrReader.join();

        boolean finished = process.waitFor(2, TimeUnit.MINUTES);
        if (!finished) {
            process.destroyForcibly();
            throw new RuntimeException("Conversion timed out (> 2 min)");
        }

        if (process.exitValue() != 0) {
            String msg = (outputs[1] != null && outputs[1].length > 0)
                    ? new String(outputs[1], StandardCharsets.UTF_8).trim()
                    : "Node process exited with code " + process.exitValue();
            throw new RuntimeException(msg);
        }

        return outputs[0];
    }
}
