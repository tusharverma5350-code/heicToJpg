package com.heicconverter;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Global CORS configuration — applied at the MVC filter level, before any
 * handler mapping.  This is more reliable than @CrossOrigin on controllers
 * because it also covers OPTIONS preflight requests that haven't been matched
 * to a handler yet (which is the typical cause of 403 on preflight).
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                // allowedOriginPatterns supports wildcards; covers localhost AND 127.0.0.1
                // on any dev port without having to list them individually.
                .allowedOriginPatterns(
                        "http://localhost:*",
                        "http://127.0.0.1:*"
                )
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(false)
                .maxAge(3600);   // cache preflight for 1 hour
    }
}
