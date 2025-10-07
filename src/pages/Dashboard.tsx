import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard } from "@/components/ProductCard";
import { AddProductDialog } from "@/components/AddProductDialog";
import { PriceHistoryDialog } from "@/components/PriceHistoryDialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, Heart, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import heroImage from "@/assets/hero-bg.jpg";

export const Dashboard = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyProduct, setHistoryProduct] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadProducts();

    // Subscribe to realtime updates
    const channel = supabase
      .channel("products-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "products",
        },
        () => {
          loadProducts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadProducts = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleWishlist = async (id: string) => {
    const product = products.find((p) => p.id === id);
    if (!product) return;

    try {
      const { error } = await supabase
        .from("products")
        .update({ is_in_wishlist: !product.is_in_wishlist })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: product.is_in_wishlist ? "Removed from wishlist" : "Added to wishlist",
        description: product.name,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const wishlistProducts = products.filter((p) => p.is_in_wishlist);
  const allProducts = products;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary to-background">
      {/* Hero Section */}
      <div
        className="relative h-80 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background"></div>
        <div className="relative h-full flex flex-col items-center justify-center text-center px-4">
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-4">
            PriceTracker AI
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
            Track product prices intelligently, get notified on drops, and never miss a deal
          </p>
          <div className="flex gap-4 items-center">
            <AddProductDialog onProductAdded={loadProducts} />
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-8">
            <TabsTrigger value="all" className="gap-2">
              <Package className="w-4 h-4" />
              All Products ({allProducts.length})
            </TabsTrigger>
            <TabsTrigger value="wishlist" className="gap-2">
              <Heart className="w-4 h-4" />
              Wishlist ({wishlistProducts.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading products...</p>
              </div>
            ) : allProducts.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-xl text-muted-foreground mb-4">
                  No products tracked yet
                </p>
                <p className="text-muted-foreground mb-6">
                  Start tracking products to monitor their prices
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {allProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    id={product.id}
                    name={product.name}
                    currentPrice={parseFloat(product.current_price)}
                    imageUrl={product.image_url}
                    category={product.category}
                    isInWishlist={product.is_in_wishlist}
                    onToggleWishlist={handleToggleWishlist}
                    onViewHistory={(id) => {
                      const p = products.find((prod) => prod.id === id);
                      if (p) setHistoryProduct({ id: p.id, name: p.name });
                    }}
                    url={product.url}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="wishlist">
            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading wishlist...</p>
              </div>
            ) : wishlistProducts.length === 0 ? (
              <div className="text-center py-12">
                <Heart className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-xl text-muted-foreground mb-4">
                  Your wishlist is empty
                </p>
                <p className="text-muted-foreground mb-6">
                  Add products to your wishlist to get price drop notifications
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {wishlistProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    id={product.id}
                    name={product.name}
                    currentPrice={parseFloat(product.current_price)}
                    imageUrl={product.image_url}
                    category={product.category}
                    isInWishlist={product.is_in_wishlist}
                    onToggleWishlist={handleToggleWishlist}
                    onViewHistory={(id) => {
                      const p = products.find((prod) => prod.id === id);
                      if (p) setHistoryProduct({ id: p.id, name: p.name });
                    }}
                    url={product.url}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <PriceHistoryDialog
        productId={historyProduct?.id || null}
        productName={historyProduct?.name || ""}
        open={!!historyProduct}
        onOpenChange={(open) => !open && setHistoryProduct(null)}
      />
    </div>
  );
};