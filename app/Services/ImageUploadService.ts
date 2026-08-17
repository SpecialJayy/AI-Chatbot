import { useState, useCallback } from "react";

export const useImageUpload = () => {
  const [selectedImages, setSelectedImages] = useState<File[]>([]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.dataTransfer.files?.length > 0) {
      const imageFiles = Array.from(e.dataTransfer.files).filter((file) =>
        file.type.startsWith("image/")
      );
      if (imageFiles.length > 0) {
        setSelectedImages((prev) => [...prev, ...imageFiles]);
      }
    }
  }, []);

  const removeImage = useCallback((indexToRemove: number) => {
    setSelectedImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  }, []);

  const clearImages = useCallback(() => setSelectedImages([]), []);

  return { selectedImages, setSelectedImages, handleDragOver, handleDrop, removeImage, clearImages };
};