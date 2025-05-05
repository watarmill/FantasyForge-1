import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth, requireAuth, requireRole } from "./auth";
import { storage } from "./storage";
import { insertPropertySchema, insertFavoriteSchema, insertMessageSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);

  // User routes
  app.get("/api/users", async (req, res) => {
    try {
      const role = req.query.role as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      
      const users = await storage.getUsers(role, limit);
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(404).json({ message: "User not found" });
    }
  });

  app.get("/api/users/batch", async (req, res) => {
    try {
      const idsParam = req.query.ids as string;
      if (!idsParam) {
        return res.status(400).json({ message: "No user IDs provided" });
      }
      
      const ids = idsParam.split(',').map(id => parseInt(id));
      const users = await storage.getUsersByIds(ids);
      res.json(users);
    } catch (error) {
      console.error("Error fetching batch users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get("/api/users/property-counts", async (req, res) => {
    try {
      const counts = await storage.getPropertyCountsByUserId();
      res.json(counts);
    } catch (error) {
      console.error("Error fetching property counts:", error);
      res.status(500).json({ message: "Failed to fetch property counts" });
    }
  });

  // Property routes
  app.get("/api/properties", async (req, res) => {
    try {
      const params = {
        ownerId: req.query.ownerId ? parseInt(req.query.ownerId as string) : undefined,
        search: req.query.search as string | undefined,
        minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
        maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
        propertyType: req.query.propertyType as string | undefined,
        status: req.query.status as string | undefined,
        bedrooms: req.query.bedrooms ? parseInt(req.query.bedrooms as string) : undefined,
        bathrooms: req.query.bathrooms ? parseFloat(req.query.bathrooms as string) : undefined,
        featured: req.query.featured === 'true',
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      };

      const properties = await storage.getProperties(params);
      res.json(properties);
    } catch (error) {
      console.error("Error fetching properties:", error);
      res.status(500).json({ message: "Failed to fetch properties" });
    }
  });

  app.get("/api/properties/:id", async (req, res) => {
    try {
      const propertyId = parseInt(req.params.id);
      const property = await storage.getProperty(propertyId);
      res.json(property);
    } catch (error) {
      console.error("Error fetching property:", error);
      res.status(404).json({ message: "Property not found" });
    }
  });

  app.get("/api/properties/batch", async (req, res) => {
    try {
      const idsParam = req.query.ids as string;
      if (!idsParam) {
        return res.status(400).json({ message: "No property IDs provided" });
      }
      
      const ids = idsParam.split(',').map(id => parseInt(id));
      const properties = await storage.getPropertiesByIds(ids);
      res.json(properties);
    } catch (error) {
      console.error("Error fetching batch properties:", error);
      res.status(500).json({ message: "Failed to fetch properties" });
    }
  });

  app.post("/api/properties", requireRole(["agent", "admin"]), async (req, res) => {
    try {
      const validatedData = insertPropertySchema.parse({
        ...req.body,
        ownerId: req.user.id
      });
      
      // Set approved status based on user role
      const isApproved = req.user.role === "admin";
      
      const property = await storage.createProperty({
        ...validatedData,
        approved: isApproved
      });
      
      res.status(201).json(property);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error("Error creating property:", error);
      res.status(500).json({ message: "Failed to create property" });
    }
  });

  app.put("/api/properties/:id", requireAuth, async (req, res) => {
    try {
      const propertyId = parseInt(req.params.id);
      const property = await storage.getProperty(propertyId);
      
      // Check if user is authorized to update the property
      if (property.ownerId !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ message: "You don't have permission to update this property" });
      }
      
      const validatedData = insertPropertySchema.parse(req.body);
      
      // If updating as admin, allow changing any field
      // If updating as owner, don't allow changing certain fields like approval status
      const dataToUpdate = req.user.role === "admin" 
        ? validatedData 
        : { ...validatedData, approved: property.approved };
      
      const updatedProperty = await storage.updateProperty(propertyId, dataToUpdate);
      res.json(updatedProperty);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error("Error updating property:", error);
      res.status(500).json({ message: "Failed to update property" });
    }
  });

  app.delete("/api/properties/:id", requireAuth, async (req, res) => {
    try {
      const propertyId = parseInt(req.params.id);
      const property = await storage.getProperty(propertyId);
      
      // Check if user is authorized to delete the property
      if (property.ownerId !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ message: "You don't have permission to delete this property" });
      }
      
      await storage.deleteProperty(propertyId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting property:", error);
      res.status(500).json({ message: "Failed to delete property" });
    }
  });

  // Favorites routes
  app.get("/api/favorites", requireAuth, async (req, res) => {
    try {
      const favorites = await storage.getFavorites(req.user.id);
      res.json(favorites);
    } catch (error) {
      console.error("Error fetching favorites:", error);
      res.status(500).json({ message: "Failed to fetch favorites" });
    }
  });

  app.get("/api/favorites/properties", requireAuth, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const favoriteProperties = await storage.getFavoriteProperties(req.user.id, limit);
      res.json(favoriteProperties);
    } catch (error) {
      console.error("Error fetching favorite properties:", error);
      res.status(500).json({ message: "Failed to fetch favorite properties" });
    }
  });

  app.get("/api/favorites/check/:propertyId", requireAuth, async (req, res) => {
    try {
      const propertyId = parseInt(req.params.propertyId);
      const isFavorited = await storage.checkFavorite(req.user.id, propertyId);
      res.json(isFavorited);
    } catch (error) {
      console.error("Error checking favorite:", error);
      res.status(500).json({ message: "Failed to check favorite status" });
    }
  });

  app.post("/api/favorites", requireAuth, async (req, res) => {
    try {
      const validatedData = insertFavoriteSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      const favorite = await storage.addFavorite(validatedData);
      res.status(201).json(favorite);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error("Error adding favorite:", error);
      res.status(500).json({ message: "Failed to add favorite" });
    }
  });

  app.delete("/api/favorites/:propertyId", requireAuth, async (req, res) => {
    try {
      const propertyId = parseInt(req.params.propertyId);
      await storage.removeFavorite(req.user.id, propertyId);
      res.status(204).send();
    } catch (error) {
      console.error("Error removing favorite:", error);
      res.status(500).json({ message: "Failed to remove favorite" });
    }
  });

  // Message routes
  app.get("/api/messages", requireAuth, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const messages = await storage.getMessages(req.user.id, limit);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post("/api/messages", requireAuth, async (req, res) => {
    try {
      const validatedData = insertMessageSchema.parse({
        ...req.body,
        senderId: req.user.id
      });
      
      const message = await storage.createMessage(validatedData);
      res.status(201).json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error("Error creating message:", error);
      res.status(500).json({ message: "Failed to create message" });
    }
  });

  app.patch("/api/messages/read", requireAuth, async (req, res) => {
    try {
      const { messageIds } = req.body;
      if (!Array.isArray(messageIds) || messageIds.length === 0) {
        return res.status(400).json({ message: "Invalid message IDs" });
      }
      
      await storage.markMessagesAsRead(messageIds);
      res.status(204).send();
    } catch (error) {
      console.error("Error marking messages as read:", error);
      res.status(500).json({ message: "Failed to mark messages as read" });
    }
  });

  // Admin routes
  app.get("/api/admin/properties", requireRole(["admin"]), async (req, res) => {
    try {
      // Get all properties including unapproved ones
      const properties = await storage.getProperties({});
      res.json(properties);
    } catch (error) {
      console.error("Error fetching properties for admin:", error);
      res.status(500).json({ message: "Failed to fetch properties" });
    }
  });

  app.patch("/api/admin/properties/:id/approve", requireRole(["admin"]), async (req, res) => {
    try {
      const propertyId = parseInt(req.params.id);
      const property = await storage.getProperty(propertyId);
      
      const updatedProperty = await storage.updateProperty(propertyId, {
        ...property,
        approved: true
      });
      
      res.json(updatedProperty);
    } catch (error) {
      console.error("Error approving property:", error);
      res.status(500).json({ message: "Failed to approve property" });
    }
  });

  // Create the HTTP server
  const httpServer = createServer(app);
  return httpServer;
}
