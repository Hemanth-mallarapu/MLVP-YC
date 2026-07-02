package com.mlvpyc;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class MlvpycApplication {
    public static void main(String[] args) {
        // Windows sometimes reports the timezone as the old alias "Asia/Calcutta",
        // which the Postgres Docker image doesn't recognize. Force the modern name.
        System.setProperty("user.timezone", "Asia/Kolkata");
        SpringApplication.run(MlvpycApplication.class, args);
    }
}
