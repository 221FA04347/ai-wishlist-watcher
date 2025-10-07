import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, TrendingDown, TrendingUp, ExternalLink } from "lucide-react";
import { useState } from "react";

interface ProductCardProps {
  id: string;
  name: string;
  currentPrice: number;
  imageUrl?: string;
  category?: string;
  isInWishlist: boolean;
  priceChange?: number;
  onToggleWishlist: (id: string) => void;
  onViewHistory: (id: string) => void;
  url: string;
}

export const ProductCard = ({
  id,
  name,
  currentPrice,
  imageUrl,
  category,
  isInWishlist,
  priceChange = 0,
  onToggleWishlist,
  onViewHistory,
  url,
}: ProductCardProps) => {
  const [imageError, setImageError] = useState(false);

  return (
    <Card className="overflow-hidden bg-card border-border hover:shadow-[var(--shadow-glow)] transition-all duration-300 hover:scale-[1.02]">
      <div className="aspect-square relative bg-secondary overflow-hidden">
        {imageUrl && !imageError ? (
          <img
            src={imageUrl}
            alt={name}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            No image
          </div>
        )}
        <button
          onClick={() => onToggleWishlist(id)}
          className="absolute top-2 right-2 p-2 rounded-full bg-card/80 backdrop-blur-sm hover:bg-card transition-colors"
        >
          <Heart
            className={`w-5 h-5 ${
              isInWishlist ? "fill-primary text-primary" : "text-muted-foreground"
            }`}
          />
        </button>
      </div>

      <div className="p-4 space-y-3">
        {category && (
          <Badge variant="secondary" className="text-xs">
            {category}
          </Badge>
        )}

        <h3 className="font-semibold text-foreground line-clamp-2">{name}</h3>

        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold text-primary">
              ${currentPrice.toFixed(2)}
            </div>
            {priceChange !== 0 && (
              <div
                className={`flex items-center gap-1 text-sm ${
                  priceChange < 0 ? "text-success" : "text-destructive"
                }`}
              >
                {priceChange < 0 ? (
                  <TrendingDown className="w-4 h-4" />
                ) : (
                  <TrendingUp className="w-4 h-4" />
                )}
                <span>{Math.abs(priceChange).toFixed(2)}%</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onViewHistory(id)}
          >
            View History
          </Button>
          <Button
            variant="ghost"
            size="sm"
            asChild
          >
            <a href={url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4" />
            </a>
          </Button>
        </div>
      </div>
    </Card>
  );
};