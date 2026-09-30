CREATE TABLE IF NOT EXISTS collections (
  slug    text PRIMARY KEY,
  title   text NOT NULL,
  tagline text NOT NULL DEFAULT '',
  sort    int  NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS products (
  id          serial PRIMARY KEY,
  slug        text UNIQUE NOT NULL,
  name        text NOT NULL,
  description text NOT NULL DEFAULT '',
  price       int  NOT NULL CHECK (price >= 0),
  quantity    int  NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  catalog     text NOT NULL DEFAULT '',
  collections text[] NOT NULL DEFAULT '{}',
  images      text[] NOT NULL DEFAULT '{}',
  sizes       text[] NOT NULL DEFAULT '{}',
  status      text NOT NULL DEFAULT 'live' CHECK (status IN ('live', 'hidden')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
