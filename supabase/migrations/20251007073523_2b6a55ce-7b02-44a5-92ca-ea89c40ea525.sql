-- Create products table to store tracked products
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  current_price DECIMAL(10, 2) NOT NULL,
  image_url TEXT,
  category TEXT,
  is_in_wishlist BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create price_history table to track price changes
CREATE TABLE public.price_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  price DECIMAL(10, 2) NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for products
CREATE POLICY "Users can view their own products" 
ON public.products 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own products" 
ON public.products 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own products" 
ON public.products 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own products" 
ON public.products 
FOR DELETE 
USING (auth.uid() = user_id);

-- RLS Policies for price_history
CREATE POLICY "Users can view price history for their products" 
ON public.price_history 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.products 
    WHERE products.id = price_history.product_id 
    AND products.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create price history for their products" 
ON public.price_history 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.products 
    WHERE products.id = price_history.product_id 
    AND products.user_id = auth.uid()
  )
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to automatically record price history on product creation
CREATE OR REPLACE FUNCTION public.record_initial_price()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.price_history (product_id, price, recorded_at)
  VALUES (NEW.id, NEW.current_price, NEW.created_at);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER record_initial_price_trigger
AFTER INSERT ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.record_initial_price();

-- Enable realtime for products table
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;