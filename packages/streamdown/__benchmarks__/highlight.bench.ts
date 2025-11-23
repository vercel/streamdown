import type { BundledLanguage, BundledTheme } from "shiki";
import { bench, describe } from "vitest";
import { createShiki, getHighlightedTokens } from "../lib/code-block/highlight";

describe("Syntax Highlighting - Highlighter Creation", () => {
  const themes: [BundledTheme, BundledTheme] = ["github-light", "github-dark"];

  bench(
    "create JavaScript highlighter",
    async () => {
      await createShiki("javascript", themes);
    },
    { iterations: 1000 }
  );

  bench(
    "create TypeScript highlighter",
    async () => {
      await createShiki("typescript", themes);
    },
    { iterations: 1000 }
  );

  bench(
    "create Python highlighter",
    async () => {
      await createShiki("python", themes);
    },
    { iterations: 1000 }
  );

  bench(
    "create Rust highlighter",
    async () => {
      await createShiki("rust", themes);
    },
    { iterations: 1000 }
  );

  bench(
    "create JSON highlighter",
    async () => {
      await createShiki("json", themes);
    },
    { iterations: 1000 }
  );
});

describe("Syntax Highlighting - Cache Performance", () => {
  const themes: [BundledTheme, BundledTheme] = ["github-light", "github-dark"];

  // Warm up cache
  createShiki("javascript", themes);

  bench(
    "highlighter creation (cache miss)",
    async () => {
      await createShiki("go" as BundledLanguage, themes);
    },
    { iterations: 1000 }
  );

  bench(
    "highlighter creation (cache hit)",
    async () => {
      await createShiki("javascript", themes);
    },
    { iterations: 1000 }
  );

  bench(
    "repeated highlighter creation (cache hit)",
    async () => {
      await Promise.all([
        createShiki("javascript", themes),
        createShiki("javascript", themes),
        createShiki("javascript", themes),
      ]);
    },
    { iterations: 1000 }
  );
});

describe("Syntax Highlighting - Token Generation (Small Code)", () => {
  const themes: [BundledTheme, BundledTheme] = ["github-light", "github-dark"];

  const jsCode = 'const greeting = "Hello, World!";';
  const tsCode = 'const user: User = { id: 1, name: "John" };';
  const pythonCode = 'greeting = "Hello, World!"';
  const rustCode = 'let greeting = "Hello, World!";';
  const htmlCode = '<div class="container">Hello</div>';

  bench("JavaScript token generation (single line)", async () => {
    const highlighter = await createShiki("javascript", themes);
    highlighter.codeToTokens(
      jsCode,
      {
        lang: "javascript",
        themes: {
          light: themes[0],
          dark: themes[1],
        },
      },
      { iterations: 1000 }
    );
  });

  bench("TypeScript token generation (single line)", async () => {
    const highlighter = await createShiki("typescript", themes);
    highlighter.codeToTokens(
      tsCode,
      {
        lang: "typescript",
        themes: {
          light: themes[0],
          dark: themes[1],
        },
      },
      { iterations: 1000 }
    );
  });

  bench("Python token generation (single line)", async () => {
    const highlighter = await createShiki("python", themes);
    highlighter.codeToTokens(
      pythonCode,
      {
        lang: "python",
        themes: {
          light: themes[0],
          dark: themes[1],
        },
      },
      { iterations: 1000 }
    );
  });

  bench("Rust token generation (single line)", async () => {
    const highlighter = await createShiki("rust", themes);
    highlighter.codeToTokens(
      rustCode,
      {
        lang: "rust",
        themes: {
          light: themes[0],
          dark: themes[1],
        },
      },
      { iterations: 1000 }
    );
  });

  bench(
    "HTML token generation (single line)",
    async () => {
      const highlighter = await createShiki("html", themes);
      highlighter.codeToTokens(htmlCode, {
        lang: "html",
        themes: {
          light: themes[0],
          dark: themes[1],
        },
      });
    },
    { iterations: 1000 }
  );
});

