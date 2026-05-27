# LoanIQ Pro

Production-oriented React, Vite, and Supabase scaffold for secure loan scenario comparison.

## Architecture

- React + Vite frontend
- Supabase Auth, Postgres, Row-Level Security, and Edge Functions
- `zod` validation on client and Edge Function boundaries
- Server-side approval calculation and scenario persistence
- Recharts visualizations for principal reduction and interest analysis
- PDF and CSV amortization exports
- PWA manifest, mobile viewport hardening, and Open Graph metadata

## Local Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the environment template:

   ```bash
   cp .env.example .env.local
   ```

3. Add your Supabase values:

   ```bash
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-public-anon-key
   ```

4. Run the app:

   ```bash
   npm run dev
   ```

## Supabase Setup

1. Create a Supabase project.
2. Run the SQL in `supabase/sql/001_user_scenarios.sql` from the Supabase SQL editor.
3. Deploy the approval engine:

   ```bash
   supabase functions deploy approval-engine
   ```

4. The Edge Function requires Supabase's built-in function secrets:

   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

5. The `user_scenarios` table has RLS enabled and forced. Read, insert, and delete policies enforce `auth.uid() = user_id`. Direct client inserts cannot write approval results; the Edge Function stores server-calculated results with the service role.

## Vercel Deployment

1. Push this folder to a new GitHub repository.
2. In Vercel, create a new project from that repository.
3. Use the default Vite build settings:

   - Build command: `npm run build`
   - Output directory: `dist`

4. Add these environment variables in Vercel Project Settings:

   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

5. Redeploy after saving environment variables.

## Security Notes

- Never expose Supabase service role keys in Vite or any browser bundle.
- Keep approval, risk scoring, and result persistence in `supabase/functions/approval-engine`.
- Client calculations are for display and export only; compliance-sensitive decisions should be server-derived.
- Replace the Legal page placeholders with counsel-reviewed terms and privacy language before production or app marketplace submission.
