import { db } from "@db";
import { 
  users, 
  properties, 
  favorites, 
  messages, 
  User, 
  InsertUser, 
  Property, 
  InsertProperty, 
  Favorite, 
  InsertFavorite, 
  Message, 
  InsertMessage
} from "@shared/schema";
import { eq, and, or, desc, sql, count } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "@db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User related methods
  getUser(id: number): Promise<User>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUsers(role?: string, limit?: number): Promise<User[]>;
  getUsersByIds(ids: number[]): Promise<User[]>;
  createUser(data: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<User>): Promise<User>;

  // Property related methods
  getProperty(id: number): Promise<Property>;
  getProperties(params: {
    ownerId?: number;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    propertyType?: string;
    status?: string;
    bedrooms?: number;
    bathrooms?: number;
    featured?: boolean;
    limit?: number;
  }): Promise<Property[]>;
  getPropertiesByIds(ids: number[]): Promise<Property[]>;
  createProperty(data: InsertProperty): Promise<Property>;
  updateProperty(id: number, data: Partial<Property>): Promise<Property>;
  deleteProperty(id: number): Promise<void>;
  getPropertyCountsByUserId(): Promise<{[key: number]: number}>;

  // Favorites related methods
  getFavorites(userId: number): Promise<Favorite[]>;
  getFavoriteProperties(userId: number, limit?: number): Promise<Property[]>;
  checkFavorite(userId: number, propertyId: number): Promise<boolean>;
  addFavorite(data: InsertFavorite): Promise<Favorite>;
  removeFavorite(userId: number, propertyId: number): Promise<void>;

  // Message related methods
  getMessage(id: number): Promise<Message>;
  getMessages(userId: number, limit?: number): Promise<Message[]>;
  createMessage(data: InsertMessage): Promise<Message>;
  markMessagesAsRead(messageIds: number[]): Promise<void>;

  // Session store
  sessionStore: session.SessionStore;
}

class PostgresStorage implements IStorage {
  sessionStore: session.SessionStore;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  // User related methods
  async getUser(id: number): Promise<User> {
    const result = await db.select().from(users).where(eq(users.id, id));
    if (result.length === 0) {
      throw new Error(`User with id ${id} not found`);
    }
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result[0];
  }

  async getUsers(role?: string, limit?: number): Promise<User[]> {
    let query = db.select().from(users);
    
    if (role) {
      query = query.where(eq(users.role, role));
    }
    
    if (limit) {
      query = query.limit(limit);
    }
    
    return await query;
  }

  async getUsersByIds(ids: number[]): Promise<User[]> {
    if (ids.length === 0) return [];
    
    return await db.select().from(users).where(sql`${users.id} IN (${sql.join(ids)})`);
  }

  async createUser(data: InsertUser): Promise<User> {
    const result = await db.insert(users).values(data).returning();
    return result[0];
  }

  async updateUser(id: number, data: Partial<User>): Promise<User> {
    const result = await db.update(users).set(data).where(eq(users.id, id)).returning();
    if (result.length === 0) {
      throw new Error(`User with id ${id} not found`);
    }
    return result[0];
  }

  // Property related methods
  async getProperty(id: number): Promise<Property> {
    const result = await db.select().from(properties).where(eq(properties.id, id));
    if (result.length === 0) {
      throw new Error(`Property with id ${id} not found`);
    }
    return result[0];
  }

  async getProperties(params: {
    ownerId?: number;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    propertyType?: string;
    status?: string;
    bedrooms?: number;
    bathrooms?: number;
    featured?: boolean;
    limit?: number;
  }): Promise<Property[]> {
    let query = db.select().from(properties);
    
    // Apply filters
    const conditions = [];
    
    if (params.ownerId) {
      conditions.push(eq(properties.ownerId, params.ownerId));
    }
    
    if (params.propertyType && params.propertyType !== 'any') {
      conditions.push(eq(properties.propertyType, params.propertyType));
    }
    
    if (params.status && params.status !== 'any') {
      conditions.push(eq(properties.status, params.status));
    }
    
    if (params.minPrice) {
      conditions.push(sql`${properties.price} >= ${params.minPrice}`);
    }
    
    if (params.maxPrice) {
      conditions.push(sql`${properties.price} <= ${params.maxPrice}`);
    }
    
    if (params.bedrooms) {
      conditions.push(sql`${properties.bedrooms} >= ${params.bedrooms}`);
    }
    
    if (params.bathrooms) {
      conditions.push(sql`${properties.bathrooms} >= ${params.bathrooms}`);
    }
    
    if (params.search) {
      conditions.push(
        or(
          sql`${properties.title} ILIKE ${`%${params.search}%`}`,
          sql`${properties.description} ILIKE ${`%${params.search}%`}`,
          sql`${properties.address} ILIKE ${`%${params.search}%`}`,
          sql`${properties.city} ILIKE ${`%${params.search}%`}`,
          sql`${properties.state} ILIKE ${`%${params.search}%`}`
        )
      );
    }
    
    // Apply approved filter for regular users
    conditions.push(eq(properties.approved, true));
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    // Order by created date
    query = query.orderBy(desc(properties.createdAt));
    
    // Apply limit
    if (params.limit) {
      query = query.limit(params.limit);
    }
    
    return await query;
  }