describe("Syntax Highlighting - Token Generation (Medium Code)", () => {
  const themes: [BundledTheme, BundledTheme] = ["github-light", "github-dark"];

  const jsFunction = `function factorial(n) {
  if (n <= 1) return 1;
  return n * factorial(n - 1);
}

const result = factorial(5);
console.log(result);`;

  const tsInterface = `interface User {
  id: number;
  name: string;
  email: string;
  createdAt: Date;
}

function getUser(id: number): User {
  return {
    id,
    name: "John Doe",
    email: "john@example.com",
    createdAt: new Date(),
  };
}`;

  const pythonClass = `class Calculator:
    def __init__(self):
        self.result = 0

    def add(self, x, y):
        self.result = x + y
        return self.result

    def multiply(self, x, y):
        self.result = x * y
        return self.result

calc = Calculator()
print(calc.add(5, 3))`;

  const rustStruct = `struct User {
    id: u32,
    name: String,
    email: String,
}

impl User {
    fn new(id: u32, name: String, email: String) -> Self {
        User { id, name, email }
    }

    fn greet(&self) -> String {
        format!("Hello, {}!", self.name)
    }
}`;

  bench(
    "JavaScript function (10 lines)",
    async () => {
      const highlighter = await createShiki("javascript", themes);
      highlighter.codeToTokens(jsFunction, {
        lang: "javascript",
        themes: {
          light: themes[0],
          dark: themes[1],
        },
      });
    },
    { iterations: 1000 }
  );

  bench(
    "TypeScript interface (15 lines)",
    async () => {
      const highlighter = await createShiki("typescript", themes);
      highlighter.codeToTokens(tsInterface, {
        lang: "typescript",
        themes: {
          light: themes[0],
          dark: themes[1],
        },
      });
    },
    { iterations: 1000 }
  );

  bench(
    "Python class (14 lines)",
    async () => {
      const highlighter = await createShiki("python", themes);
      highlighter.codeToTokens(pythonClass, {
        lang: "python",
        themes: {
          light: themes[0],
          dark: themes[1],
        },
      });
    },
    { iterations: 1000 }
  );

  bench(
    "Rust struct (16 lines)",
    async () => {
      const highlighter = await createShiki("rust", themes);
      highlighter.codeToTokens(rustStruct, {
        lang: "rust",
        themes: {
          light: themes[0],
          dark: themes[1],
        },
      });
    },
    { iterations: 1000 }
  );
});

describe("Syntax Highlighting - Token Generation (Large Code)", () => {
  const themes: [BundledTheme, BundledTheme] = ["github-light", "github-dark"];

  const largeJsCode = `${Array.from(
    { length: 100 },
    (_, i) =>
      `function func${i}() {\n  const value = ${i};\n  return value * 2;\n}`
  ).join("\n\n")}`;

  const largeTsCode = `${Array.from(
    { length: 100 },
    (_, i) => `interface Type${i} {\n  id: number;\n  value: string;\n}`
  ).join("\n\n")}`;

  const largePythonCode = `${Array.from(
    { length: 100 },
    (_, i) => `def function_${i}(x):\n    result = x * ${i}\n    return result`
  ).join("\n\n")}`;

  bench(
    "JavaScript large file (300+ lines)",
    async () => {
      const highlighter = await createShiki("javascript", themes);
      highlighter.codeToTokens(largeJsCode, {
        lang: "javascript",
        themes: {
          light: themes[0],
          dark: themes[1],
        },
      });
    },
    { iterations: 1000 }
  );

  bench(
    "TypeScript large file (300+ lines)",
    async () => {
      const highlighter = await createShiki("typescript", themes);
      highlighter.codeToTokens(largeTsCode, {
        lang: "typescript",
        themes: {
          light: themes[0],
          dark: themes[1],
        },
      });
    },
    { iterations: 1000 }
  );

  bench(
    "Python large file (300+ lines)",
    async () => {
      const highlighter = await createShiki("python", themes);
      highlighter.codeToTokens(largePythonCode, {
        lang: "python",
        themes: {
          light: themes[0],
          dark: themes[1],
        },
      });
    },
    { iterations: 1000 }
  );
});

