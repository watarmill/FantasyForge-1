import { db } from "./index";
import { users, properties, favorites, messages } from "@shared/schema";
import { eq, sql } from "drizzle-orm";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function seed() {
  try {
    console.log("Starting database seed...");

    // Check if users already exist
    const existingUsers = await db.select({ count: sql`count(*)` }).from(users);
    if (Number(existingUsers[0].count) > 0) {
      console.log("Database already has users, skipping seed");
      return;
    }

    // Create users (admin, agents, and regular users)
    const hashedPassword = await hashPassword("password123");
    
    console.log("Creating users...");
    
    // Admin
    const [admin] = await db.insert(users).values({
      username: "admin",
      password: hashedPassword,
      email: "admin@estatehub.com",
      fullName: "Admin User",
      phone: "555-123-4567",
      role: "admin",
      profileImage: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&h=256&q=80",
      bio: "Platform administrator managing property listings and user accounts.",
    }).returning();
    
    // Agents
    const [agent1] = await db.insert(users).values({
      username: "sarahsmith",
      password: hashedPassword,
      email: "sarah.smith@estatehub.com",
      fullName: "Sarah Smith",
      phone: "555-234-5678",
      role: "agent",
      profileImage: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&h=256&q=80",
      bio: "Experienced real estate agent specializing in luxury residential properties with over 10 years in the industry.",
    }).returning();
    
    const [agent2] = await db.insert(users).values({
      username: "michaeljohnson",
      password: hashedPassword,
      email: "michael.johnson@estatehub.com",
      fullName: "Michael Johnson",
      phone: "555-345-6789",
      role: "agent",
      profileImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&h=256&q=80",
      bio: "Commercial property specialist with expertise in office spaces and retail locations.",
    }).returning();
    
    const [agent3] = await db.insert(users).values({
      username: "emilywilliams",
      password: hashedPassword,
      email: "emily.williams@estatehub.com",
      fullName: "Emily Williams",
      phone: "555-456-7890",
      role: "agent",
      profileImage: "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&h=256&q=80",
      bio: "New construction and development expert helping clients find their perfect modern home.",
    }).returning();
    
    const [agent4] = await db.insert(users).values({
      username: "davidbrown",
      password: hashedPassword,
      email: "david.brown@estatehub.com",
      fullName: "David Brown",
      phone: "555-567-8901",
      role: "agent",
      profileImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&h=256&q=80",
      bio: "Investment property specialist helping clients build their real estate portfolio for maximum returns.",
    }).returning();
    
    // Regular users
    const [user1] = await db.insert(users).values({
      username: "janecooper",
      password: hashedPassword,
      email: "jane.cooper@example.com",
      fullName: "Jane Cooper",
      phone: "555-678-9012",
      role: "user",
      profileImage: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&h=256&q=80",
    }).returning();
    
    const [user2] = await db.insert(users).values({
      username: "robertfox",
      password: hashedPassword,
      email: "robert.fox@example.com",
      fullName: "Robert Fox",
      phone: "555-789-0123",
      role: "user",
      profileImage: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&h=256&q=80",
    }).returning();
    
    // Create properties
    console.log("Creating properties...");
    
    // Property 1
    const [property1] = await db.insert(properties).values({
      title: "Modern Luxury Villa with Pool",
      description: "This stunning modern villa features an open floor plan, high ceilings, and floor-to-ceiling windows that fill the space with natural light. The property includes a private pool, landscaped garden, and a spacious terrace perfect for entertaining. The gourmet kitchen is equipped with high-end appliances and the master suite offers a spa-like bathroom and walk-in closet.",
      price: 1250000,
      address: "123 Sunset Blvd",
      city: "Los Angeles",
      state: "CA",
      zipCode: "90210",
      country: "United States",
      propertyType: "house",
      status: "active",
      bedrooms: 5,
      bathrooms: 4.5,
      area: 4200,
      yearBuilt: 2020,
      features: ["pool", "garage", "airConditioning", "gym", "security"],
      images: [
        "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=800&q=80",
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=800&q=80",
        "https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=800&q=80"
      ],
      latitude: 34.0901,
      longitude: -118.3828,
      ownerId: agent1.id,
      approved: true
    }).returning();
    
    // Property 2
    const [property2] = await db.insert(properties).values({
      title: "Downtown Luxury Condo",
      description: "Located in the heart of downtown, this luxury condo offers spectacular views of the city skyline. Features include hardwood floors, gourmet kitchen with stainless steel appliances, spacious living area, and a private balcony. The building amenities include a fitness center, rooftop pool, and 24-hour concierge service.",
      price: 875000,
      address: "456 Main St, Unit 15A",
      city: "New York",
      state: "NY",
      zipCode: "10001",
      country: "United States",
      propertyType: "condo",
      status: "active",
      bedrooms: 2,
      bathrooms: 2,
      area: 1500,
      yearBuilt: 2018,
      features: ["elevator", "balcony", "parking", "security", "furnished"],
      images: [
        "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=800&q=80",
        "https://images.unsplash.com/photo-1600210492493-0946911123ea?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=800&q=80",
        "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=800&q=80"
      ],
      latitude: 40.7500,
      longitude: -73.9967,
      ownerId: agent2.id,
      approved: true
    }).returning();
    
    // Property 3
    const [property3] = await db.insert(properties).values({
      title: "Charming Historic Townhouse",
      description: "This beautiful townhouse combines historic charm with modern amenities. Original architectural details include hardwood floors, crown moldings, and a wood-burning fireplace. The gourmet kitchen has been updated with high-end appliances and granite countertops. Enjoy the private backyard garden perfect for relaxing or entertaining.",
      price: 925000,
      address: "789 Oak Street",
      city: "Boston",
      state: "MA",
      zipCode: "02116",
      country: "United States",
      propertyType: "townhouse",
      status: "active",
      bedrooms: 3,
      bathrooms: 2.5,
      area: 2200,
      yearBuilt: 1910,
      features: ["fireplace", "garden", "heating", "petFriendly"],
      images: [
        "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=800&q=80",
        "https://images.unsplash.com/photo-1600585154526-990dced4db0d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=800&q=80",
        "https://images.unsplash.com/photo-1568605114967-8130f3a36994?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=800&q=80"
      ],
      latitude: 42.3501,
      longitude: -71.0703,
      ownerId: agent3.id,
      approved: true
    }).returning();
    
    // Property 4
    const [property4] = await db.insert(properties).values({
      title: "Modern Apartment with City Views",
      description: "This sleek, modern apartment features an open layout with floor-to-ceiling windows that showcase breathtaking city views. The kitchen is equipped with high-end appliances and the living room opens to a private balcony. Building amenities include a fitness center, resident lounge, and 24-hour doorman.",
      price: 650000,
      address: "101 River View Dr, Apt 24B",
      city: "Chicago",
      state: "IL",
      zipCode: "60601",
      country: "United States",
      propertyType: "apartment",
      status: "active",
      bedrooms: 2,
      bathrooms: 2,
      area: 1100,
      yearBuilt: 2015,
      features: ["balcony", "elevator", "airConditioning", "laundry"],
      images: [
        "https://images.unsplash.com/photo-1493246318656-5bfd4cfb29b8?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=800&q=80",
        "https://images.unsplash.com/photo-1493809842364-78817add7ffb?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=800&q=80",
        "https://images.unsplash.com/photo-1460317442991-0ec209397118?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=800&q=80"
      ],
      latitude: 41.8827,
      longitude: -87.6233,
      ownerId: agent4.id,
      approved: true
    }).returning();
    
    // Property 5
    const [property5] = await db.insert(properties).values({
      title: "Luxury Waterfront Estate",
      description: "This magnificent waterfront estate offers the ultimate luxury lifestyle with stunning views and private beach access. The property features soaring ceilings, walls of glass, and exquisite finishes throughout. Outdoor amenities include an infinity pool, spa, outdoor kitchen, and expansive terrace for entertaining.",
      price: 3500000,
      address: "555 Ocean Drive",
      city: "Miami",
      state: "FL",
      zipCode: "33139",
      country: "United States",
      propertyType: "house",
      status: "active",
      bedrooms: 6,
      bathrooms: 7.5,
      area: 6500,
      yearBuilt: 2019,
      features: ["pool", "spa", "garage", "security", "waterfront"],
      images: [
        "https://images.unsplash.com/photo-1613490493576-7fde63acd811?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=800&q=80",
        "https://images.unsplash.com/photo-1600585153490-76fb20a32601?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=800&q=80",
        "https://images.unsplash.com/photo-1600566752355-35792bedcfea?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=800&q=80"
      ],
      latitude: 25.7907,
      longitude: -80.1300,
      ownerId: agent1.id,
      approved: true
    }).returning();
    
    // Property 6
    const [property6] = await db.insert(properties).values({
      title: "Commercial Office Space",
      description: "Prime commercial office space in the business district with modern finishes and excellent amenities. The space features an open layout that can be customized to suit your business needs. Building amenities include a lobby with 24-hour security, conference rooms, and covered parking.",
      price: 1200000,
      address: "789 Business Park Way",
      city: "San Francisco",
      state: "CA",
      zipCode: "94105",
      country: "United States",
      propertyType: "commercial",
      status: "active",
      bedrooms: 0,
      bathrooms: 2,
      area: 3000,
      yearBuilt: 2010,
      features: ["elevator", "parking", "security", "airConditioning"],
      images: [
        "https://images.unsplash.com/photo-1497366754035-f200968a6e72?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=800&q=80",
        "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=800&q=80",
        "https://images.unsplash.com/photo-1497366811353-6870744d04b2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=800&q=80"
      ],
      latitude: 37.7897,
      longitude: -122.3999,
      ownerId: agent2.id,
      approved: true
    }).returning();
    
    // Create some favorites
    console.log("Creating favorites...");
    await db.insert(favorites).values([
      { userId: user1.id, propertyId: property1.id },
      { userId: user1.id, propertyId: property3.id },
      { userId: user2.id, propertyId: property2.id },
      { userId: user2.id, propertyId: property5.id }
    ]);
    
    // Create some messages
    console.log("Creating messages...");
    await db.insert(messages).values([
      {
        senderId: user1.id,
        receiverId: agent1.id,
        propertyId: property1.id,
        content: "Hi, I'm interested in scheduling a viewing for this property. Is it possible to visit this weekend?",
        read: true
      },
      {
        senderId: agent1.id,
        receiverId: user1.id,
        propertyId: property1.id,
        content: "Hello Jane! Thank you for your interest. Yes, I'm available this Saturday at 2 PM or Sunday at 11 AM. Would either of those times work for you?",
        read: false
      },
      {
        senderId: user2.id,
        receiverId: agent2.id,
        propertyId: property2.id,
        content: "I have a few questions about the condo. Does the monthly HOA fee cover utilities? And is there assigned parking?",
        read: true
      },
      {
        senderId: agent2.id,
        receiverId: user2.id,
        propertyId: property2.id,
        content: "Hi Robert, the HOA fee covers water and trash, but not electricity. Yes, there is one assigned parking space included with the unit. Let me know if you have any other questions!",
        read: false
      }
    ]);
    
    console.log("Database seeded successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}



seed();
