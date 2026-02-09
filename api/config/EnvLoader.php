<?php

class EnvLoader {
    private static $loaded = false;
    
    public static function load($path = null) {
        if (self::$loaded) return;
        
        if ($path === null) {
            $path = __DIR__ . '/../../.env';
        }
        
        if (!file_exists($path)) {
            return;
        }
        
        $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            if (strpos(trim($line), '#') === 0) continue;
            
            list($name, $value) = explode('=', $line, 2);
            $name = trim($name);
            $value = trim($value);
            
            if (!array_key_exists($name, $_ENV)) {
                putenv("$name=$value");
                $_ENV[$name] = $value;
                $_SERVER[$name] = $value;
            }
        }
        
        self::$loaded = true;
    }
    
    public static function get($key, $default = null) {
        return getenv($key) ?: $default;
    }
}

// Auto-load on include
EnvLoader::load();