describe("Syntax Highlighting - getHighlightedTokens with Cache", () => {
  const themes: [BundledTheme, BundledTheme] = ["github-light", "github-dark"];

  bench(
    "getHighlightedTokens (cache miss, returns null)",
    () => {
      const uniqueCode = `const unique${Date.now()} = 1;`;
      getHighlightedTokens(uniqueCode, "javascript", themes);
    },
    { iterations: 1000 }
  );

  // Warm up cache
  const warmupCode = "const warmup = true;";
  getHighlightedTokens(warmupCode, "javascript", themes);

  // Wait for cache to populate
  setTimeout(() => {
    bench(
      "getHighlightedTokens (cache hit)",
      () => {
        getHighlightedTokens(warmupCode, "javascript", themes);
      },
      { iterations: 1000 }
    );
  }, 100);

  bench(
    "getHighlightedTokens with callback (cache miss)",
    () => {
      const callbackCode = `const callback${Math.random()} = 1;`;
      getHighlightedTokens(callbackCode, "javascript", themes, () => {
        // Callback will be called when highlighting completes
      });
    },
    { iterations: 1000 }
  );
});

describe("Syntax Highlighting - Different Themes", () => {
  const code = `function example() {
  const value = "test";
  return value.toUpperCase();
}`;

  const themeConfigs: Array<[BundledTheme, BundledTheme]> = [
    ["github-light", "github-dark"],
    ["min-light", "min-dark"],
    ["one-light", "one-dark-pro"],
    ["solarized-light", "solarized-dark"],
  ];

  bench(
    "github themes",
    async () => {
      const highlighter = await createShiki("javascript", themeConfigs[0]);
      highlighter.codeToTokens(code, {
        lang: "javascript",
        themes: {
          light: themeConfigs[0][0],
          dark: themeConfigs[0][1],
        },
      });
    },
    { iterations: 1000 }
  );

  bench(
    "min themes",
    async () => {
      const highlighter = await createShiki("javascript", themeConfigs[1]);
      highlighter.codeToTokens(code, {
        lang: "javascript",
        themes: {
          light: themeConfigs[1][0],
          dark: themeConfigs[1][1],
        },
      });
    },
    { iterations: 1000 }
  );

  bench(
    "one themes",
    async () => {
      const highlighter = await createShiki("javascript", themeConfigs[2]);
      highlighter.codeToTokens(code, {
        lang: "javascript",
        themes: {
          light: themeConfigs[2][0],
          dark: themeConfigs[2][1],
        },
      });
    },
    { iterations: 1000 }
  );

  bench(
    "solarized themes",
    async () => {
      const highlighter = await createShiki("javascript", themeConfigs[3]);
      highlighter.codeToTokens(code, {
        lang: "javascript",
        themes: {
          light: themeConfigs[3][0],
          dark: themeConfigs[3][1],
        },
      });
    },
    { iterations: 1000 }
  );
});

describe("Syntax Highlighting - Streaming Simulation", () => {
  const themes: [BundledTheme, BundledTheme] = ["github-light", "github-dark"];

  const streamingSteps = [
    "const",
    "const x",
    "const x =",
    "const x = 1",
    "const x = 1;",
    "const x = 1;\nconst",
    "const x = 1;\nconst y",
    "const x = 1;\nconst y =",
    "const x = 1;\nconst y = 2",
    "const x = 1;\nconst y = 2;",
  ];

  bench(
    "streaming code highlighting (10 steps)",
    async () => {
      const highlighter = await createShiki("javascript", themes);
      for (const step of streamingSteps) {
        highlighter.codeToTokens(step, {
          lang: "javascript",
          themes: {
            light: themes[0],
            dark: themes[1],
          },
        });
      }
    },
    { iterations: 1000 }
  );

  bench(
    "streaming with cache key generation (10 steps)",
    () => {
      for (const step of streamingSteps) {
        getHighlightedTokens(step, "javascript", themes);
      }
    },
    { iterations: 1000 }
  );
});