  async getPropertiesByIds(ids: number[]): Promise<Property[]> {
    if (ids.length === 0) return [];
    
    return await db.select().from(properties).where(sql`${properties.id} IN (${sql.join(ids)})`);
  }

  async createProperty(data: InsertProperty): Promise<Property> {
    const result = await db.insert(properties).values(data).returning();
    return result[0];
  }

  async updateProperty(id: number, data: Partial<Property>): Promise<Property> {
    const result = await db.update(properties).set(data).where(eq(properties.id, id)).returning();
    if (result.length === 0) {
      throw new Error(`Property with id ${id} not found`);
    }
    return result[0];
  }

  async deleteProperty(id: number): Promise<void> {
    // First delete any favorites that reference this property
    await db.delete(favorites).where(eq(favorites.propertyId, id));
    
    // Then delete the property
    await db.delete(properties).where(eq(properties.id, id));
  }

  async getPropertyCountsByUserId(): Promise<{[key: number]: number}> {
    const result = await db
      .select({
        userId: properties.ownerId,
        count: count()
      })
      .from(properties)
      .groupBy(properties.ownerId);
    
    return result.reduce((acc, { userId, count }) => {
      acc[userId] = Number(count);
      return acc;
    }, {} as {[key: number]: number});
  }

  // Favorites related methods
  async getFavorites(userId: number): Promise<Favorite[]> {
    return await db.select().from(favorites).where(eq(favorites.userId, userId));
  }

  async getFavoriteProperties(userId: number, limit?: number): Promise<Property[]> {
    let query = db
      .select({
        property: properties
      })
      .from(favorites)
      .innerJoin(properties, eq(favorites.propertyId, properties.id))
      .where(eq(favorites.userId, userId))
      .orderBy(desc(favorites.createdAt));
    
    if (limit) {
      query = query.limit(limit);
    }
    
    const result = await query;
    return result.map(item => item.property);
  }

  async checkFavorite(userId: number, propertyId: number): Promise<boolean> {
    const result = await db
      .select()
      .from(favorites)
      .where(and(eq(favorites.userId, userId), eq(favorites.propertyId, propertyId)));
    
    return result.length > 0;
  }

  async addFavorite(data: InsertFavorite): Promise<Favorite> {
    // Check if favorite already exists
    const existing = await this.checkFavorite(data.userId, data.propertyId);
    if (existing) {
      throw new Error("Property is already favorited");
    }
    
    const result = await db.insert(favorites).values(data).returning();
    return result[0];
  }

  async removeFavorite(userId: number, propertyId: number): Promise<void> {
    await db
      .delete(favorites)
      .where(and(eq(favorites.userId, userId), eq(favorites.propertyId, propertyId)));
  }

  // Message related methods
  async getMessage(id: number): Promise<Message> {
    const result = await db.select().from(messages).where(eq(messages.id, id));
    if (result.length === 0) {
      throw new Error(`Message with id ${id} not found`);
    }
    return result[0];
  }

  async getMessages(userId: number, limit?: number): Promise<Message[]> {
    let query = db
      .select()
      .from(messages)
      .where(or(eq(messages.senderId, userId), eq(messages.receiverId, userId)))
      .orderBy(desc(messages.createdAt));
    
    if (limit) {
      query = query.limit(limit);
    }
    
    return await query;
  }

  async createMessage(data: InsertMessage): Promise<Message> {
    const result = await db.insert(messages).values(data).returning();
    return result[0];
  }

  async markMessagesAsRead(messageIds: number[]): Promise<void> {
    if (messageIds.length === 0) return;
    
    await db
      .update(messages)
      .set({ read: true })
      .where(sql`${messages.id} IN (${sql.join(messageIds)})`);
  }
}

export const storage: IStorage = new PostgresStorage();
