import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Upload, Download, Sparkles, Loader2, Palette, Eraser, ArrowUpCircle, Focus, Sun, Hammer } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type Operation = 'enhance' | 'colorize' | 'removebg' | 'upscale' | 'denoise' | 'sharpen' | 'brighten' | 'removecrack';

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
        brighten: "Brightening",
        removecrack: "Crack Removal"
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
    { id: 'removecrack' as Operation, label: 'Fix Cracks', icon: Hammer, description: 'Remove damage' },
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="text-center space-y-4 sm:space-y-6 py-6 sm:py-8">
          <div className="inline-flex items-center justify-center gap-3 sm:gap-4 px-6 py-3 rounded-full bg-primary/10 backdrop-blur-sm border border-primary/20">
            <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-primary animate-pulse" />
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              AI Image Processor
            </h1>
            <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-accent animate-pulse" />
          </div>
          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto px-4 leading-relaxed">
            Transform your images with cutting-edge AI technology. Enhance, colorize, restore, and more - all in one powerful platform.
          </p>
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground">
            <span className="px-3 py-1 rounded-full bg-primary/5 border border-primary/10">✨ AI-Powered</span>
            <span className="px-3 py-1 rounded-full bg-primary/5 border border-primary/10">🚀 Fast Processing</span>
            <span className="px-3 py-1 rounded-full bg-primary/5 border border-primary/10">🎨 9 Tools</span>
          </div>
        </div>

        {/* Upload Area */}
        {!originalImage && (
          <Card className="glass-card p-6 sm:p-8 md:p-12 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/20 hover:scale-[1.01]">
            <div
              className={`border-2 border-dashed rounded-2xl p-8 sm:p-10 md:p-16 text-center transition-all duration-300 ${
                dragActive 
                  ? 'border-primary bg-primary/20 shadow-lg shadow-primary/30 scale-105' 
                  : 'border-primary/30 hover:border-primary/60 hover:bg-primary/5'
              }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
              <Upload className="h-16 w-16 sm:h-18 sm:w-18 md:h-20 md:w-20 mx-auto mb-6 sm:mb-8 text-primary animate-bounce" />
              <div className="space-y-4 sm:space-y-6">
                <h3 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  Drop your image here
                </h3>
                <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-md mx-auto">
                  Support JPG, PNG, WEBP formats • Maximum 10MB
                </p>
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center pt-4">
                  <Button 
                    variant="default" 
                    size="lg"
                    className="w-full sm:w-auto text-base sm:text-lg px-8 py-6 bg-gradient-to-r from-primary via-accent to-primary bg-size-200 hover:bg-pos-100 transition-all duration-500 shadow-lg hover:shadow-xl hover:shadow-primary/50 hover:scale-110"
                    onClick={() => document.getElementById('file-input')?.click()}
                  >
                    <Upload className="h-5 w-5 mr-2" />
                    Choose File
                  </Button>
                  <span className="text-sm sm:text-base text-muted-foreground font-medium">or drag and drop</span>
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
          <div className="space-y-6 sm:space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
              {/* Original Image */}
              <Card className="glass-card p-5 sm:p-7 space-y-4 sm:space-y-5 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10">
                <div className="flex items-center justify-between border-b border-border/50 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></div>
                    <h3 className="text-base sm:text-lg md:text-xl font-bold">Original Image</h3>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setOriginalImage(null);
                      setEnhancedImage(null);
                      setSelectedOperation('enhance');
                    }}
                    className="text-xs sm:text-sm hover:bg-destructive hover:text-destructive-foreground transition-colors"
                  >
                    <Upload className="h-3 w-3 mr-1" />
                    Upload New
                  </Button>
                </div>
                <div className="aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-muted to-muted/50 border-2 border-border/50 shadow-inner">
                  <img
                    src={originalImage}
                    alt="Original"
                    className="w-full h-full object-contain hover:scale-105 transition-transform duration-300"
                  />
                </div>
              </Card>

              {/* Processed Image */}
              <Card className="glass-card p-5 sm:p-7 space-y-4 sm:space-y-5 transition-all duration-300 hover:shadow-xl hover:shadow-accent/10">
                <div className="flex items-center justify-between border-b border-border/50 pb-3">
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${enhancedImage ? 'bg-green-500' : 'bg-gray-400'} animate-pulse`}></div>
                    <h3 className="text-base sm:text-lg md:text-xl font-bold">Processed Image</h3>
                  </div>
                  {enhancedImage && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={downloadImage}
                      className="text-xs sm:text-sm bg-gradient-to-r from-green-500/10 to-emerald-500/10 hover:from-green-500/20 hover:to-emerald-500/20 border-green-500/30 hover:border-green-500/50 transition-all"
                    >
                      <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      Download
                    </Button>
                  )}
                </div>
                <div className="aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-muted to-muted/50 border-2 border-border/50 shadow-inner flex items-center justify-center">
                  {enhancedImage ? (
                    <img
                      src={enhancedImage}
                      alt="Processed"
                      className="w-full h-full object-contain hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="text-center space-y-4 sm:space-y-6 p-6">
                      <Sparkles className="h-12 w-12 sm:h-16 sm:w-16 md:h-20 md:w-20 mx-auto text-primary animate-pulse" />
                      <div className="space-y-2">
                        <p className="text-sm sm:text-base md:text-lg font-semibold text-foreground">
                          Ready to Transform
                        </p>
                        <p className="text-xs sm:text-sm text-muted-foreground max-w-xs mx-auto">
                          Select an AI operation below to process your image
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Operations */}
            <div className="space-y-5 sm:space-y-6">
              <div className="text-center space-y-2">
                <h3 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Choose Your AI Tool
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Click on any tool to transform your image instantly
                </p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-9 gap-3 sm:gap-4">
                {operations.map((op) => {
                  const Icon = op.icon;
                  const isSelected = selectedOperation === op.id && enhancedImage;
                  return (
                    <Button
                      key={op.id}
                      onClick={() => processImage(op.id)}
                      disabled={isProcessing}
                      variant={isSelected ? "default" : "outline"}
                      className={`h-auto py-4 sm:py-5 flex flex-col items-center gap-2 sm:gap-3 text-xs sm:text-sm transition-all duration-300 hover:scale-110 hover:shadow-lg relative overflow-hidden group ${
                        isSelected 
                          ? 'bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/30 border-primary' 
                          : 'hover:border-primary/50 hover:bg-primary/5'
                      }`}
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
                      <Icon className={`h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 z-10 ${isSelected ? 'animate-bounce' : 'group-hover:scale-110 transition-transform'}`} />
                      <div className="flex flex-col items-center gap-0.5 z-10">
                        <span className="font-bold leading-tight">{op.label}</span>
                        <span className="text-[9px] sm:text-[10px] md:text-xs opacity-70 leading-tight text-center hidden sm:block">
                          {op.description}
                        </span>
                      </div>
                      {isProcessing && selectedOperation === op.id && (
                        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-20">
                          <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin" />
                        </div>
                      )}
                    </Button>
                  );
                })}
              </div>
            </div>

            {isProcessing && (
              <Card className="glass-card p-6 sm:p-8 bg-gradient-to-r from-primary/10 to-accent/10 border-primary/30">
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
                  <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 animate-spin text-primary" />
                  <div className="text-center sm:text-left space-y-1">
                    <p className="text-base sm:text-lg md:text-xl font-bold text-foreground">
                      AI Processing in Progress
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Our advanced AI is transforming your image...
                    </p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};