describe("Syntax Highlighting - Complex Syntax", () => {
  const themes: [BundledTheme, BundledTheme] = ["github-light", "github-dark"];

  const complexJs = `// Complex JavaScript with various syntax features
import { useState, useEffect } from 'react';
import type { User, ApiResponse } from './types';

/**
 * Fetches user data from API
 * @param {string} userId - The user ID
 * @returns {Promise<User>} User data
 */
async function fetchUser(userId: string): Promise<User> {
  try {
    const response = await fetch(\`/api/users/\${userId}\`);
    if (!response.ok) throw new Error('Failed to fetch');

    const data: ApiResponse<User> = await response.json();
    return data.user;
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
}

const UserComponent = ({ id }: { id: string }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser(id)
      .then(setUser)
      .finally(() => setLoading(false));
  }, [id]);

  return loading ? <div>Loading...</div> : <div>{user?.name}</div>;
};

export default UserComponent;`;

  const complexPython = `# Complex Python with various syntax features
from typing import List, Dict, Optional, Union
from dataclasses import dataclass
from datetime import datetime
import asyncio

@dataclass
class User:
    """User data model"""
    id: int
    name: str
    email: str
    created_at: datetime

    def __post_init__(self):
        if not self.email or '@' not in self.email:
            raise ValueError(f"Invalid email: {self.email}")

    @property
    def age_days(self) -> int:
        """Calculate days since user creation"""
        return (datetime.now() - self.created_at).days

class UserRepository:
    def __init__(self, db_url: str):
        self.db_url = db_url
        self._cache: Dict[int, User] = {}

    async def get_user(self, user_id: int) -> Optional[User]:
        """Fetch user by ID with caching"""
        if user_id in self._cache:
            return self._cache[user_id]

        # Simulate async DB call
        await asyncio.sleep(0.1)
        user = User(
            id=user_id,
            name=f"User {user_id}",
            email=f"user{user_id}@example.com",
            created_at=datetime.now()
        )
        self._cache[user_id] = user
        return user

    async def get_users(self, limit: int = 10) -> List[User]:
        """Fetch multiple users"""
        tasks = [self.get_user(i) for i in range(1, limit + 1)]
        return await asyncio.gather(*tasks)

if __name__ == "__main__":
    repo = UserRepository("postgresql://localhost/users")
    users = asyncio.run(repo.get_users(5))
    print(f"Fetched {len(users)} users")`;

  bench(
    "complex JavaScript/TypeScript (40+ lines)",
    async () => {
      const highlighter = await createShiki("typescript", themes);
      highlighter.codeToTokens(complexJs, {
        lang: "typescript",
        themes: {
          light: themes[0],
          dark: themes[1],
        },
      });
    },
    { iterations: 1000 }
  );

  bench(
    "complex Python (50+ lines)",
    async () => {
      const highlighter = await createShiki("python", themes);
      highlighter.codeToTokens(complexPython, {
        lang: "python",
        themes: {
          light: themes[0],
          dark: themes[1],
        },
      });
    },
    { iterations: 1000 }
  );
});

describe("Syntax Highlighting - Token Cache Keys", () => {
  const themes: [BundledTheme, BundledTheme] = ["github-light", "github-dark"];

  const shortCode = "const x = 1;";
  const mediumCode = "const x = 1;".repeat(50);
  const longCode = "const x = 1;".repeat(500);

  bench(
    "cache key generation (short code)",
    () => {
      getHighlightedTokens(shortCode, "javascript", themes);
    },
    { iterations: 1000 }
  );

  bench(
    "cache key generation (medium code)",
    () => {
      getHighlightedTokens(mediumCode, "javascript", themes);
    },
    { iterations: 1000 }
  );

  bench(
    "cache key generation (long code)",
    () => {
      getHighlightedTokens(longCode, "javascript", themes);
    },
    { iterations: 1000 }
  );

  bench(
    "cache key generation (very long code)",
    () => {
      const veryLongCode = "const x = 1;\n".repeat(10_000);
      getHighlightedTokens(veryLongCode, "javascript", themes);
    },
    { iterations: 1000 }
  );
});
