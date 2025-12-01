# Supabase RLS Guidelines - DBS Store

Ce document contient les bonnes pratiques pour les policies Row Level Security (RLS) et les fonctions PostgreSQL, basées sur les recommandations de Supabase Advisors.

## 1. Fonctions PostgreSQL - Sécurité

### Toujours définir un `search_path` immutable

**Problème** : Sans `search_path` explicite, une fonction peut être vulnérable aux attaques par injection de search_path.

**Solution** : Ajouter `SET search_path = public` à toutes les fonctions.

```sql
-- MAUVAIS
CREATE OR REPLACE FUNCTION my_function()
RETURNS TEXT AS $$
BEGIN
  RETURN 'hello';
END;
$$ LANGUAGE plpgsql;

-- BON
CREATE OR REPLACE FUNCTION my_function()
RETURNS TEXT AS $$
BEGIN
  RETURN 'hello';
END;
$$ LANGUAGE plpgsql
SET search_path = public;
```

### Utiliser des références qualifiées

Dans les fonctions, préférer les références de table qualifiées (`public.table_name`) :

```sql
-- BON
SELECT * FROM public.users WHERE id = user_id;
```

---

## 2. Policies RLS - Performance

### Utiliser `(SELECT auth.uid())` au lieu de `auth.uid()`

**Problème** : `auth.uid()` est réévalué pour chaque ligne, ce qui dégrade les performances.

**Solution** : Encapsuler dans un `SELECT` pour évaluer une seule fois.

```sql
-- MAUVAIS (réévalué pour chaque ligne)
CREATE POLICY "Users can view own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- BON (évalué une seule fois)
CREATE POLICY "Users can view own data" ON public.users
  FOR SELECT USING ((SELECT auth.uid()) = id);
```

### Éviter les policies permissives multiples

**Problème** : Plusieurs policies permissives pour le même rôle/action créent un OR implicite, dégradant les performances.

**Solution** : Consolider les conditions dans une seule policy.

```sql
-- MAUVAIS (2 policies permissives = OR implicite)
CREATE POLICY "Users can view own" ON public.orders
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all" ON public.orders
  FOR SELECT USING (is_admin());

-- BON (1 seule policy consolidée)
CREATE POLICY "orders_select_policy" ON public.orders
  FOR SELECT USING (
    (SELECT auth.uid()) = user_id
    OR public.is_admin()
  );
```

---

## 3. Structure recommandée des policies

### Naming convention

Utiliser le format : `{table}_{action}_policy`

```sql
CREATE POLICY "users_select_policy" ON public.users FOR SELECT ...
CREATE POLICY "users_insert_policy" ON public.users FOR INSERT ...
CREATE POLICY "users_update_policy" ON public.users FOR UPDATE ...
CREATE POLICY "users_delete_policy" ON public.users FOR DELETE ...
```

### Patterns par type de table

#### Tables utilisateur (users, addresses, wishlist, etc.)

```sql
-- SELECT: user voit ses données OU admin voit tout
CREATE POLICY "{table}_select_policy" ON public.{table}
  FOR SELECT USING (
    (SELECT auth.uid()) = user_id
    OR public.is_admin()
  );

-- INSERT: user crée ses données
CREATE POLICY "{table}_insert_policy" ON public.{table}
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

-- UPDATE: user modifie ses données OU admin modifie tout
CREATE POLICY "{table}_update_policy" ON public.{table}
  FOR UPDATE USING (
    (SELECT auth.uid()) = user_id
    OR public.is_admin()
  );

-- DELETE: user supprime ses données OU admin seulement
CREATE POLICY "{table}_delete_policy" ON public.{table}
  FOR DELETE USING ((SELECT auth.uid()) = user_id);
```

#### Tables publiques (products, categories, etc.)

```sql
-- SELECT: éléments actifs OU admin voit tout
CREATE POLICY "{table}_select_policy" ON public.{table}
  FOR SELECT USING (
    is_active = true
    OR public.is_admin()
  );

-- INSERT/UPDATE/DELETE: admin seulement
CREATE POLICY "{table}_insert_policy" ON public.{table}
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "{table}_update_policy" ON public.{table}
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "{table}_delete_policy" ON public.{table}
  FOR DELETE USING (public.is_admin());
```

#### Tables avec relations (order_items via orders)

```sql
-- SELECT via relation parent
CREATE POLICY "order_items_select_policy" ON public.order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE id = order_items.order_id
      AND user_id = (SELECT auth.uid())
    )
    OR public.is_admin()
  );
```

---

## 4. Fonction helper `is_admin()`

```sql
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = (SELECT auth.uid())
    AND role IN ('admin', 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;
```

**Notes** :
- `SECURITY DEFINER` permet à la fonction de bypasser RLS pour vérifier le rôle
- `(SELECT auth.uid())` pour la performance
- `SET search_path = public` pour la sécurité

---

## 5. Checklist avant migration

- [ ] Toutes les fonctions ont `SET search_path = public`
- [ ] Toutes les policies utilisent `(SELECT auth.uid())` et non `auth.uid()`
- [ ] Une seule policy permissive par table/action (pas de doublons)
- [ ] Les conditions admin et user sont combinées avec `OR` dans une même policy
- [ ] Naming convention respectée : `{table}_{action}_policy`
- [ ] Tables avec `is_active` : condition combinée avec `OR public.is_admin()`

---

## 6. Commandes utiles

```bash
# Vérifier les problèmes via Supabase Studio
# http://127.0.0.1:44323/project/default/advisors/security
# http://127.0.0.1:44323/project/default/advisors/performance

# Lister les policies existantes
psql -h 127.0.0.1 -p 44322 -U postgres -d postgres -c "
  SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
  FROM pg_policies
  WHERE schemaname = 'public'
  ORDER BY tablename, cmd;
"

# Reset la base avec les migrations
pnpm supabase db reset
```

---

## Références

- [Supabase RLS Performance](https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select)
- [PostgreSQL Security Functions](https://www.postgresql.org/docs/current/sql-createfunction.html)
