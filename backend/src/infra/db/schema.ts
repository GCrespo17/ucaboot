// Domain tables go here (public schema).
// Users live in Supabase Auth (auth.users). To reference the host from a domain table:
//   import { authUsers } from "drizzle-orm/supabase";
//   hostId: uuid("host_id").notNull().references(() => authUsers.id)
export {};
