import { useState, useRef, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  MessageCircle,
  Search,
  Book,
  ThumbsUp,
  ThumbsDown,
  Send,
  Sparkles,
  FileQuestion,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

const categoryLabels: Record<string, string> = {
  enrollment: 'Enrôlement',
  payments: 'Paiements',
  technical: 'Technique',
  cnps_cmu: 'CNPS/CMU',
  cooperatives: 'Coopératives',
  general: 'Général',
};

const categoryColors: Record<string, string> = {
  enrollment: 'bg-blue-100 text-blue-800',
  payments: 'bg-green-100 text-green-800',
  technical: 'bg-purple-100 text-purple-800',
  cnps_cmu: 'bg-orange-100 text-orange-800',
  cooperatives: 'bg-pink-100 text-pink-800',
  general: 'bg-gray-100 text-gray-800',
};

export default function AgentSupport() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [chatMessage, setChatMessage] = useState('');
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Queries
  const { data: categories } = trpc.agentSupport.getFaqCategories.useQuery();
  const { data: faqResults } = trpc.agentSupport.searchFaq.useQuery({
    query: searchQuery,
    category: selectedCategory as any,
  });
  const { data: conversation } = trpc.agentSupport.getConversation.useQuery(
    { conversationId: activeConversationId! },
    { enabled: !!activeConversationId }
  );
  const { data: myConversations } = trpc.agentSupport.getMyConversations.useQuery({ limit: 5 });

  // Mutations
  const createConversation = trpc.agentSupport.createConversation.useMutation({
    onSuccess: (data) => {
      setActiveConversationId(data.conversationId);
      toast.success('Nouvelle conversation créée');
    },
  });

  const sendMessage = trpc.agentSupport.sendMessage.useMutation({
    onSuccess: () => {
      setChatMessage('');
      // Scroll to bottom
      setTimeout(() => {
        if (chatScrollRef.current) {
          chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
        }
      }, 100);
    },
  });

  const voteFaq = trpc.agentSupport.voteFaqArticle.useMutation({
    onSuccess: () => {
      toast.success('Merci pour votre feedback !');
    },
  });

  const handleStartChat = () => {
    createConversation.mutate();
  };

  const handleSendMessage = () => {
    if (!chatMessage.trim() || !activeConversationId) return;

    sendMessage.mutate({
      conversationId: activeConversationId,
      message: chatMessage,
    });
  };

  // Auto-scroll au nouveau message
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [conversation?.messages]);

  return (
    <div className="container py-8">
      {/* En-tête */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <FileQuestion className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Support N1</h1>
        </div>
        <p className="text-gray-600">FAQ interactive et assistance IA pour agents terrain</p>
      </div>

      <Tabs defaultValue="faq" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="faq">
            <Book className="h-4 w-4 mr-2" />
            FAQ
          </TabsTrigger>
          <TabsTrigger value="chat">
            <MessageCircle className="h-4 w-4 mr-2" />
            Chatbot IA
          </TabsTrigger>
        </TabsList>

        {/* Onglet FAQ */}
        <TabsContent value="faq" className="space-y-6">
          {/* Recherche */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    placeholder="Rechercher dans la FAQ..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Catégories */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories?.map((cat) => (
              <Card
                key={cat.category}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedCategory === cat.category ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => setSelectedCategory(selectedCategory === cat.category ? undefined : cat.category)}
              >
                <CardContent className="pt-6 text-center">
                  <Badge className={`mb-2 ${categoryColors[cat.category]}`}>
                    {categoryLabels[cat.category]}
                  </Badge>
                  <p className="text-2xl font-bold text-gray-900">{cat.count}</p>
                  <p className="text-xs text-gray-600">{cat.totalViews} vues</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Résultats FAQ */}
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedCategory ? `${categoryLabels[selectedCategory]}` : 'Tous les articles'}
              </CardTitle>
              <CardDescription>
                {faqResults?.length || 0} article(s) trouvé(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {faqResults && faqResults.length > 0 ? (
                <Accordion type="single" collapsible className="w-full">
                  {faqResults.map((faq) => (
                    <AccordionItem key={faq.id} value={`faq-${faq.id}`}>
                      <AccordionTrigger className="text-left">
                        <div className="flex items-start gap-3 flex-1">
                          <Badge className={`${categoryColors[faq.category]} shrink-0`}>
                            {categoryLabels[faq.category]}
                          </Badge>
                          <span className="font-semibold">{faq.question}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4">
                          <p className="text-gray-700 whitespace-pre-wrap">{faq.answer}</p>
                          <div className="flex items-center gap-4 pt-4 border-t">
                            <span className="text-sm text-gray-600">Cet article vous a-t-il été utile ?</span>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => voteFaq.mutate({ id: faq.id, vote: 'up' })}
                              >
                                <ThumbsUp className="h-4 w-4 mr-1" />
                                {faq.upvotes}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => voteFaq.mutate({ id: faq.id, vote: 'down' })}
                              >
                                <ThumbsDown className="h-4 w-4 mr-1" />
                                {faq.downvotes}
                              </Button>
                            </div>
                            <span className="text-sm text-gray-500 ml-auto">{faq.views} vues</span>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">Aucun article trouvé</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Chatbot */}
        <TabsContent value="chat" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Zone de chat */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  Assistant IA
                </CardTitle>
                <CardDescription>
                  Posez vos questions en temps réel et recevez des réponses instantanées
                </CardDescription>
              </CardHeader>
              <CardContent>
                {activeConversationId ? (
                  <div className="space-y-4">
                    {/* Messages */}
                    <ScrollArea className="h-[400px] pr-4" ref={chatScrollRef}>
                      <div className="space-y-4">
                        {conversation?.messages.map((msg: any, index: number) => (
                          <div
                            key={index}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                                msg.role === 'user'
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-100 text-gray-900'
                              }`}
                            >
                              <p className="whitespace-pre-wrap">{msg.content}</p>
                            </div>
                          </div>
                        ))}
                        {sendMessage.isPending && (
                          <div className="flex justify-start">
                            <div className="bg-gray-100 rounded-lg px-4 py-2">
                              <div className="flex gap-2">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </ScrollArea>

                    {/* Input */}
                    <div className="flex gap-2">
                      <Input
                        placeholder="Tapez votre message..."
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        disabled={sendMessage.isPending}
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={!chatMessage.trim() || sendMessage.isPending}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <MessageCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Démarrez une conversation
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Notre assistant IA est là pour répondre à toutes vos questions
                    </p>
                    <Button onClick={handleStartChat} disabled={createConversation.isPending}>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Nouvelle conversation
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Historique des conversations */}
            <Card>
              <CardHeader>
                <CardTitle>Conversations récentes</CardTitle>
                <CardDescription>Vos 5 dernières conversations</CardDescription>
              </CardHeader>
              <CardContent>
                {myConversations && myConversations.length > 0 ? (
                  <div className="space-y-2">
                    {myConversations.map((conv) => (
                      <Button
                        key={conv.id}
                        variant={activeConversationId === conv.id ? 'default' : 'outline'}
                        className="w-full justify-start"
                        onClick={() => setActiveConversationId(conv.id)}
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        <div className="flex-1 text-left">
                          <p className="text-sm font-semibold">Conversation #{conv.id}</p>
                          <p className="text-xs text-gray-500">{conv.messageCount} messages</p>
                        </div>
                        <Badge
                          className={
                            conv.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : conv.status === 'resolved'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-orange-100 text-orange-800'
                          }
                        >
                          {conv.status}
                        </Badge>
                      </Button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-sm text-gray-600">Aucune conversation</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
