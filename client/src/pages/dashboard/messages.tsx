import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { MainLayout } from "@/components/layout/MainLayout";
import { Message, User, Property, InsertMessage } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Avatar,
  AvatarFallback,
  AvatarImage
} from "@/components/ui/avatar";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { 
  MessageSquare, 
  Send, 
  Search, 
  Loader2, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Home 
} from "lucide-react";

// Form schema for message
const messageSchema = z.object({
  content: z.string().min(1, "Message cannot be empty"),
});

type MessageFormValues = z.infer<typeof messageSchema>;

export default function DashboardMessagesPage() {
  const [location] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeConversation, setActiveConversation] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  
  // Parse URL params for receiver ID
  const urlParams = new URLSearchParams(location.split("?")[1] || "");
  const initialReceiverId = urlParams.get("receiver");
  
  // Fetch messages
  const { data: allMessages, isLoading: isMessagesLoading } = useQuery<Message[]>({
    queryKey: ["/api/messages"],
    enabled: !!user,
  });
  
  // Fetch users for message senders/receivers
  const { data: usersMap } = useQuery<{[key: number]: User}>({
    queryKey: ["/api/users/batch"],
    queryFn: async () => {
      if (!allMessages || allMessages.length === 0) return {};
      
      // Get unique user IDs from all messages
      const userIds = [...new Set([
        ...allMessages.map(m => m.senderId), 
        ...allMessages.map(m => m.receiverId)
      ])];
      
      const response = await fetch(`/api/users/batch?ids=${userIds.join(',')}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      
      const users = await response.json();
      return users.reduce((acc: {[key: number]: User}, user: User) => {
        acc[user.id] = user;
        return acc;
      }, {});
    },
    enabled: !!allMessages && allMessages.length > 0,
  });
  
  // Fetch property details for messages that reference properties
  const { data: propertiesMap } = useQuery<{[key: number]: Property}>({
    queryKey: ["/api/properties/batch"],
    queryFn: async () => {
      if (!allMessages || allMessages.length === 0) return {};
      
      // Get unique property IDs from all messages
      const propertyIds = [...new Set(
        allMessages
          .filter(m => m.propertyId !== null)
          .map(m => m.propertyId)
      )].filter(Boolean) as number[];
      
      if (propertyIds.length === 0) return {};
      
      const response = await fetch(`/api/properties/batch?ids=${propertyIds.join(',')}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch properties");
      }
      
      const properties = await response.json();
      return properties.reduce((acc: {[key: number]: Property}, property: Property) => {
        acc[property.id] = property;
        return acc;
      }, {});
    },
    enabled: !!allMessages && allMessages.length > 0,
  });
  
  // Organize messages into conversations
  const conversations = allMessages ? 
    allMessages.reduce((acc: { [key: number]: Message[] }, message: Message) => {
      const conversationPartnerId = message.senderId === user?.id ? message.receiverId : message.senderId;
      
      if (!acc[conversationPartnerId]) {
        acc[conversationPartnerId] = [];
      }
      
      acc[conversationPartnerId].push(message);
      return acc;
    }, {}) : {};
    
  // Sort conversations by most recent message
  const sortedConversations = Object.entries(conversations).map(([userId, messages]) => ({
    userId: parseInt(userId),
    messages: messages.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    lastMessage: messages.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0],
    unreadCount: messages.filter(m => m.senderId.toString() === userId && !m.read).length,
  })).sort((a, b) => new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime());
  
  // Filter conversations by search term
  const filteredConversations = sortedConversations.filter(conversation => {
    const conversationUser = usersMap?.[conversation.userId];
    if (!conversationUser) return false;
    
    return (
      conversationUser.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conversationUser.username.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });
  
  // Get current conversation messages
  const currentConversation = activeConversation ? conversations[activeConversation] : null;
  const currentPartner = activeConversation ? usersMap?.[activeConversation] : null;
  
  // Paginate messages for the current conversation
  const totalPages = currentConversation ? Math.ceil(currentConversation.length / itemsPerPage) : 0;
  const paginatedMessages = currentConversation ?
    [...currentConversation]
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage) :
    [];
  
  // Form for sending messages
  const form = useForm<MessageFormValues>({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      content: "",
    },
  });
  
  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: MessageFormValues) => {
      if (!user) throw new Error("You must be logged in to send messages");
      if (!activeConversation) throw new Error("No active conversation");
      
      const messageData: InsertMessage = {
        senderId: user.id,
        receiverId: activeConversation,
        propertyId: null, // No property reference when sending from messages page
        content: data.content,
      };
      
      await apiRequest("POST", "/api/messages", messageData);
    },
    onSuccess: () => {
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      
      toast({
        title: "Message sent",
        description: "Your message has been sent successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Mark messages as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (messageIds: number[]) => {
      if (messageIds.length === 0) return;
      
      await apiRequest("PATCH", "/api/messages/read", { messageIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
    },
  });
  
  // Handle message submit
  const onSubmitMessage = (data: MessageFormValues) => {
    sendMessageMutation.mutate(data);
  };
  
  // Get user initials for avatar
  const getInitials = (name: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map(part => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };
  
  // Format date for display
  const formatMessageDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // If today, show time only
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // If yesterday, show "Yesterday" with time
    if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // Otherwise show date and time
    return date.toLocaleDateString([], { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Mark messages as read when conversation is opened
  useEffect(() => {
    if (activeConversation && currentConversation) {
      const unreadMessages = currentConversation.filter(
        m => m.senderId === activeConversation && !m.read
      );
      
      if (unreadMessages.length > 0) {
        markAsReadMutation.mutate(unreadMessages.map(m => m.id));
      }
    }
  }, [activeConversation, currentConversation]);
  
  // Set initial receiver from URL params
  useEffect(() => {
    if (initialReceiverId && !activeConversation) {
      const receiverId = parseInt(initialReceiverId);
      
      // Only set if it's a valid conversation
      if (sortedConversations.some(c => c.userId === receiverId)) {
        setActiveConversation(receiverId);
      } else if (usersMap && usersMap[receiverId]) {
        // Create an empty conversation if user exists but no messages yet
        setActiveConversation(receiverId);
      }
    }
  }, [initialReceiverId, sortedConversations, usersMap, activeConversation]);
  
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Messages</h1>
          <p className="text-muted-foreground">
            Your conversations with agents and buyers
          </p>
        </div>
        
        <Card className="flex h-[700px] overflow-hidden">
          {/* Conversation list */}
          <div className="w-full md:w-1/3 border-r">
            <CardHeader className="p-4">
              <CardTitle className="text-lg">Conversations</CardTitle>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input 
                  placeholder="Search messages..." 
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="p-0 overflow-auto h-[calc(700px-85px)]">
              {isMessagesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  {searchTerm ? (
                    <p className="text-muted-foreground px-4">No conversations match your search</p>
                  ) : (
                    <p className="text-muted-foreground px-4">You don't have any messages yet</p>
                  )}
                </div>
              ) : (
                <ul className="divide-y">
                  {filteredConversations.map((conversation) => {
                    const conversationUser = usersMap?.[conversation.userId];
                    if (!conversationUser) return null;
                    
                    return (
                      <li 
                        key={conversation.userId} 
                        className={`p-4 cursor-pointer transition-colors ${
                          activeConversation === conversation.userId 
                            ? "bg-primary/10" 
                            : "hover:bg-muted/50"
                        }`}
                        onClick={() => {
                          setActiveConversation(conversation.userId);
                          setCurrentPage(Math.ceil(conversation.messages.length / itemsPerPage));
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <Avatar>
                            <AvatarImage src={conversationUser.profileImage || ""} alt={conversationUser.fullName} />
                            <AvatarFallback>{getInitials(conversationUser.fullName)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center">
                              <span className="font-medium truncate">{conversationUser.fullName}</span>
                              <span className="text-xs text-muted-foreground">
                                {formatMessageDate(conversation.lastMessage.createdAt).split(',')[0]}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground truncate">
                              {conversation.lastMessage.senderId === user?.id ? "You: " : ""}
                              {conversation.lastMessage.content}
                            </p>
                            {conversation.lastMessage.propertyId && propertiesMap?.[conversation.lastMessage.propertyId] && (
                              <div className="mt-1 flex items-center text-xs text-primary">
                                <Home className="h-3 w-3 mr-1" />
                                <span className="truncate">
                                  {propertiesMap[conversation.lastMessage.propertyId].title}
                                </span>
                              </div>
                            )}
                          </div>
                          {conversation.unreadCount > 0 && (
                            <div className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs">
                              {conversation.unreadCount}
                            </div>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </div>
          
          {/* Message thread */}
          <div className="hidden md:flex flex-col w-2/3">
            {activeConversation && currentPartner ? (
              <>
                <CardHeader className="p-4 border-b">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={currentPartner.profileImage || ""} alt={currentPartner.fullName} />
                      <AvatarFallback>{getInitials(currentPartner.fullName)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{currentPartner.fullName}</CardTitle>
                      <CardDescription>{currentPartner.role === "agent" ? "Real Estate Agent" : "User"}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                
                <div className="flex-1 overflow-auto p-4">
                  {paginatedMessages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Pagination navigation for older messages */}
                      {totalPages > 1 && currentPage < totalPages && (
                        <div className="flex justify-center mb-4">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setCurrentPage(currentPage + 1)}
                          >
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            Load older messages
                          </Button>
                        </div>
                      )}
                      
                      {/* Messages */}
                      <div className="space-y-4">
                        {paginatedMessages.map((message) => {
                          const isOwn = message.senderId === user?.id;
                          const property = message.propertyId ? propertiesMap?.[message.propertyId] : null;
                          
                          return (
                            <div 
                              key={message.id} 
                              className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                            >
                              <div className={`max-w-[70%] ${isOwn ? "bg-primary text-primary-foreground" : "bg-muted"} rounded-lg p-3`}>
                                {property && (
                                  <div className="mb-2 p-2 bg-background/10 rounded text-xs flex items-center gap-1">
                                    <Home className="h-3 w-3" />
                                    <span className="truncate">Re: {property.title}</span>
                                  </div>
                                )}
                                <p className="whitespace-pre-line">{message.content}</p>
                                <p className={`text-xs mt-1 ${isOwn ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                                  {formatMessageDate(message.createdAt)}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      
                      {/* Pagination navigation for newer messages */}
                      {totalPages > 1 && currentPage > 1 && (
                        <div className="flex justify-center mt-4">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setCurrentPage(currentPage - 1)}
                          >
                            Load newer messages
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </div>
                
                <div className="p-4 border-t">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmitMessage)} className="flex gap-2">
                      <FormField
                        control={form.control}
                        name="content"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Textarea 
                                placeholder="Type your message..."
                                className="resize-none min-h-[50px]"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" size="icon" disabled={sendMessageMutation.isPending}>
                        {sendMessageMutation.isPending ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <Send className="h-5 w-5" />
                        )}
                      </Button>
                    </form>
                  </Form>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <MessageSquare className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Conversation Selected</h3>
                  <p className="text-muted-foreground">
                    Choose a conversation from the sidebar to start messaging
                  </p>
                </div>
              </div>
            )}
          </div>
          
          {/* Mobile view for message thread - only shown when a conversation is selected */}
          {activeConversation && currentPartner && (
            <div className="md:hidden absolute inset-0 bg-background z-10 flex flex-col">
              <CardHeader className="p-4 border-b">
                <div className="flex items-center gap-3">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setActiveConversation(null)}
                    className="mr-1"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <Avatar>
                    <AvatarImage src={currentPartner.profileImage || ""} alt={currentPartner.fullName} />
                    <AvatarFallback>{getInitials(currentPartner.fullName)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">{currentPartner.fullName}</CardTitle>
                    <CardDescription>{currentPartner.role === "agent" ? "Real Estate Agent" : "User"}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              
              <div className="flex-1 overflow-auto p-4">
                {paginatedMessages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Pagination navigation for older messages */}
                    {totalPages > 1 && currentPage < totalPages && (
                      <div className="flex justify-center mb-4">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setCurrentPage(currentPage + 1)}
                        >
                          <ChevronLeft className="h-4 w-4 mr-1" />
                          Load older messages
                        </Button>
                      </div>
                    )}
                    
                    {/* Messages */}
                    <div className="space-y-4">
                      {paginatedMessages.map((message) => {
                        const isOwn = message.senderId === user?.id;
                        const property = message.propertyId ? propertiesMap?.[message.propertyId] : null;
                        
                        return (
                          <div 
                            key={message.id} 
                            className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                          >
                            <div className={`max-w-[70%] ${isOwn ? "bg-primary text-primary-foreground" : "bg-muted"} rounded-lg p-3`}>
                              {property && (
                                <div className="mb-2 p-2 bg-background/10 rounded text-xs flex items-center gap-1">
                                  <Home className="h-3 w-3" />
                                  <span className="truncate">Re: {property.title}</span>
                                </div>
                              )}
                              <p className="whitespace-pre-line">{message.content}</p>
                              <p className={`text-xs mt-1 ${isOwn ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                                {formatMessageDate(message.createdAt)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Pagination navigation for newer messages */}
                    {totalPages > 1 && currentPage > 1 && (
                      <div className="flex justify-center mt-4">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setCurrentPage(currentPage - 1)}
                        >
                          Load newer messages
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
              
              <div className="p-4 border-t">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmitMessage)} className="flex gap-2">
                    <FormField
                      control={form.control}
                      name="content"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Textarea 
                              placeholder="Type your message..."
                              className="resize-none min-h-[50px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" size="icon" disabled={sendMessageMutation.isPending}>
                      {sendMessageMutation.isPending ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Send className="h-5 w-5" />
                      )}
                    </Button>
                  </form>
                </Form>
              </div>
            </div>
          )}
        </Card>
      </div>
    </MainLayout>
  );
}
