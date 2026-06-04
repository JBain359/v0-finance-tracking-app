# FinTrack - Personal Finance Tracker

A modern, AI-powered personal finance tracking application built with Next.js that allows users to upload bank statements, view transactions, and chat with their financial data using natural language.

## Architecture Overview

### Tech Stack

- **Frontend Framework**: Next.js 14+ with App Router
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Descope
- **AI/LLM**: AWS Bedrock (Claude)
- **File Storage**: Vercel Blob
- **UI Components**: shadcn/ui
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **CSV Parsing**: PapaParse

### Core Components

#### 1. Authentication (Descope)

The application uses Descope for user authentication, providing:

- Secure JWT-based authentication
- Session management via cookies (`DS` and `DSR`)
- User profile data (name, email, etc.)

**Key Files:**

- `lib/supabase/auth.ts` - Helper functions to extract Descope user ID from JWT
- `app/(auth)/signin/page.tsx` - Sign-in page with Descope flow

#### 2. Database (Supabase)

Supabase provides PostgreSQL database with Row Level Security (RLS) for multi-tenant data isolation.

**Database Schema:**

```sql
-- Statements: Uploaded bank statement files
CREATE TABLE statements (
  id UUID PRIMARY KEY,
  user_id TEXT NOT NULL,
  filename TEXT,
  file_type TEXT,
  blob_pathname TEXT,
  processed BOOLEAN,
  row_count INTEGER,
  created_at TIMESTAMP
);

-- Transactions: Parsed financial transactions
CREATE TABLE transactions (
  id UUID PRIMARY KEY,
  user_id TEXT NOT NULL,
  statement_id UUID REFERENCES statements(id) ON DELETE CASCADE,
  date DATE,
  description TEXT,
  amount NUMERIC,
  transaction_type TEXT, -- 'debit' or 'credit'
  category TEXT,
  merchant TEXT,
  raw_data JSONB
);

-- Categories: Transaction categories
CREATE TABLE categories (
  id UUID PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT,
  keywords TEXT[]
);
```

**Row Level Security:**

RLS policies ensure users can only access their own data using Descope JWT:

```sql
CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  USING (auth.jwt() ->> 'sub' = user_id);
```

The Descope JWT token is passed from cookies to Supabase in `lib/supabase/server.ts`:

```typescript
export async function createClient() {
  const descopeToken = await getDescopeToken();
  return createServerClient(URL, KEY, {
    global: {
      headers: descopeToken ? { Authorization: `Bearer ${descopeToken}` } : {},
    },
  });
}
```

**Key Files:**

- `lib/supabase/server.ts` - Server-side Supabase client with Descope token
- `lib/supabase/client.ts` - Client-side Supabase client
- `supabase/migrations/` - Database migrations including RLS policies

#### 3. AI Chat (AWS Bedrock)

The chat feature uses AWS Bedrock with Claude to enable natural language queries over financial data.

**How it works:**

1. User asks a question about their finances
2. Request is sent to `/api/chat` route
3. Backend queries Supabase for relevant transaction data
4. Data is sent to Bedrock Claude with structured prompts
5. Claude analyzes the data and generates natural language responses

**Key Features:**

- Natural language queries ("How much did I spend on groceries?")
- Automatic data aggregation and analysis
- Context-aware responses
- Suggested questions for new users

**Key Files:**

- `app/(app)/chat/page.tsx` - Server component that checks for data availability
- `app/(app)/chat/chat-interface.tsx` - Client component with chat UI
- `app/api/chat/route.ts` - API route handling Bedrock integration

#### 4. File Upload & Processing

Users can upload bank statements (CSV/PDF format) which are automatically processed.

**Upload Flow:**

1. User selects file on `/upload` page
2. File uploaded to Vercel Blob storage
3. Statement record created in database
4. User triggers processing
5. Backend parses CSV and extracts transactions
6. Transactions are categorized and stored
7. Statement marked as processed

**CSV Parser Features:**

- Intelligent column detection (supports multiple bank formats)
- Flexible date parsing (MM/DD/YYYY, YYYY-MM-DD, etc.)
- Handles separate debit/credit columns or single amount column
- Automatic transaction type detection
- Merchant extraction from descriptions

**Key Files:**

- `app/(app)/upload/page.tsx` - Upload interface
- `app/api/upload/route.ts` - File upload handler
- `app/api/process/route.ts` - CSV parsing and transaction extraction
- `lib/categorize.ts` - Automatic transaction categorization

#### 5. Transaction Management

View, filter, sort, and analyze transactions.

**Features:**

- Paginated table (25 transactions per page)
- Sortable columns (date, amount)
- Date range filtering
- Category and merchant filtering
- Server-side pagination and sorting for performance

**Key Files:**

- `app/(app)/transactions/page.tsx` - Server component with data fetching
- `components/transactions/transactions-table.tsx` - Client component with table UI
- `components/transactions/transactions-filters.tsx` - Filter controls

