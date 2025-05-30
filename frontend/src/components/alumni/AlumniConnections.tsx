import React, { useState, useEffect } from 'react';
import { User } from '@/types/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Filter, UserPlus, MessageCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import StudentProfileModal from '@/components/StudentProfileModal';
import ChatModal from '@/components/ChatModal';
import api from '@/api';

type Props = {
  user: User;
};

interface Connection {
  id: string;
  name: string;
  role: string;
  graduationYear: string;
  image: string;
  mutual: number;
  registrationNumber?: string;
  program?: string;
  year?: string;
  section?: string;
  email?: string;
  phone?: string;
  bio?: string;
  interests?: string[];
  address?: string;
  gpa?: string;
  achievements?: Array<{
    title: string;
    description?: string;
    date?: string;
  }>;
  socialLinks?: {
    linkedin?: string;
    website?: string;
  };
}
const AlumniConnections: React.FC<Props> = ({ user }) => {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Connection | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [stats, setStats] = useState({
    totalConnections: 0,
    pendingRequests: 0,
    newThisMonth: 0,
    messagesExchanged: 0
  });

  useEffect(() => {
    const fetchConnections = async () => {
      try {
        setLoading(true);
        const response = await api.get('/messages/conversations');
        const conversations = response.data.data || [];

        // Properly transform the data
        const connections = conversations.map(convo => {
          // Check both possible locations for user data
          const userData = convo.user || convo.lastMessage?.user?.[0];
          
          return {
            id: convo._id || convo.lastMessage?._id,
            name: userData?.name || 'Loading...', // Better fallback
            role: 'Student',
            graduationYear: '',
            image: userData?.profilePhoto || '/default-user.png',
            mutual: 0,
            program: userData?.program || '',
            year: userData?.year || '',
            // Add other fields as needed
            ...(userData || {}) // Spread remaining user data if available
          };
        });

        setConnections(connections);
        setStats({
          totalConnections: connections.length,
          pendingRequests: 0,
          newThisMonth: 0,
          messagesExchanged: 0
        });
      } catch (error) {
        console.error('Error fetching connections:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchConnections();
  }, [user]);

  const filteredConnections = connections.filter(connection =>
    connection.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    connection.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    connection.program?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewProfile = async (student: Connection) => {
    try {
      setLoading(true);
      // First try to fetch complete student profile
      const response = await api.get(`/students/${student.id}`);
      
      // Transform the data to match your Connection interface
      const completeProfile = {
        ...student, // keep the basic info
        ...response.data.data, // add the detailed info
        image: response.data.data.image || student.image
      };

      setSelectedStudent(completeProfile);
      setShowProfileModal(true);
    } catch (error) {
      console.error('Error fetching student profile:', error);
      // Fallback to basic info if detailed fetch fails
      setSelectedStudent(student);
      setShowProfileModal(true);
    } finally {
      setLoading(false);
    }
  };
  const handleStartChat = (student: Connection) => {
    setSelectedStudent(student);
    setShowChatModal(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter Bar */}
      <Card className="p-4 glass-card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search connections..." 
              className="pl-9 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span>Filter</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* Stats Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Connections", value: stats.totalConnections.toString() },
          { label: "Pending Requests", value: stats.pendingRequests.toString() },
          { label: "New This Month", value: stats.newThisMonth.toString() },
          { label: "Messages Exchanged", value: stats.messagesExchanged.toString() }
        ].map((stat, index) => (
          <Card key={index} className="p-4 text-center glass-card">
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className="text-2xl font-bold">{stat.value}</p>
          </Card>
        ))}
      </div>

      {/* Connections Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredConnections.map((connection, index) => (
          <Card key={index} className="overflow-hidden glass-card transition-all duration-300 hover:shadow-medium hover:-translate-y-1">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <img 
                  src={connection.image} 
                  alt={connection.name} 
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div>
                  <h3 className="font-semibold">{connection.name}</h3>
                  <p className="text-sm text-muted-foreground">{connection.role}</p>
                  <p className="text-xs text-muted-foreground">
                    {connection.program} - {connection.year} Year
                  </p>
                </div>
              </div>
              
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
                  {connection.mutual} mutual connections
                </span>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1 text-sm h-9"
                  onClick={() => handleStartChat(connection)}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Message
                </Button>
                <Button 
                  className="flex-1 text-sm h-9"
                  onClick={() => handleViewProfile(connection)}
                >
                  View Profile
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
      
      {/* Empty State */}
      {filteredConnections.length === 0 && (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <UserPlus className="h-10 w-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium mb-2">No connections yet</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            You haven't exchanged messages with any students yet. Start a conversation to see them here.
          </p>
        </div>
      )}

      {/* Student Profile Modal */}
      <Dialog open={showProfileModal} onOpenChange={setShowProfileModal}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Student Profile</DialogTitle>
          </DialogHeader>
          {selectedStudent && (
            <StudentProfileModal 
              student={selectedStudent} 
              onClose={() => setShowProfileModal(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Chat Modal */}
      <Dialog open={showChatModal} onOpenChange={setShowChatModal}>
        <DialogContent className="max-w-2xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Chat with {selectedStudent?.name}</DialogTitle>
          </DialogHeader>
          {selectedStudent && (
            <ChatModal 
              recipient={selectedStudent}
              currentUser={user}
              onClose={() => setShowChatModal(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AlumniConnections;