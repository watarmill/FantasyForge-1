import { useState } from "react";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PropertyGalleryProps {
  images: string[];
  title: string;
}

export function PropertyGallery({ images, title }: PropertyGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleViewerPrevious = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewerIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleViewerNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewerIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const openViewer = (index: number) => {
    setViewerIndex(index);
    setViewerOpen(true);
  };

  // Default image if array is empty
  if (images.length === 0) {
    images = ['https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&q=80&w=1200'];
  }

  return (
    <>
      <div className="relative rounded-xl overflow-hidden">
        {/* Main image */}
        <div className="relative h-[300px] md:h-[500px] overflow-hidden">
          <img
            src={images[currentIndex]}
            alt={`${title} - Image ${currentIndex + 1}`}
            className="w-full h-full object-cover"
          />
          <button
            className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-md hover:bg-black/70 transition-colors"
            onClick={() => openViewer(currentIndex)}
          >
            <Expand className="h-5 w-5" />
          </button>
          
          {images.length > 1 && (
            <>
              <button
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                onClick={handlePrevious}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                onClick={handleNext}
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}
          
          {/* Image counter */}
          <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
            {currentIndex + 1} / {images.length}
          </div>
        </div>
        
        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="flex gap-2 mt-2 overflow-x-auto pb-2">
            {images.map((image, index) => (
              <button
                key={index}
                className={cn(
                  "flex-shrink-0 h-20 w-20 md:h-24 md:w-24 rounded-md overflow-hidden border-2 transition-all",
                  currentIndex === index
                    ? "border-primary"
                    : "border-transparent hover:border-primary/50"
                )}
                onClick={() => setCurrentIndex(index)}
              >
                <img
                  src={image}
                  alt={`${title} - Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Full screen image viewer */}
      <Dialog open={viewerOpen} onOpenChange={setViewerOpen}>
        <DialogContent className="max-w-5xl w-full bg-black p-0 gap-0 border-0">
          <DialogHeader className="absolute top-0 left-0 right-0 z-10 p-4 flex justify-between items-center">
            <DialogTitle className="text-white">{title}</DialogTitle>
            <button 
              className="text-white hover:text-gray-300 transition-colors"
              onClick={() => setViewerOpen(false)}
            >
              <X className="h-6 w-6" />
            </button>
          </DialogHeader>
          <div className="h-[80vh] relative flex items-center justify-center">
            <img
              src={images[viewerIndex]}
              alt={`${title} - Image ${viewerIndex + 1}`}
              className="max-h-full max-w-full"
            />
            
            {images.length > 1 && (
              <>
                <button
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                  onClick={handleViewerPrevious}
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                  onClick={handleViewerNext}
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
                
                <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                  {viewerIndex + 1} / {images.length}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