## Project Structure

```
app/
├── (app)/                 # Authenticated app routes
│   ├── layout.tsx         # App layout with sidebar
│   ├── page.tsx           # Dashboard
│   ├── upload/            # Statement upload
│   ├── transactions/      # Transaction list
│   └── chat/              # AI chat interface
├── (auth)/                # Authentication routes
│   └── signin/            # Sign-in page
└── api/                   # API routes
    ├── chat/              # Bedrock chat endpoint
    ├── upload/            # File upload endpoint
    ├── process/           # Transaction processing
    ├── transactions/      # Transaction CRUD
    └── statements/        # Statement CRUD

components/
├── app-sidebar.tsx        # Main navigation sidebar
├── transactions/          # Transaction-related components
├── upload/                # Upload-related components
├── ui/                    # shadcn/ui components
└── animated-components.tsx # Framer Motion wrappers

lib/
├── supabase/              # Supabase client setup
│   ├── server.ts          # Server-side client
│   ├── client.ts          # Client-side client
│   └── auth.ts            # Auth helpers
├── categorize.ts          # Transaction categorization
└── utils.ts               # Utility functions

supabase/
└── migrations/            # SQL migrations
    ├── 000_cleanup_rls.sql
    └── 001_add_rls.sql
```

## Key Features

### 1. Multi-User Data Isolation

Every table has a `user_id` column with RLS policies ensuring users only see their own data. No application-level filtering needed - security is enforced at the database level.

### 2. Smart Transaction Categorization

Automatic categorization based on merchant names and keywords:

- Groceries (Walmart, Target, Kroger, etc.)
- Restaurants & Dining
- Transportation & Gas
- Shopping & Retail
- Utilities & Bills
- Entertainment
- Health & Fitness

### 3. AI-Powered Insights

Chat with your financial data using natural language:

- Spending analysis by category
- Monthly trends and comparisons
- Merchant spending patterns
- Custom queries

### 4. Responsive Design

Mobile-first design with Tailwind CSS and smooth animations powered by Framer Motion.

## Environment Variables

Required environment variables in `.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Descope
NEXT_PUBLIC_DESCOPE_PROJECT_ID=your_descope_project_id

# AWS Bedrock
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key

# Vercel Blob
BLOB_READ_WRITE_TOKEN=your_blob_token
```

## Getting Started

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Copy `.env.local.example` to `.env.local` and fill in your credentials.

3. **Run database migrations:**

   ```bash
   npx supabase db push
   ```

4. **Start development server:**

   ```bash
   npm run dev
   ```

5. **Open application:**
   Navigate to `http://localhost:3000`

## Database Migrations

To apply migrations to your Supabase database:

```bash
# Using Supabase CLI
npx supabase db push

# Or run migrations manually in Supabase SQL Editor
```

## Authentication Flow

1. User visits `/signin`
2. Descope authentication flow
3. JWT token stored in cookies (`DS` for session, `DSR` for refresh)
4. Token automatically included in Supabase requests
5. RLS policies validate token and filter data by `user_id`

## Data Flow Example: Uploading a Statement

1. **Upload** (`/upload`)
   - User selects CSV file
   - POST `/api/upload` → Vercel Blob storage
   - Statement record created in Supabase with `user_id`

2. **Process** (User clicks "Process")
   - POST `/api/process` with `statementId`
   - Fetch file from Blob storage
   - Parse CSV with PapaParse
   - Categorize transactions
   - Batch insert to `transactions` table with `user_id`
   - Update statement as `processed: true`

3. **View** (`/transactions`)
   - Server component fetches paginated transactions
   - RLS automatically filters by authenticated user
   - Client component displays table with sorting/filtering

4. **Chat** (`/chat`)
   - User asks "How much did I spend on groceries?"
   - POST `/api/chat` with query
   - Fetch relevant transactions from Supabase (RLS filtered)
   - Send to Bedrock Claude with structured prompt
   - Stream response back to client

## Security Considerations

- **Authentication**: Descope provides enterprise-grade auth with JWT
- **Authorization**: Row Level Security at database level
- **File Storage**: Vercel Blob with private access
- **API Routes**: All protected with `getDescopeUserId()` checks
- **No exposed credentials**: All sensitive data in environment variables
- **HTTPS**: Production deployment uses HTTPS by default

## Performance Optimizations

- Server-side pagination (25 items per page)
- Database indexes on `user_id` and `date` columns
- Server Components for data fetching (no client-side overhead)
- Streaming responses from Bedrock
- Efficient RLS policies with indexed columns

## Built with v0

This project was initially bootstrapped with [v0](https://v0.app).

[Continue working on v0 →](https://v0.app/chat/projects/prj_lJmEAwOqpo0iHTRA3UsNQOlyOJFg)

## License

MIT
