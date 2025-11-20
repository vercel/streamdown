# Code-Heavy Document

This document contains many code blocks to test syntax highlighting performance.

## TypeScript Examples

```typescript
interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

class UserService {
  private users: Map<string, User> = new Map();

  async createUser(data: Omit<User, 'id'>): Promise<User> {
    const id = crypto.randomUUID();
    const user: User = { id, ...data };
    this.users.set(id, user);
    return user;
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async updateUser(id: string, data: Partial<User>): Promise<User | null> {
    const user = this.users.get(id);
    if (!user) return null;

    const updated = { ...user, ...data };
    this.users.set(id, updated);
    return updated;
  }
}
```

## Python Examples

```python
import asyncio
from typing import List, Dict, Optional
from dataclasses import dataclass
from datetime import datetime

@dataclass
class Task:
    id: str
    title: str
    completed: bool
    created_at: datetime

class TaskManager:
    def __init__(self):
        self.tasks: Dict[str, Task] = {}

    async def create_task(self, title: str) -> Task:
        task = Task(
            id=str(len(self.tasks) + 1),
            title=title,
            completed=False,
            created_at=datetime.now()
        )
        self.tasks[task.id] = task
        return task

    async def get_tasks(self, completed: Optional[bool] = None) -> List[Task]:
        if completed is None:
            return list(self.tasks.values())
        return [t for t in self.tasks.values() if t.completed == completed]

    async def toggle_task(self, task_id: str) -> Optional[Task]:
        task = self.tasks.get(task_id)
        if task:
            task.completed = not task.completed
        return task

async def main():
    manager = TaskManager()
    await manager.create_task("Learn Python")
    await manager.create_task("Build an app")
    tasks = await manager.get_tasks()
    for task in tasks:
        print(f"{task.title}: {'Done' if task.completed else 'Pending'}")

if __name__ == "__main__":
    asyncio.run(main())
```

## JavaScript/React Examples

```javascript
import React, { useState, useEffect, useCallback, useMemo } from 'react';

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function SearchComponent({ onSearch }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (!debouncedQuery) {
      setResults([]);
      return;
    }

    const searchAPI = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/search?q=${debouncedQuery}`);
        const data = await response.json();
        setResults(data);
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setLoading(false);
      }
    };

    searchAPI();
  }, [debouncedQuery]);

  const handleChange = useCallback((e) => {
    setQuery(e.target.value);
  }, []);

  return (
    <div className="search-container">
      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder="Search..."
      />
      {loading && <div>Loading...</div>}
      <ul>
        {results.map(result => (
          <li key={result.id}>{result.title}</li>
        ))}
      </ul>
    </div>
  );
}
```

## Rust Examples

```rust
use std::collections::HashMap;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
struct Product {
    id: u32,
    name: String,
    price: f64,
    stock: u32,
}

struct Store {
    products: HashMap<u32, Product>,
    next_id: u32,
}

impl Store {
    fn new() -> Self {
        Store {
            products: HashMap::new(),
            next_id: 1,
        }
    }

    fn add_product(&mut self, name: String, price: f64, stock: u32) -> u32 {
        let id = self.next_id;
        self.next_id += 1;

        let product = Product {
            id,
            name,
            price,
            stock,
        };

        self.products.insert(id, product);
        id
    }

    fn get_product(&self, id: u32) -> Option<&Product> {
        self.products.get(&id)
    }

    fn update_stock(&mut self, id: u32, quantity: i32) -> Result<(), String> {
        if let Some(product) = self.products.get_mut(&id) {
            let new_stock = product.stock as i32 + quantity;
            if new_stock < 0 {
                return Err("Insufficient stock".to_string());
            }
            product.stock = new_stock as u32;
            Ok(())
        } else {
            Err("Product not found".to_string())
        }
    }
}

fn main() {
    let mut store = Store::new();

    let id1 = store.add_product("Laptop".to_string(), 999.99, 10);
    let id2 = store.add_product("Mouse".to_string(), 29.99, 50);

    if let Some(product) = store.get_product(id1) {
        println!("{}: ${} ({} in stock)", product.name, product.price, product.stock);
    }

    match store.update_stock(id1, -1) {
        Ok(_) => println!("Stock updated successfully"),
        Err(e) => println!("Error: {}", e),
    }
}
```

## Go Examples

```go
package main

import (
    "context"
    "fmt"
    "sync"
    "time"
)

type Cache struct {
    mu    sync.RWMutex
    items map[string]cacheItem
}

type cacheItem struct {
    value      interface{}
    expiration time.Time
}

func NewCache() *Cache {
    c := &Cache{
        items: make(map[string]cacheItem),
    }
    go c.cleanup()
    return c
}

func (c *Cache) Set(key string, value interface{}, ttl time.Duration) {
    c.mu.Lock()
    defer c.mu.Unlock()

    c.items[key] = cacheItem{
        value:      value,
        expiration: time.Now().Add(ttl),
    }
}

func (c *Cache) Get(key string) (interface{}, bool) {
    c.mu.RLock()
    defer c.mu.RUnlock()

    item, found := c.items[key]
    if !found {
        return nil, false
    }

    if time.Now().After(item.expiration) {
        return nil, false
    }

    return item.value, true
}

func (c *Cache) Delete(key string) {
    c.mu.Lock()
    defer c.mu.Unlock()
    delete(c.items, key)
}

func (c *Cache) cleanup() {
    ticker := time.NewTicker(time.Minute)
    defer ticker.Stop()

    for range ticker.C {
        c.mu.Lock()
        for key, item := range c.items {
            if time.Now().After(item.expiration) {
                delete(c.items, key)
            }
        }
        c.mu.Unlock()
    }
}

func main() {
    cache := NewCache()

    cache.Set("user:1", "John Doe", 5*time.Minute)
    cache.Set("user:2", "Jane Smith", 10*time.Minute)

    if value, found := cache.Get("user:1"); found {
        fmt.Printf("Found: %v\n", value)
    }

    time.Sleep(6 * time.Minute)

    if _, found := cache.Get("user:1"); !found {
        fmt.Println("user:1 expired")
    }
}
```

## SQL Examples

```sql
-- Create tables
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_published ON posts(published);
CREATE INDEX idx_comments_post_id ON comments(post_id);

-- Complex query with joins and aggregations
SELECT
    u.id,
    u.username,
    COUNT(DISTINCT p.id) as post_count,
    COUNT(DISTINCT c.id) as comment_count,
    MAX(p.created_at) as last_post_date
FROM users u
LEFT JOIN posts p ON u.id = p.user_id AND p.published = TRUE
LEFT JOIN comments c ON u.id = c.user_id
WHERE u.created_at >= NOW() - INTERVAL '30 days'
GROUP BY u.id, u.username
HAVING COUNT(DISTINCT p.id) > 0
ORDER BY post_count DESC, comment_count DESC
LIMIT 10;
```
