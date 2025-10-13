import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Upload, Download, Sparkles, Loader2, Palette, Eraser, ArrowUpCircle, Focus, Sun } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type Operation = 'enhance' | 'colorize' | 'removebg' | 'upscale' | 'denoise' | 'sharpen' | 'brighten';

interface ImageEnhancerProps {}

export const ImageEnhancer: React.FC<ImageEnhancerProps> = () => {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [enhancedImage, setEnhancedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedOperation, setSelectedOperation] = useState<Operation>('enhance');
  const { toast } = useToast();

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    if (files && files[0]) {
      handleFile(files[0]);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file.",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setOriginalImage(e.target?.result as string);
      setEnhancedImage(null);
    };
    reader.readAsDataURL(file);
  };


  const processImage = async (operation: Operation) => {
    if (!originalImage) return;

    setIsProcessing(true);
    setSelectedOperation(operation);
    
    try {
      const operationLabels: Record<Operation, string> = {
        enhance: "AI Enhancement",
        colorize: "Colorization",
        removebg: "Background Removal",
        upscale: "Upscaling",
        denoise: "Denoising",
        sharpen: "Sharpening",
        brighten: "Brightening"
      };

      toast({
        title: `${operationLabels[operation]} started`,
        description: "Our AI is processing your image...",
      });

      const ENHANCE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/enhance-image`;
      
      const response = await fetch(ENHANCE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ imageUrl: originalImage, operation }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to process image");
      }

      const { enhancedImageUrl } = await response.json();
      setEnhancedImage(enhancedImageUrl);

      toast({
        title: "Processing complete!",
        description: `Your image has been ${operation}ed successfully.`,
      });
    } catch (error) {
      console.error('Processing error:', error);
      
      toast({
        title: "Processing failed",
        description: error instanceof Error ? error.message : "There was an error processing your image.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const operations = [
    { id: 'enhance' as Operation, label: 'Enhance', icon: Sparkles, description: 'Improve quality' },
    { id: 'colorize' as Operation, label: 'Colorize', icon: Palette, description: 'Add color to B&W' },
    { id: 'removebg' as Operation, label: 'Remove BG', icon: Eraser, description: 'Remove background' },
    { id: 'upscale' as Operation, label: 'Upscale', icon: ArrowUpCircle, description: 'Increase resolution' },
    { id: 'denoise' as Operation, label: 'Denoise', icon: Sparkles, description: 'Remove noise' },
    { id: 'sharpen' as Operation, label: 'Sharpen', icon: Focus, description: 'Increase sharpness' },
    { id: 'brighten' as Operation, label: 'Brighten', icon: Sun, description: 'Improve lighting' },
  ];
  const downloadImage = () => {
    if (!enhancedImage) return;

    const link = document.createElement('a');
    link.href = enhancedImage;
    link.download = 'enhanced-image.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Download started",
      description: "Your enhanced image is being downloaded.",
    });
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="text-center space-y-3 sm:space-y-4">
        <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4">
          <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-primary glow-effect" />
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            AI Image Processor
          </h1>
        </div>
        <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
          Upload your image and transform it with professional AI-powered tools
        </p>
      </div>

      {/* Upload Area */}
      {!originalImage && (
        <Card className="glass-card p-6 sm:p-8 md:p-12 transition-smooth hover:scale-[1.01] sm:hover:scale-[1.02]">
          <div
            className={`border-2 border-dashed rounded-xl p-6 sm:p-8 md:p-12 text-center transition-smooth ${
              dragActive 
                ? 'border-primary bg-primary/10 glow-effect' 
                : 'border-glass-border hover:border-primary/50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 mx-auto mb-4 sm:mb-6 text-muted-foreground" />
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-lg sm:text-xl md:text-2xl font-semibold">Drop your image here</h3>
              <p className="text-sm sm:text-base text-muted-foreground">
                Support JPG, PNG, WEBP files up to 10MB
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
                <Button 
                  variant="default" 
                  size="lg"
                  className="w-full sm:w-auto bg-gradient-to-r from-primary to-accent glow-effect transition-bounce hover:scale-105"
                  onClick={() => document.getElementById('file-input')?.click()}
                >
                  Choose File
                </Button>
                <span className="text-sm text-muted-foreground">or drag and drop</span>
              </div>
            </div>
            <input
              id="file-input"
              type="file"
              accept="image/*"
              onChange={handleFileInput}
              className="hidden"
            />
          </div>
        </Card>
      )}

      {/* Image Comparison */}
      {originalImage && (
        <div className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Original Image */}
            <Card className="glass-card p-4 sm:p-6 space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base sm:text-lg md:text-xl font-semibold">Original</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setOriginalImage(null);
                    setEnhancedImage(null);
                    setSelectedOperation('enhance');
                  }}
                  className="text-xs sm:text-sm"
                >
                  Upload New
                </Button>
              </div>
              <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                <img
                  src={originalImage}
                  alt="Original"
                  className="w-full h-full object-contain"
                />
              </div>
            </Card>

            {/* Processed Image */}
            <Card className="glass-card p-4 sm:p-6 space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base sm:text-lg md:text-xl font-semibold">Processed</h3>
                {enhancedImage && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadImage}
                    className="glow-effect text-xs sm:text-sm"
                  >
                    <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    Download
                  </Button>
                )}
              </div>
              <div className="aspect-square rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                {enhancedImage ? (
                  <img
                    src={enhancedImage}
                    alt="Processed"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-center space-y-3 sm:space-y-4 p-4">
                    <Sparkles className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 mx-auto text-muted-foreground" />
                    <p className="text-xs sm:text-sm md:text-base text-muted-foreground">
                      Select an operation below
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Operations */}
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-base sm:text-lg md:text-xl font-semibold text-center">Choose an Operation</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-3">
              {operations.map((op) => {
                const Icon = op.icon;
                return (
                  <Button
                    key={op.id}
                    onClick={() => processImage(op.id)}
                    disabled={isProcessing}
                    variant={selectedOperation === op.id && enhancedImage ? "default" : "outline"}
                    className="h-auto py-3 sm:py-4 flex flex-col items-center gap-1.5 sm:gap-2 text-xs sm:text-sm hover:scale-105 transition-transform"
                  >
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="font-medium leading-tight">{op.label}</span>
                      <span className="text-[9px] sm:text-[10px] md:text-xs opacity-70 leading-tight text-center hidden sm:block">
                        {op.description}
                      </span>
                    </div>
                    {isProcessing && selectedOperation === op.id && (
                      <Loader2 className="h-3 w-3 animate-spin absolute top-2 right-2" />
                    )}
                  </Button>
                );
              })}
            </div>
          </div>

          {isProcessing && (
            <div className="text-center">
              <div className="inline-flex items-center gap-2 text-xs sm:text-sm md:text-base text-muted-foreground">
                <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                Processing your image with AI...
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};