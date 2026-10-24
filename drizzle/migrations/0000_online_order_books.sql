CREATE TABLE public.order_templates (
  id text PRIMARY KEY,
  orders jsonb NOT NULL CHECK (jsonb_typeof(orders) = 'array')
);
GRANT SELECT ON public.order_templates TO authenticated;
GRANT ALL ON public.order_templates TO service_role;
ALTER TABLE public.order_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed in users read starter orders" ON public.order_templates FOR SELECT TO authenticated USING (true);
INSERT INTO public.order_templates (id, orders) VALUES ('aliexpress', '[{"id":"initial-0","code":"82145214","content":"25 m2a","status":"Pendente","arrival":"","notes":""},{"id":"initial-1","code":"82147159","content":"25 m2a","status":"Pendente","arrival":"","notes":""},{"id":"initial-2","code":"82147158","content":"25 m2a","status":"Pendente","arrival":"","notes":""},{"id":"initial-3","code":"82145005","content":"25 m2a e 2 m6","status":"Pendente","arrival":"","notes":""},{"id":"initial-4","code":"82142441","content":"25 m2a","status":"Pendente","arrival":"","notes":""},{"id":"initial-5","code":"82145473","content":"15 m6a chines","status":"Pendente","arrival":"","notes":""}]'::jsonb);

CREATE TABLE public.order_books (
  user_id uuid PRIMARY KEY,
  orders jsonb NOT NULL CHECK (jsonb_typeof(orders) = 'array'),
  version integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.order_books TO authenticated;
GRANT ALL ON public.order_books TO service_role;
ALTER TABLE public.order_books ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own orders" ON public.order_books FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "Create own orders" ON public.order_books FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Update own orders" ON public.order_books FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE FUNCTION public.initialize_order_book(legacy_orders jsonb DEFAULT NULL)
RETURNS SETOF public.order_books LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  INSERT INTO public.order_books (user_id, orders)
  VALUES (auth.uid(), COALESCE(legacy_orders, (SELECT orders FROM public.order_templates WHERE id = 'aliexpress')))
  ON CONFLICT (user_id) DO NOTHING;
  RETURN QUERY SELECT * FROM public.order_books WHERE user_id = auth.uid();
END;
$$;
REVOKE ALL ON FUNCTION public.initialize_order_book(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.initialize_order_book(jsonb) TO authenticated;

CREATE FUNCTION public.touch_order_book() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.version = OLD.version + 1;
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
CREATE TRIGGER order_book_version BEFORE UPDATE ON public.order_books FOR EACH ROW EXECUTE FUNCTION public.touch_order_book();