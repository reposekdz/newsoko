<?php

class WatermarkService {
    private $watermarkText = 'RentalSalesMarketplace.rw';
    private $watermarkOpacity = 50;
    
    // Apply watermark to image
    public function applyWatermark($imagePath, $outputPath = null) {
        if (!file_exists($imagePath)) {
            return ['success' => false, 'message' => 'Image not found'];
        }
        
        $imageInfo = getimagesize($imagePath);
        if (!$imageInfo) {
            return ['success' => false, 'message' => 'Invalid image'];
        }
        
        $imageType = $imageInfo[2];
        
        // Load image based on type
        switch ($imageType) {
            case IMAGETYPE_JPEG:
                $image = imagecreatefromjpeg($imagePath);
                break;
            case IMAGETYPE_PNG:
                $image = imagecreatefrompng($imagePath);
                break;
            case IMAGETYPE_GIF:
                $image = imagecreatefromgif($imagePath);
                break;
            default:
                return ['success' => false, 'message' => 'Unsupported image type'];
        }
        
        if (!$image) {
            return ['success' => false, 'message' => 'Failed to load image'];
        }
        
        $width = imagesx($image);
        $height = imagesy($image);
        
        // Create watermark
        $watermarkImage = $this->createWatermarkImage($width, $height);
        
        // Merge watermark with original image
        imagecopy($image, $watermarkImage, 0, 0, 0, 0, $width, $height);
        
        // Save watermarked image
        if ($outputPath === null) {
            $outputPath = $this->generateWatermarkedPath($imagePath);
        }
        
        $saved = false;
        switch ($imageType) {
            case IMAGETYPE_JPEG:
                $saved = imagejpeg($image, $outputPath, 90);
                break;
            case IMAGETYPE_PNG:
                $saved = imagepng($image, $outputPath, 8);
                break;
            case IMAGETYPE_GIF:
                $saved = imagegif($image, $outputPath);
                break;
        }
        
        imagedestroy($image);
        imagedestroy($watermarkImage);
        
        if ($saved) {
            return ['success' => true, 'watermarked_path' => $outputPath];
        } else {
            return ['success' => false, 'message' => 'Failed to save watermarked image'];
        }
    }
    
    // Create watermark overlay
    private function createWatermarkImage($width, $height) {
        $watermark = imagecreatetruecolor($width, $height);
        
        // Make background transparent
        $transparent = imagecolorallocatealpha($watermark, 0, 0, 0, 127);
        imagefill($watermark, 0, 0, $transparent);
        imagesavealpha($watermark, true);
        
        // Set watermark color (white with transparency)
        $textColor = imagecolorallocatealpha($watermark, 255, 255, 255, $this->watermarkOpacity);
        
        // Calculate font size based on image size
        $fontSize = max(12, min($width, $height) / 40);
        
        // Add watermark text in multiple positions
        $positions = [
            ['x' => $width * 0.05, 'y' => $height * 0.95],  // Bottom left
            ['x' => $width * 0.5, 'y' => $height * 0.5],    // Center
            ['x' => $width * 0.85, 'y' => $height * 0.05]   // Top right
        ];
        
        foreach ($positions as $pos) {
            imagestring($watermark, 5, $pos['x'], $pos['y'], $this->watermarkText, $textColor);
        }
        
        // Add diagonal watermark
        $diagonalText = $this->watermarkText;
        for ($i = 0; $i < 5; $i++) {
            $x = ($width / 5) * $i;
            $y = ($height / 5) * $i;
            imagestring($watermark, 3, $x, $y, $diagonalText, $textColor);
        }
        
        return $watermark;
    }
    
    // Generate watermarked file path
    private function generateWatermarkedPath($originalPath) {
        $pathInfo = pathinfo($originalPath);
        return $pathInfo['dirname'] . '/' . $pathInfo['filename'] . '_watermarked.' . $pathInfo['extension'];
    }
    
    // Batch watermark multiple images
    public function batchWatermark($imagePaths) {
        $results = [];
        foreach ($imagePaths as $path) {
            $results[] = $this->applyWatermark($path);
        }
        return $results;
    }
}
