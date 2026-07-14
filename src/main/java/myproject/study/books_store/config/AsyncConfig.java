package myproject.study.books_store.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;

/**
 * Enable async event processing
 */
@Configuration
@EnableAsync
public class AsyncConfig {
    // Default async executor will be used
}
