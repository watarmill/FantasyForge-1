import { pgTable, text, serial, integer, timestamp, decimal, boolean, json } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { relations } from 'drizzle-orm';
import { z } from 'zod';

// Users table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  password: text('password').notNull(),
  email: text('email').notNull().unique(),
  fullName: text('full_name').notNull(),
  phone: text('phone'),
  profileImage: text('profile_image'),
  role: text('role').notNull().default('user'), // user, agent, admin
  bio: text('bio'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  properties: many(properties),
  favorites: many(favorites),
  messages: many(messages, { relationName: 'userMessages' }),
  receivedMessages: many(messages, { relationName: 'receivedMessages' }),
}));

// Properties table
export const properties = pgTable('properties', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  price: decimal('price', { precision: 12, scale: 2 }).notNull(),
  address: text('address').notNull(),
  city: text('city').notNull(),
  state: text('state').notNull(),
  zipCode: text('zip_code').notNull(),
  country: text('country').notNull(),
  propertyType: text('property_type').notNull(), // apartment, house, condo, etc.
  status: text('status').notNull().default('active'), // active, pending, sold
  bedrooms: integer('bedrooms').notNull(),
  bathrooms: decimal('bathrooms', { precision: 3, scale: 1 }).notNull(),
  area: decimal('area', { precision: 10, scale: 2 }).notNull(), // in sq ft
  yearBuilt: integer('year_built'),
  features: json('features').$type<string[]>(),
  images: json('images').$type<string[]>().notNull(),
  latitude: decimal('latitude', { precision: 10, scale: 7 }),
  longitude: decimal('longitude', { precision: 10, scale: 7 }),
  ownerId: integer('owner_id').references(() => users.id).notNull(),
  approved: boolean('approved').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const propertiesRelations = relations(properties, ({ one, many }) => ({
  owner: one(users, { fields: [properties.ownerId], references: [users.id] }),
  favorites: many(favorites),
}));

// Favorites table
export const favorites = pgTable('favorites', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  propertyId: integer('property_id').references(() => properties.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const favoritesRelations = relations(favorites, ({ one }) => ({
  user: one(users, { fields: [favorites.userId], references: [users.id] }),
  property: one(properties, { fields: [favorites.propertyId], references: [properties.id] }),
}));

// Messages table
export const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  senderId: integer('sender_id').references(() => users.id).notNull(),
  receiverId: integer('receiver_id').references(() => users.id).notNull(),
  propertyId: integer('property_id').references(() => properties.id),
  content: text('content').notNull(),
  read: boolean('read').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const messagesRelations = relations(messages, ({ one }) => ({
  sender: one(users, { fields: [messages.senderId], references: [users.id], relationName: 'userMessages' }),
  receiver: one(users, { fields: [messages.receiverId], references: [users.id], relationName: 'receivedMessages' }),
  property: one(properties, { fields: [messages.propertyId], references: [properties.id] }),
}));

// Validation schemas
export const insertUserSchema = createInsertSchema(users)
  .extend({
    username: z.string().min(3, "Username must be at least 3 characters"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    email: z.string().email("Must be a valid email address"),
    fullName: z.string().min(2, "Full name must be at least 2 characters"),
    role: z.enum(['user', 'agent', 'admin'], {
      errorMap: () => ({ message: "Role must be one of: user, agent, admin" })
    }),
  });

export const insertPropertySchema = createInsertSchema(properties)
  .extend({
    title: z.string().min(5, "Title must be at least 5 characters"),
    description: z.string().min(20, "Description must be at least 20 characters"),
    price: z.number().positive("Price must be positive"),
    bedrooms: z.number().min(0, "Bedrooms cannot be negative"),
    bathrooms: z.number().min(0, "Bathrooms cannot be negative"),
    area: z.number().positive("Area must be positive"),
    propertyType: z.enum(['apartment', 'house', 'condo', 'townhouse', 'land', 'commercial'], {
      errorMap: () => ({ message: "Property type must be one of: apartment, house, condo, townhouse, land, commercial" })
    }),
    status: z.enum(['active', 'pending', 'sold', 'rented'], {
      errorMap: () => ({ message: "Status must be one of: active, pending, sold, rented" })
    }),
  });

export const insertFavoriteSchema = createInsertSchema(favorites);

export const insertMessageSchema = createInsertSchema(messages)
  .extend({
    content: z.string().min(1, "Message content cannot be empty"),
  });

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Property = typeof properties.$inferSelect;
export type InsertProperty = z.infer<typeof insertPropertySchema>;
export type Favorite = typeof favorites.$inferSelect;
export type InsertFavorite = z.infer<typeof insertFavoriteSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
